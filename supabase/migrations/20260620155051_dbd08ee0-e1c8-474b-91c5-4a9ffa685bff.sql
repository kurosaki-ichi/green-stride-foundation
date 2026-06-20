
-- Add current_rank to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_rank INTEGER;

-- Transport mode enum
DO $$ BEGIN
  CREATE TYPE public.transport_mode AS ENUM ('walk','cycle','bike','bus','metro','car','ev','auto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_type AS ENUM ('manual','gps','ticket','receipt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TRIPS
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transport_mode public.transport_mode NOT NULL,
  distance_km NUMERIC(10,3) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  co2_generated NUMERIC(10,3) NOT NULL DEFAULT 0,
  co2_saved NUMERIC(10,3) NOT NULL DEFAULT 0,
  verification_type public.verification_type NOT NULL DEFAULT 'manual',
  notes TEXT,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips own select" ON public.trips FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "trips own insert" ON public.trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trips own update" ON public.trips FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trips own delete" ON public.trips FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS trips_user_date_idx ON public.trips (user_id, trip_date DESC);

-- CARBON LOGS
CREATE TABLE IF NOT EXISTS public.carbon_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_co2 NUMERIC(10,3) NOT NULL DEFAULT 0,
  weekly_co2 NUMERIC(10,3) NOT NULL DEFAULT 0,
  monthly_co2 NUMERIC(10,3) NOT NULL DEFAULT 0,
  total_co2_saved NUMERIC(10,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carbon_logs TO authenticated;
GRANT ALL ON public.carbon_logs TO service_role;
ALTER TABLE public.carbon_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carbon_logs own select" ON public.carbon_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "carbon_logs own insert" ON public.carbon_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "carbon_logs own update" ON public.carbon_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "carbon_logs own delete" ON public.carbon_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- USER STATISTICS
CREATE TABLE IF NOT EXISTS public.user_statistics (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_distance NUMERIC(12,3) NOT NULL DEFAULT 0,
  total_trips INTEGER NOT NULL DEFAULT 0,
  total_co2 NUMERIC(12,3) NOT NULL DEFAULT 0,
  total_saved NUMERIC(12,3) NOT NULL DEFAULT 0,
  challenge_count INTEGER NOT NULL DEFAULT 0,
  badge_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_statistics TO authenticated;
GRANT ALL ON public.user_statistics TO service_role;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats own select" ON public.user_statistics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "stats own insert" ON public.user_statistics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stats own update" ON public.user_statistics FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create user_statistics on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_statistics (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;
CREATE TRIGGER on_auth_user_created_stats
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_stats();

-- Backfill stats rows for existing users
INSERT INTO public.user_statistics (user_id)
SELECT id FROM auth.users
ON CONFLICT DO NOTHING;

-- Trip aggregation: update user_statistics and carbon_logs after trip insert
CREATE OR REPLACE FUNCTION public.handle_trip_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_daily NUMERIC; v_weekly NUMERIC; v_monthly NUMERIC; v_saved_total NUMERIC;
BEGIN
  -- Upsert user_statistics
  INSERT INTO public.user_statistics (user_id, total_distance, total_trips, total_co2, total_saved, updated_at)
  VALUES (NEW.user_id, NEW.distance_km, 1, NEW.co2_generated, NEW.co2_saved, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_distance = public.user_statistics.total_distance + NEW.distance_km,
    total_trips = public.user_statistics.total_trips + 1,
    total_co2 = public.user_statistics.total_co2 + NEW.co2_generated,
    total_saved = public.user_statistics.total_saved + NEW.co2_saved,
    updated_at = now();

  -- Recompute daily/weekly/monthly/total saved
  SELECT COALESCE(SUM(co2_generated),0) INTO v_daily
    FROM public.trips WHERE user_id = NEW.user_id AND trip_date = NEW.trip_date;
  SELECT COALESCE(SUM(co2_generated),0) INTO v_weekly
    FROM public.trips WHERE user_id = NEW.user_id
      AND trip_date >= date_trunc('week', NEW.trip_date)::date
      AND trip_date <  (date_trunc('week', NEW.trip_date) + interval '7 day')::date;
  SELECT COALESCE(SUM(co2_generated),0) INTO v_monthly
    FROM public.trips WHERE user_id = NEW.user_id
      AND trip_date >= date_trunc('month', NEW.trip_date)::date
      AND trip_date <  (date_trunc('month', NEW.trip_date) + interval '1 month')::date;
  SELECT COALESCE(SUM(co2_saved),0) INTO v_saved_total
    FROM public.trips WHERE user_id = NEW.user_id;

  INSERT INTO public.carbon_logs (user_id, date, daily_co2, weekly_co2, monthly_co2, total_co2_saved)
  VALUES (NEW.user_id, NEW.trip_date, v_daily, v_weekly, v_monthly, v_saved_total)
  ON CONFLICT (user_id, date) DO UPDATE SET
    daily_co2 = EXCLUDED.daily_co2,
    weekly_co2 = EXCLUDED.weekly_co2,
    monthly_co2 = EXCLUDED.monthly_co2,
    total_co2_saved = EXCLUDED.total_co2_saved,
    updated_at = now();

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_trip_insert ON public.trips;
CREATE TRIGGER on_trip_insert
AFTER INSERT ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.handle_trip_insert();

-- updated_at touch
DROP TRIGGER IF EXISTS touch_carbon_logs ON public.carbon_logs;
CREATE TRIGGER touch_carbon_logs BEFORE UPDATE ON public.carbon_logs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_user_statistics ON public.user_statistics;
CREATE TRIGGER touch_user_statistics BEFORE UPDATE ON public.user_statistics
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
