
-- Enums
CREATE TYPE public.point_source AS ENUM ('trip','challenge','badge','referral','bonus','manual','social');
CREATE TYPE public.challenge_type AS ENUM ('daily','weekly','monthly','seasonal');
CREATE TYPE public.challenge_metric AS ENUM ('distance_walk','distance_cycle','trips_public','trips_total','co2_saved','distance_total');
CREATE TYPE public.badge_tier AS ENUM ('bronze','silver','gold','platinum');
CREATE TYPE public.referral_status AS ENUM ('pending','completed');

-- Points wallet (one per user, mirrored from transactions for fast reads)
CREATE TABLE public.points_wallet (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  month_earned INTEGER NOT NULL DEFAULT 0,
  month_anchor DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.points_wallet TO authenticated;
GRANT ALL ON public.points_wallet TO service_role;
ALTER TABLE public.points_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet owner read" ON public.points_wallet FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Point transactions ledger
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source public.point_source NOT NULL,
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.point_transactions TO authenticated;
GRANT ALL ON public.point_transactions TO service_role;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx owner read" ON public.point_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_pt_user_created ON public.point_transactions(user_id, created_at DESC);

-- Challenges catalog (global)
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type public.challenge_type NOT NULL,
  metric public.challenge_metric NOT NULL,
  target NUMERIC NOT NULL,
  reward INTEGER NOT NULL DEFAULT 50,
  icon TEXT,
  starts_at DATE,
  ends_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges public read" ON public.challenges FOR SELECT TO authenticated USING (is_active);

-- User challenge progress
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress NUMERIC NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, period_start)
);
GRANT SELECT, INSERT, UPDATE ON public.user_challenges TO authenticated;
GRANT ALL ON public.user_challenges TO service_role;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uc owner read" ON public.user_challenges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "uc owner write" ON public.user_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uc owner update" ON public.user_challenges FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Badges catalog
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier public.badge_tier NOT NULL DEFAULT 'bronze',
  criteria_metric TEXT NOT NULL,
  criteria_value NUMERIC NOT NULL,
  reward INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges public read" ON public.badges FOR SELECT TO authenticated USING (true);

-- User badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ub owner read" ON public.user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Streaks
CREATE TABLE public.streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.streaks TO authenticated;
GRANT ALL ON public.streaks TO service_role;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks owner read" ON public.streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email TEXT,
  status public.referral_status NOT NULL DEFAULT 'pending',
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals owner read" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
CREATE POLICY "referrals owner insert" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals(code);

