
-- Phase 3: Ranking & Leaderboard infrastructure

-- Weekly ranking snapshots
CREATE TABLE public.ranking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  scope text NOT NULL,  -- 'global' | 'state' | 'city' | 'area'
  rank integer NOT NULL,
  green_points integer NOT NULL DEFAULT 0,
  total_saved numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start, scope)
);

GRANT SELECT, INSERT ON public.ranking_history TO authenticated;
GRANT ALL ON public.ranking_history TO service_role;

ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranking_history read all" ON public.ranking_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ranking_history insert own" ON public.ranking_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Individual leaderboard view (bypasses RLS — SECURITY DEFINER style via default view ownership)
CREATE OR REPLACE VIEW public.leaderboard_individual
WITH (security_invoker = false) AS
SELECT
  p.id AS user_id,
  COALESCE(NULLIF(p.name, ''), 'Anonymous') AS name,
  p.profile_photo,
  p.state, p.city, p.area,
  p.green_points,
  p.trust_score,
  COALESCE(s.total_saved, 0) AS total_saved,
  COALESCE(s.total_co2, 0) AS total_co2,
  COALESCE(s.total_trips, 0) AS total_trips,
  COALESCE(s.total_distance, 0) AS total_distance,
  COALESCE(s.challenge_count, 0) AS challenge_count,
  RANK() OVER (ORDER BY p.green_points DESC, COALESCE(s.total_saved,0) DESC) AS global_rank,
  RANK() OVER (PARTITION BY p.state ORDER BY p.green_points DESC, COALESCE(s.total_saved,0) DESC) AS state_rank,
  RANK() OVER (PARTITION BY p.state, p.city ORDER BY p.green_points DESC, COALESCE(s.total_saved,0) DESC) AS city_rank,
  RANK() OVER (PARTITION BY p.state, p.city, p.area ORDER BY p.green_points DESC, COALESCE(s.total_saved,0) DESC) AS area_rank,
  COUNT(*) OVER () AS total_users
FROM public.profiles p
LEFT JOIN public.user_statistics s ON s.user_id = p.id
WHERE p.onboarding_complete = true;

GRANT SELECT ON public.leaderboard_individual TO authenticated;

-- Area stats view
CREATE OR REPLACE VIEW public.area_stats
WITH (security_invoker = false) AS
WITH agg AS (
  SELECT
    p.state, p.city, p.area,
    COUNT(*) AS active_users,
    COALESCE(SUM(p.green_points), 0) AS total_green_points,
    COALESCE(SUM(s.total_co2), 0) AS total_co2,
    COALESCE(SUM(s.total_saved), 0) AS total_saved,
    COALESCE(AVG(s.total_co2), 0) AS avg_co2,
    COALESCE(AVG(s.total_saved), 0) AS avg_saved
  FROM public.profiles p
  LEFT JOIN public.user_statistics s ON s.user_id = p.id
  WHERE p.onboarding_complete = true AND p.area IS NOT NULL AND p.city IS NOT NULL AND p.state IS NOT NULL
  GROUP BY p.state, p.city, p.area
)
SELECT *,
  RANK() OVER (ORDER BY total_green_points DESC, avg_saved DESC) AS rank
FROM agg;

GRANT SELECT ON public.area_stats TO authenticated;

-- City stats view
CREATE OR REPLACE VIEW public.city_stats
WITH (security_invoker = false) AS
WITH agg AS (
  SELECT
    p.state, p.city,
    COUNT(*) AS active_users,
    COALESCE(SUM(p.green_points), 0) AS total_green_points,
    COALESCE(SUM(s.total_co2), 0) AS total_co2,
    COALESCE(SUM(s.total_saved), 0) AS total_saved,
    COALESCE(AVG(s.total_co2), 0) AS avg_co2,
    COALESCE(AVG(s.total_saved), 0) AS avg_saved
  FROM public.profiles p
  LEFT JOIN public.user_statistics s ON s.user_id = p.id
  WHERE p.onboarding_complete = true AND p.city IS NOT NULL AND p.state IS NOT NULL
  GROUP BY p.state, p.city
)
SELECT *,
  RANK() OVER (ORDER BY total_green_points DESC, avg_saved DESC) AS rank
