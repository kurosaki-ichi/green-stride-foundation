
-- chat_threads
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ct own" ON public.chat_threads FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS chat_threads_user_idx ON public.chat_threads(user_id, last_message_at DESC);

-- chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  parts JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cm own" ON public.chat_messages FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);

-- user_goals
DO $$ BEGIN
  CREATE TYPE public.goal_kind AS ENUM ('reduce_co2','reach_rank','earn_points','complete_challenges','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.goal_kind NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  description TEXT,
  target NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  ai_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_goals TO authenticated;
GRANT ALL ON public.user_goals TO service_role;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ug own" ON public.user_goals FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- goal_progress (snapshots)
CREATE TABLE IF NOT EXISTS public.goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.user_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.goal_progress TO authenticated;
GRANT ALL ON public.goal_progress TO service_role;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gp own" ON public.goal_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- weekly_reports
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('week','month')),
  period_start DATE NOT NULL,
  summary TEXT NOT NULL,
  highlights JSONB,
  forecast JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period, period_start)
);
GRANT SELECT, INSERT, DELETE ON public.weekly_reports TO authenticated;
GRANT ALL ON public.weekly_reports TO service_role;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wr own" ON public.weekly_reports FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ai_recommendations
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cta_label TEXT,
  cta_link TEXT,
  impact TEXT,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_recommendations TO authenticated;
GRANT ALL ON public.ai_recommendations TO service_role;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ar read own or global" ON public.ai_recommendations FOR SELECT TO authenticated
  USING (is_global = true OR user_id = auth.uid());
CREATE POLICY "ar write own" ON public.ai_recommendations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ar update own" ON public.ai_recommendations FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "ar delete own" ON public.ai_recommendations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- carbon_forecasts cache
CREATE TABLE IF NOT EXISTS public.carbon_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  horizon_days INTEGER NOT NULL,
  current_co2 NUMERIC NOT NULL,
  predicted_co2 NUMERIC NOT NULL,
  recommended_co2 NUMERIC NOT NULL,
  potential_reduction NUMERIC NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, horizon_days)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carbon_forecasts TO authenticated;
GRANT ALL ON public.carbon_forecasts TO service_role;
ALTER TABLE public.carbon_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cf own" ON public.carbon_forecasts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ai_insights cache
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metric NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slot)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai own" ON public.ai_insights FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===== RPCs =====

-- Sustainability score
CREATE OR REPLACE FUNCTION public.sustainability_score(_user_id UUID)
RETURNS TABLE(score INTEGER, transport INTEGER, challenges INTEGER, community INTEGER, trust INTEGER, consistency INTEGER)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_transport INT := 50; v_challenges INT := 0; v_community INT := 0;
  v_trust INT := 50; v_consistency INT := 0; total NUMERIC; green NUMERIC;
  cur_streak INT; ch_done INT; posts INT;
BEGIN
  SELECT COALESCE(SUM(co2_generated),0), COALESCE(SUM(co2_saved),0)
    INTO total, green FROM public.trips WHERE user_id = _user_id;
  IF (total + green) > 0 THEN
    v_transport := LEAST(100, GREATEST(0, ROUND((green / NULLIF(total + green, 0)) * 100)::int));
  END IF;

  SELECT COALESCE(challenge_count, 0) INTO ch_done FROM public.user_statistics WHERE user_id = _user_id;
  v_challenges := LEAST(100, ch_done * 10);

  SELECT COUNT(*)::int INTO posts FROM public.posts WHERE user_id = _user_id AND is_hidden = false;
  v_community := LEAST(100, posts * 8);

  SELECT trust_score INTO v_trust FROM public.profiles WHERE id = _user_id;
  v_trust := COALESCE(v_trust, 50);

  SELECT COALESCE(current_streak, 0) INTO cur_streak FROM public.streaks WHERE user_id = _user_id;
  v_consistency := LEAST(100, cur_streak * 5);

  RETURN QUERY SELECT
    ROUND((v_transport * 0.30 + v_challenges * 0.20 + v_community * 0.15 + v_trust * 0.20 + v_consistency * 0.15))::int,
    v_transport, v_challenges, v_community, v_trust, v_consistency;
END $$;

