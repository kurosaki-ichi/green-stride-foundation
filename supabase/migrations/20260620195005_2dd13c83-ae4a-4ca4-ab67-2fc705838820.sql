
-- 1. Restrict demo_users to authenticated; access is via SECURITY DEFINER RPCs only
DROP POLICY IF EXISTS "demo_users readable" ON public.demo_users;
REVOKE ALL ON public.demo_users FROM anon;
GRANT SELECT ON public.demo_users TO authenticated;
CREATE POLICY "demo_users no direct read" ON public.demo_users FOR SELECT TO authenticated USING (false);

-- 2. Restrict community_progress reads to user's own rows
DROP POLICY IF EXISTS "cp read" ON public.community_progress;
CREATE POLICY "cp read own" ON public.community_progress FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3. Set immutable search_path on remaining functions flagged by linter
ALTER FUNCTION public.compute_eco_score(integer, integer, integer, numeric, integer) SET search_path = public;
ALTER FUNCTION public.points_for_trip(transport_mode, numeric) SET search_path = public;
ALTER FUNCTION public.verification_tier(integer, integer) SET search_path = public;
ALTER FUNCTION public.seed_demo_universe() SET search_path = public;

-- 4. Revoke EXECUTE from anon/PUBLIC on SECURITY DEFINER functions; app is auth-gated
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon', r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated', r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Also lock down seed_demo_universe (non-definer) from anon
REVOKE EXECUTE ON FUNCTION public.seed_demo_universe() FROM PUBLIC, anon;
