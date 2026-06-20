
-- 1. Drop the broad profiles read policy that exposed email/transport_habits/primary_goal
DROP POLICY IF EXISTS "Leaderboard read profiles" ON public.profiles;

-- 2. Tighten ranking_history: own rows only
DROP POLICY IF EXISTS "ranking_history read all" ON public.ranking_history;
CREATE POLICY "ranking_history read own" ON public.ranking_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Rebuild views with security_invoker = false so they bypass RLS,
--    but project ONLY non-sensitive columns. Views are owned by postgres,
--    so they see all profile rows; we never select email/transport_habits/primary_goal.
DROP VIEW IF EXISTS public.leaderboard_individual;
DROP VIEW IF EXISTS public.area_stats;
DROP VIEW IF EXISTS public.city_stats;
DROP VIEW IF EXISTS public.state_stats;
DROP VIEW IF EXISTS public.community_totals;

CREATE VIEW public.leaderboard_individual
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

CREATE VIEW public.area_stats
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
SELECT *, RANK() OVER (ORDER BY total_green_points DESC, avg_saved DESC) AS rank FROM agg;

GRANT SELECT ON public.area_stats TO authenticated;

CREATE VIEW public.city_stats
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
SELECT *, RANK() OVER (ORDER BY total_green_points DESC, avg_saved DESC) AS rank FROM agg;

GRANT SELECT ON public.city_stats TO authenticated;

CREATE VIEW public.state_stats
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
SELECT *, RANK() OVER (ORDER BY total_green_points DESC, avg_saved DESC) AS rank FROM agg;

GRANT SELECT ON public.state_stats TO authenticated;

CREATE VIEW public.community_totals
WITH (security_invoker = false) AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE onboarding_complete = true) AS total_users,
  COALESCE(SUM(s.total_trips), 0) AS total_trips,
  COALESCE(SUM(s.total_distance), 0) AS total_distance,
  COALESCE(SUM(s.total_co2), 0) AS total_co2,
  COALESCE(SUM(s.total_saved), 0) AS total_saved,
  (SELECT COALESCE(SUM(green_points), 0) FROM public.profiles WHERE onboarding_complete = true) AS total_green_points
FROM public.user_statistics s;

GRANT SELECT ON public.community_totals TO authenticated;

-- 4. user_statistics: keep accessible for community aggregation/leaderboard via views,
--    but tighten direct-table reads to own rows only. Views still see all rows (definer).
DROP POLICY IF EXISTS "Leaderboard read stats" ON public.user_statistics;