-- Carbon forecast (linear from last 14 days)
CREATE OR REPLACE FUNCTION public.carbon_forecast(_user_id UUID, _horizon_days INTEGER DEFAULT 30)
RETURNS TABLE(horizon_days INTEGER, current_co2 NUMERIC, predicted_co2 NUMERIC, recommended_co2 NUMERIC, potential_reduction NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  daily_avg NUMERIC; recent_avg NUMERIC; older_avg NUMERIC;
  trend NUMERIC; predicted NUMERIC; current_val NUMERIC; recommended NUMERIC;
BEGIN
  SELECT COALESCE(AVG(co2_generated), 0) INTO daily_avg
    FROM public.trips WHERE user_id = _user_id AND trip_date >= CURRENT_DATE - 30;
  SELECT COALESCE(AVG(co2_generated), 0) INTO recent_avg
    FROM public.trips WHERE user_id = _user_id AND trip_date >= CURRENT_DATE - 7;
  SELECT COALESCE(AVG(co2_generated), 0) INTO older_avg
    FROM public.trips WHERE user_id = _user_id AND trip_date >= CURRENT_DATE - 30 AND trip_date < CURRENT_DATE - 7;

  trend := CASE WHEN older_avg > 0 THEN (recent_avg - older_avg) / older_avg ELSE 0 END;
  current_val := daily_avg * _horizon_days;
  predicted := GREATEST(0, current_val * (1 + trend));
  recommended := current_val * 0.80;
  RETURN QUERY SELECT _horizon_days, ROUND(current_val::numeric, 2), ROUND(predicted::numeric, 2),
    ROUND(recommended::numeric, 2), ROUND((predicted - recommended)::numeric, 2);
END $$;

-- AI context bundle (for system prompt)
CREATE OR REPLACE FUNCTION public.ai_context(_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  prof JSONB; stats JSONB; ranks JSONB; goals JSONB; score JSONB;
  forecast JSONB; transport JSONB; chal JSONB; loc JSONB;
BEGIN
  SELECT to_jsonb(p) - 'profile_photo' INTO prof FROM (
    SELECT name, city, state, area, green_points, trust_score, trust_level, onboarding_complete
    FROM public.profiles WHERE id = _user_id
  ) p;

  SELECT to_jsonb(s) INTO stats FROM (
    SELECT total_distance, total_trips, total_co2, total_saved, challenge_count, badge_count
    FROM public.user_statistics WHERE user_id = _user_id
  ) s;

  SELECT to_jsonb(r) INTO ranks FROM (
    SELECT global_rank, state_rank, city_rank, area_rank, total_users
    FROM public.leaderboard_individual WHERE user_id = _user_id
  ) r;

  SELECT jsonb_agg(jsonb_build_object('title', title, 'target', target, 'current', current_value, 'kind', kind))
    INTO goals FROM public.user_goals WHERE user_id = _user_id AND status = 'active';

  SELECT to_jsonb(s) INTO score FROM public.sustainability_score(_user_id) s;
  SELECT to_jsonb(f) INTO forecast FROM public.carbon_forecast(_user_id, 30) f;

  SELECT jsonb_object_agg(transport_mode, cnt) INTO transport FROM (
    SELECT transport_mode, COUNT(*) AS cnt FROM public.trips WHERE user_id = _user_id GROUP BY transport_mode
  ) t;

  SELECT jsonb_agg(jsonb_build_object('title', c.title, 'progress', uc.progress, 'target', c.target, 'completed', uc.completed))
    INTO chal FROM public.user_challenges uc
    JOIN public.challenges c ON c.id = uc.challenge_id
    WHERE uc.user_id = _user_id ORDER BY uc.updated_at DESC LIMIT 5;

  SELECT jsonb_build_object('city_avg', avg_co2, 'area_rank', rank) INTO loc FROM public._area_stats() s
    JOIN public.profiles p ON p.id = _user_id WHERE s.state = p.state AND s.city = p.city AND s.area = p.area LIMIT 1;

  RETURN jsonb_build_object(
    'profile', prof, 'stats', stats, 'ranks', ranks, 'goals', goals,
    'score', score, 'forecast_30d', forecast, 'transport_modes', transport,
    'challenges', chal, 'location', loc
  );
END $$;

-- Seed global recommendations (visible to all users)
INSERT INTO public.ai_recommendations (kind, title, description, cta_label, cta_link, impact, is_global) VALUES
  ('transport', 'Switch one car trip to metro', 'Replacing a 10 km car trip with metro saves ~1.8 kg CO₂ each time.', 'Log trip', '/tracking', '-12% monthly emissions', true),
  ('challenge', 'Join Cycle Champion this week', 'Cycling 10 km this week earns 200 Green Points and a Bronze badge.', 'View challenge', '/challenges', '+200 points', true),
  ('reward', 'Redeem your nearest coffee voucher', 'You can already afford a partner coffee voucher — use it to celebrate the streak.', 'Browse rewards', '/rewards', '–500 pts', true),
  ('community', 'Share your weekly win with community', 'Posting a verified trip earns 15 bonus points and inspires your area.', 'Open feed', '/community', '+15 points', true)
ON CONFLICT DO NOTHING;