FROM agg;

GRANT SELECT ON public.city_stats TO authenticated;

-- State stats view
CREATE OR REPLACE VIEW public.state_stats
WITH (security_invoker = false) AS
WITH agg AS (
  SELECT
    p.state,
    COUNT(*) AS active_users,
    COALESCE(SUM(p.green_points), 0) AS total_green_points,
    COALESCE(SUM(s.total_co2), 0) AS total_co2,
    COALESCE(SUM(s.total_saved), 0) AS total_saved,
    COALESCE(AVG(s.total_co2), 0) AS avg_co2,
    COALESCE(AVG(s.total_saved), 0) AS avg_saved
  FROM public.profiles p
  LEFT JOIN public.user_statistics s ON s.user_id = p.id
  WHERE p.onboarding_complete = true AND p.state IS NOT NULL
  GROUP BY p.state
)
SELECT *,
  RANK() OVER (ORDER BY total_green_points DESC, avg_saved DESC) AS rank
FROM agg;

GRANT SELECT ON public.state_stats TO authenticated;

-- Global community totals
CREATE OR REPLACE VIEW public.community_totals
WITH (security_invoker = false) AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE onboarding_complete = true) AS total_users,
  COALESCE(SUM(total_trips), 0) AS total_trips,
  COALESCE(SUM(total_distance), 0) AS total_distance,
  COALESCE(SUM(total_co2), 0) AS total_co2,
  COALESCE(SUM(total_saved), 0) AS total_saved,
  (SELECT COALESCE(SUM(green_points), 0) FROM public.profiles) AS total_green_points
FROM public.user_statistics;

GRANT SELECT ON public.community_totals TO authenticated;

-- Sync profiles.current_rank from latest computed global rank (used by trigger to keep dashboard rank up-to-date)
CREATE OR REPLACE FUNCTION public.sync_user_rank(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r integer;
BEGIN
  SELECT global_rank INTO r FROM public.leaderboard_individual WHERE user_id = _user_id;
  UPDATE public.profiles SET current_rank = r WHERE id = _user_id;
END; $$;

-- Snapshot weekly rankings (called manually or by cron in future)
CREATE OR REPLACE FUNCTION public.snapshot_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wk date := date_trunc('week', CURRENT_DATE)::date;
BEGIN
  INSERT INTO public.ranking_history (user_id, week_start, scope, rank, green_points, total_saved)
  SELECT user_id, wk, 'global', global_rank, green_points, total_saved FROM public.leaderboard_individual
  ON CONFLICT (user_id, week_start, scope) DO UPDATE
    SET rank = EXCLUDED.rank, green_points = EXCLUDED.green_points, total_saved = EXCLUDED.total_saved;
  INSERT INTO public.ranking_history (user_id, week_start, scope, rank, green_points, total_saved)
  SELECT user_id, wk, 'state', state_rank, green_points, total_saved FROM public.leaderboard_individual
  ON CONFLICT (user_id, week_start, scope) DO UPDATE
    SET rank = EXCLUDED.rank, green_points = EXCLUDED.green_points, total_saved = EXCLUDED.total_saved;
  INSERT INTO public.ranking_history (user_id, week_start, scope, rank, green_points, total_saved)
  SELECT user_id, wk, 'city', city_rank, green_points, total_saved FROM public.leaderboard_individual
  ON CONFLICT (user_id, week_start, scope) DO UPDATE
    SET rank = EXCLUDED.rank, green_points = EXCLUDED.green_points, total_saved = EXCLUDED.total_saved;
  INSERT INTO public.ranking_history (user_id, week_start, scope, rank, green_points, total_saved)
  SELECT user_id, wk, 'area', area_rank, green_points, total_saved FROM public.leaderboard_individual
  ON CONFLICT (user_id, week_start, scope) DO UPDATE
    SET rank = EXCLUDED.rank, green_points = EXCLUDED.green_points, total_saved = EXCLUDED.total_saved;
END; $$;

GRANT EXECUTE ON FUNCTION public.snapshot_rankings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_user_rank(uuid) TO authenticated;