-- Achievement history (chronological feed)
CREATE TABLE public.achievement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.achievement_history TO authenticated;
GRANT ALL ON public.achievement_history TO service_role;
ALTER TABLE public.achievement_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ah owner read" ON public.achievement_history FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== Core point engine =====
CREATE OR REPLACE FUNCTION public.award_points(
  _user_id UUID, _amount INTEGER, _source public.point_source,
  _source_id UUID DEFAULT NULL, _description TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cur_month DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  IF _amount = 0 THEN RETURN; END IF;

  INSERT INTO public.point_transactions(user_id, amount, source, source_id, description)
  VALUES (_user_id, _amount, _source, _source_id, _description);

  INSERT INTO public.points_wallet(user_id, balance, lifetime_earned, lifetime_spent, month_earned, month_anchor)
  VALUES (
    _user_id,
    GREATEST(0, _amount),
    GREATEST(0, _amount),
    GREATEST(0, -_amount),
    GREATEST(0, _amount),
    cur_month
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = public.points_wallet.balance + _amount,
    lifetime_earned = public.points_wallet.lifetime_earned + GREATEST(0, _amount),
    lifetime_spent = public.points_wallet.lifetime_spent + GREATEST(0, -_amount),
    month_earned = CASE
      WHEN public.points_wallet.month_anchor = cur_month
        THEN public.points_wallet.month_earned + GREATEST(0, _amount)
      ELSE GREATEST(0, _amount)
    END,
    month_anchor = cur_month,
    updated_at = now();

  UPDATE public.profiles SET green_points = GREATEST(0, green_points + _amount) WHERE id = _user_id;
END; $$;

-- Points per km by mode (matches PRD spec, scaled by distance)
CREATE OR REPLACE FUNCTION public.points_for_trip(_mode public.transport_mode, _distance NUMERIC)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(0, ROUND(_distance * CASE _mode
    WHEN 'walk'  THEN 10
    WHEN 'cycle' THEN 20
    WHEN 'bus'   THEN 15
    WHEN 'metro' THEN 20
    WHEN 'ev'    THEN 15
    WHEN 'bike'  THEN 5
    WHEN 'auto'  THEN 5
    WHEN 'car'   THEN 0
    ELSE 0 END))::int;
$$;

-- Update streak on activity
CREATE OR REPLACE FUNCTION public.update_streak(_user_id UUID, _date DATE)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cur INTEGER; longest INTEGER; last_date DATE;
BEGIN
  SELECT current_streak, longest_streak, last_activity_date
    INTO cur, longest, last_date
    FROM public.streaks WHERE user_id = _user_id;

  IF NOT FOUND THEN
    INSERT INTO public.streaks(user_id, current_streak, longest_streak, last_activity_date)
    VALUES (_user_id, 1, 1, _date);
    RETURN;
  END IF;

  IF last_date = _date THEN
    RETURN;
  ELSIF last_date = _date - 1 THEN
    cur := cur + 1;
  ELSIF last_date < _date - 1 THEN
    cur := 1;
  ELSE
    RETURN;
  END IF;

  longest := GREATEST(longest, cur);
  UPDATE public.streaks SET current_streak = cur, longest_streak = longest,
    last_activity_date = _date, updated_at = now() WHERE user_id = _user_id;
END; $$;

-- Recompute challenge progress for a user from trips
CREATE OR REPLACE FUNCTION public.recompute_challenges(_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c RECORD; v NUMERIC; period_start DATE; period_end DATE;
  uc_id UUID; uc_done BOOLEAN; uc_claimed TIMESTAMPTZ;
BEGIN
  FOR c IN SELECT * FROM public.challenges WHERE is_active LOOP
    -- compute current period window
    CASE c.type
      WHEN 'daily'    THEN period_start := CURRENT_DATE; period_end := CURRENT_DATE;
      WHEN 'weekly'   THEN period_start := date_trunc('week', CURRENT_DATE)::date; period_end := (period_start + 6);
      WHEN 'monthly'  THEN period_start := date_trunc('month', CURRENT_DATE)::date; period_end := (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date;
      WHEN 'seasonal' THEN period_start := COALESCE(c.starts_at, date_trunc('year', CURRENT_DATE)::date); period_end := COALESCE(c.ends_at, period_start + 89);
    END CASE;

    -- compute metric value
    v := 0;
    CASE c.metric
      WHEN 'distance_walk' THEN
        SELECT COALESCE(SUM(distance_km),0) INTO v FROM public.trips
          WHERE user_id = _user_id AND transport_mode = 'walk' AND trip_date BETWEEN period_start AND period_end;
      WHEN 'distance_cycle' THEN
        SELECT COALESCE(SUM(distance_km),0) INTO v FROM public.trips
          WHERE user_id = _user_id AND transport_mode = 'cycle' AND trip_date BETWEEN period_start AND period_end;
      WHEN 'trips_public' THEN
        SELECT COALESCE(COUNT(*),0) INTO v FROM public.trips
          WHERE user_id = _user_id AND transport_mode IN ('bus','metro') AND trip_date BETWEEN period_start AND period_end;
      WHEN 'trips_total' THEN
        SELECT COALESCE(COUNT(*),0) INTO v FROM public.trips
          WHERE user_id = _user_id AND trip_date BETWEEN period_start AND period_end;
      WHEN 'co2_saved' THEN
        SELECT COALESCE(SUM(co2_saved),0) INTO v FROM public.trips
          WHERE user_id = _user_id AND trip_date BETWEEN period_start AND period_end;
      WHEN 'distance_total' THEN
        SELECT COALESCE(SUM(distance_km),0) INTO v FROM public.trips
          WHERE user_id = _user_id AND trip_date BETWEEN period_start AND period_end;
    END CASE;

    INSERT INTO public.user_challenges(user_id, challenge_id, progress, period_start, completed, completed_at)
    VALUES (_user_id, c.id, v, period_start, v >= c.target, CASE WHEN v >= c.target THEN now() END)
    ON CONFLICT (user_id, challenge_id, period_start) DO UPDATE SET
      progress = EXCLUDED.progress,
      completed = (public.user_challenges.completed OR EXCLUDED.progress >= c.target),
      completed_at = COALESCE(public.user_challenges.completed_at,
        CASE WHEN EXCLUDED.progress >= c.target THEN now() END),
      updated_at = now()
    RETURNING id, completed, claimed_at INTO uc_id, uc_done, uc_claimed;

    -- Auto-claim reward when first completed
    IF uc_done AND uc_claimed IS NULL THEN
      UPDATE public.user_challenges SET claimed_at = now() WHERE id = uc_id;
      PERFORM public.award_points(_user_id, c.reward, 'challenge', c.id, c.title);
      UPDATE public.user_statistics SET challenge_count = challenge_count + 1, updated_at = now()
        WHERE user_id = _user_id;
      INSERT INTO public.achievement_history(user_id, type, title, description, points_awarded)
      VALUES (_user_id, 'challenge', c.title, c.description, c.reward);
    END IF;
  END LOOP;
END; $$;

-- Award badges based on aggregate stats
CREATE OR REPLACE FUNCTION public.evaluate_badges(_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  b RECORD; v NUMERIC; st RECORD; ok BOOLEAN;
BEGIN
  SELECT * INTO st FROM public.user_statistics WHERE user_id = _user_id;
  IF NOT FOUND THEN RETURN; END IF;

  FOR b IN SELECT * FROM public.badges LOOP
    CASE b.criteria_metric
      WHEN 'total_trips'    THEN v := COALESCE(st.total_trips, 0);
      WHEN 'total_distance' THEN v := COALESCE(st.total_distance, 0);
      WHEN 'total_saved'    THEN v := COALESCE(st.total_saved, 0);
      WHEN 'green_points'   THEN SELECT COALESCE(green_points,0) INTO v FROM public.profiles WHERE id = _user_id;
      WHEN 'challenge_count' THEN v := COALESCE(st.challenge_count, 0);
      WHEN 'streak'         THEN SELECT COALESCE(longest_streak,0) INTO v FROM public.streaks WHERE user_id = _user_id;
      WHEN 'distance_cycle' THEN SELECT COALESCE(SUM(distance_km),0) INTO v FROM public.trips WHERE user_id=_user_id AND transport_mode='cycle';
      WHEN 'trips_public'   THEN SELECT COALESCE(COUNT(*),0) INTO v FROM public.trips WHERE user_id=_user_id AND transport_mode IN ('bus','metro');
      ELSE v := 0;
    END CASE;

    IF v >= b.criteria_value THEN
      INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id, b.id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      GET DIAGNOSTICS ok = ROW_COUNT;
      IF ok THEN
        PERFORM public.award_points(_user_id, b.reward, 'badge', b.id, b.name);
        UPDATE public.user_statistics SET badge_count = badge_count + 1, updated_at = now()
          WHERE user_id = _user_id;
        INSERT INTO public.achievement_history(user_id, type, title, description, points_awarded)
        VALUES (_user_id, 'badge', b.name, b.description, b.reward);
      END IF;
    END IF;
  END LOOP;
END; $$;

-- Trip insert trigger: award points + streak + challenges + badges
CREATE OR REPLACE FUNCTION public.gamify_on_trip()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pts INTEGER;
BEGIN
  pts := public.points_for_trip(NEW.transport_mode, NEW.distance_km);
  IF pts > 0 THEN
    PERFORM public.award_points(NEW.user_id, pts, 'trip', NEW.id,
      'Trip: ' || NEW.transport_mode::text || ' ' || NEW.distance_km || ' km');
  END IF;
  PERFORM public.update_streak(NEW.user_id, NEW.trip_date);
  PERFORM public.recompute_challenges(NEW.user_id);
  PERFORM public.evaluate_badges(NEW.user_id);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS gamify_on_trip_trg ON public.trips;
CREATE TRIGGER gamify_on_trip_trg AFTER INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.gamify_on_trip();

-- Initialize wallet & streak rows for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_gamification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.points_wallet(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.streaks(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_gami ON auth.users;
CREATE TRIGGER on_auth_user_created_gami AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_gamification();

-- Backfill wallets/streaks for existing users
INSERT INTO public.points_wallet(user_id, balance, lifetime_earned)
  SELECT id, green_points, green_points FROM public.profiles
  ON CONFLICT DO NOTHING;
INSERT INTO public.streaks(user_id) SELECT id FROM public.profiles ON CONFLICT DO NOTHING;

-- Referral redemption: call when a new user signs up with a code
CREATE OR REPLACE FUNCTION public.redeem_referral(_code TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO r FROM public.referrals WHERE code = _code AND status = 'pending' LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  IF r.referrer_id = uid THEN RETURN; END IF;

  UPDATE public.referrals SET referred_user_id = uid, status = 'completed',
    points_awarded = 100, completed_at = now() WHERE id = r.id;

  PERFORM public.award_points(r.referrer_id, 100, 'referral', r.id, 'Referral bonus');
  PERFORM public.award_points(uid, 100, 'referral', r.id, 'Welcome referral bonus');
END; $$;
