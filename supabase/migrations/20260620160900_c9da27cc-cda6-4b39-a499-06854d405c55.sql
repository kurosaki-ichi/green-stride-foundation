
-- Replace definer views with invoker views over SECURITY DEFINER functions.
-- Functions bypass RLS internally, but only return non-sensitive columns.

DROP VIEW IF EXISTS public.leaderboard_individual;
DROP VIEW IF EXISTS public.area_stats;
DROP VIEW IF EXISTS public.city_stats;
DROP VIEW IF EXISTS public.state_stats;
DROP VIEW IF EXISTS public.community_totals;

CREATE OR REPLACE FUNCTION public._leaderboard_individual()
RETURNS TABLE (
  user_id uuid, name text, profile_photo text,
  state text, city text, area text,
  green_points integer, trust_score integer,
  total_saved numeric, total_co2 numeric, total_trips integer,
  total_distance numeric, challenge_count integer,
  global_rank bigint, state_rank bigint, city_rank bigint, area_rank bigint,
  total_users bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(NULLIF(p.name, ''), 'Anonymous'),
    p.profile_photo,
    p.state, p.city, p.area,
    p.green_points,
    p.trust_score,
    COALESCE(s.total_saved, 0),
    COALESCE(s.total_co2, 0),
    COALESCE(s.total_trips, 0),
    COALESCE(s.total_distance, 0),
    COALESCE(s.challenge_count, 0),
    RANK() OVER (ORDER BY p.green_points DESC, COALESCE(s.total_saved,0) DESC),
    RANK() OVER (PARTITION BY p.state ORDER BY p.green_points DESC, COALESCE(s.total_saved,0) DESC),
    RANK() OVER (PARTITION BY p.state, p.city ORDER BY p.green_points DESC, COALESCE(s.total_saved,0) DESC),
    RANK() OVER (PARTITION BY p.state, p.city, p.area ORDER BY p.green_points DESC, COALESCE(s.total_saved,0) DESC),
    COUNT(*) OVER ()
  FROM public.profiles p
  LEFT JOIN public.user_statistics s ON s.user_id = p.id
  WHERE p.onboarding_complete = true
$$;
REVOKE EXECUTE ON FUNCTION public._leaderboard_individual() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._leaderboard_individual() TO authenticated;

CREATE VIEW public.leaderboard_individual
WITH (security_invoker = true) AS
SELECT * FROM public._leaderboard_individual();
GRANT SELECT ON public.leaderboard_individual TO authenticated;

CREATE OR REPLACE FUNCTION public._area_stats()
RETURNS TABLE (
  state text, city text, area text,
  active_users bigint, total_green_points bigint,
  total_co2 numeric, total_saved numeric, avg_co2 numeric, avg_saved numeric,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      p.state, p.city, p.area,
      COUNT(*)::bigint AS active_users,
      COALESCE(SUM(p.green_points), 0)::bigint AS total_green_points,
      COALESCE(SUM(s.total_co2), 0)::numeric AS total_co2,
      COALESCE(SUM(s.total_saved), 0)::numeric AS total_saved,
      COALESCE(AVG(s.total_co2), 0)::numeric AS avg_co2,
      COALESCE(AVG(s.total_saved), 0)::numeric AS avg_saved
    FROM public.profiles p
    LEFT JOIN public.user_statistics s ON s.user_id = p.id
    WHERE p.onboarding_complete = true AND p.area IS NOT NULL AND p.city IS NOT NULL AND p.state IS NOT NULL
    GROUP BY p.state, p.city, p.area
  )
  SELECT *, RANK() OVER (ORDER BY total_green_points DESC, avg_saved DESC) FROM agg
$$;
REVOKE EXECUTE ON FUNCTION public._area_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._area_stats() TO authenticated;

CREATE VIEW public.area_stats
WITH (security_invoker = true) AS
SELECT * FROM public._area_stats();
GRANT SELECT ON public.area_stats TO authenticated;

CREATE OR REPLACE FUNCTION public._city_stats()
RETURNS TABLE (
  state text, city text,
  active_users bigint, total_green_points bigint,
  total_co2 numeric, total_saved numeric, avg_co2 numeric, avg_saved numeric,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      p.state, p.city,
      COUNT(*)::bigint AS active_users,
      COALESCE(SUM(p.green_points), 0)::bigint AS total_green_points,
      COALESCE(SUM(s.total_co2), 0)::numeric AS total_co2,
      COALESCE(SUM(s.total_saved), 0)::numeric AS total_saved,
      COALESCE(AVG(s.total_co2), 0)::numeric AS avg_co2,
      COALESCE(AVG(s.total_saved), 0)::numeric AS avg_saved
    FROM public.profiles p
    LEFT JOIN public.user_statistics s ON s.user_id = p.id
    WHERE p.onboarding_complete = true AND p.city IS NOT NULL AND p.state IS NOT NULL
    GROUP BY p.state, p.city
  )
  SELECT *, RANK() OVER (ORDER BY total_green_points DESC, avg_saved DESC) FROM agg
$$;
REVOKE EXECUTE ON FUNCTION public._city_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._city_stats() TO authenticated;

CREATE VIEW public.city_stats
WITH (security_invoker = true) AS
SELECT * FROM public._city_stats();
GRANT SELECT ON public.city_stats TO authenticated;

CREATE OR REPLACE FUNCTION public._state_stats()
RETURNS TABLE (
  state text,
  active_users bigint, total_green_points bigint,
  total_co2 numeric, total_saved numeric, avg_co2 numeric, avg_saved numeric,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      p.state,
      COUNT(*)::bigint AS active_users,
      COALESCE(SUM(p.green_points), 0)::bigint AS total_green_points,
      COALESCE(SUM(s.total_co2), 0)::numeric AS total_co2,
      COALESCE(SUM(s.total_saved), 0)::numeric AS total_saved,
      COALESCE(AVG(s.total_co2), 0)::numeric AS avg_co2,
      COALESCE(AVG(s.total_saved), 0)::numeric AS avg_saved
    FROM public.profiles p
    LEFT JOIN public.user_statistics s ON s.user_id = p.id
    WHERE p.onboarding_complete = true AND p.state IS NOT NULL
    GROUP BY p.state
  )
  SELECT *, RANK() OVER (ORDER BY total_green_points DESC, avg_saved DESC) FROM agg
$$;
REVOKE EXECUTE ON FUNCTION public._state_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._state_stats() TO authenticated;

CREATE VIEW public.state_stats
WITH (security_invoker = true) AS
SELECT * FROM public._state_stats();
GRANT SELECT ON public.state_stats TO authenticated;

CREATE OR REPLACE FUNCTION public._community_totals()
RETURNS TABLE (
  total_users bigint, total_trips bigint, total_distance numeric,
  total_co2 numeric, total_saved numeric, total_green_points bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*)::bigint FROM public.profiles WHERE onboarding_complete = true),
    COALESCE(SUM(s.total_trips), 0)::bigint,
    COALESCE(SUM(s.total_distance), 0)::numeric,
    COALESCE(SUM(s.total_co2), 0)::numeric,
    COALESCE(SUM(s.total_saved), 0)::numeric,
    (SELECT COALESCE(SUM(green_points), 0)::bigint FROM public.profiles WHERE onboarding_complete = true)
  FROM public.user_statistics s
$$;
REVOKE EXECUTE ON FUNCTION public._community_totals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._community_totals() TO authenticated;

CREATE VIEW public.community_totals
WITH (security_invoker = true) AS
SELECT * FROM public._community_totals();
GRANT SELECT ON public.community_totals TO authenticated;
