
-- Profiles columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS home_address text,
  ADD COLUMN IF NOT EXISTS home_lat numeric,
  ADD COLUMN IF NOT EXISTS home_lng numeric,
  ADD COLUMN IF NOT EXISTS work_address text,
  ADD COLUMN IF NOT EXISTS work_lat numeric,
  ADD COLUMN IF NOT EXISTS work_lng numeric,
  ADD COLUMN IF NOT EXISTS commute_km numeric,
  ADD COLUMN IF NOT EXISTS location_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_source text,
  ADD COLUMN IF NOT EXISTS trust_level text NOT NULL DEFAULT 'standard';

-- Verification records
CREATE TABLE IF NOT EXISTS public.verification_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,            -- 'location_home' | 'location_work' | 'location_current' | 'trip_gps' | 'trip_ticket' | 'trip_receipt' | 'manual'
  source text NOT NULL,          -- 'gps' | 'address' | 'manual' | 'admin'
  status text NOT NULL DEFAULT 'verified', -- 'verified' | 'pending' | 'rejected' | 'flagged'
  latitude numeric,
  longitude numeric,
  address text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.verification_records TO authenticated;
GRANT ALL ON public.verification_records TO service_role;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vr_select_own" ON public.verification_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "vr_insert_own" ON public.verification_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Verification history (audit of trust score changes)
CREATE TABLE IF NOT EXISTS public.verification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  new_score integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.verification_history TO authenticated;
GRANT ALL ON public.verification_history TO service_role;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vh_select_own" ON public.verification_history FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vr_user ON public.verification_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vh_user ON public.verification_history(user_id, created_at DESC);

-- Trust score recompute
CREATE OR REPLACE FUNCTION public.recompute_trust_score(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score integer := 30;
  loc_verified boolean;
  has_home boolean;
  has_work boolean;
  gps_trips integer;
  ticket_trips integer;
  manual_trips integer;
  total_trips integer;
  fraud_flags integer;
  level text;
BEGIN
  SELECT location_verified, home_lat IS NOT NULL, work_lat IS NOT NULL
    INTO loc_verified, has_home, has_work
    FROM public.profiles WHERE id = _user_id;

  IF loc_verified THEN score := score + 15; END IF;
  IF has_home THEN score := score + 10; END IF;
  IF has_work THEN score := score + 10; END IF;

  SELECT
    COALESCE(SUM(CASE WHEN verification_type = 'gps' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN verification_type IN ('ticket','receipt') THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN verification_type = 'manual' THEN 1 ELSE 0 END), 0),
    COALESCE(COUNT(*), 0)
  INTO gps_trips, ticket_trips, manual_trips, total_trips
  FROM public.trips WHERE user_id = _user_id;

  score := score + LEAST(20, gps_trips * 2);
  score := score + LEAST(15, ticket_trips * 3);
  IF total_trips > 0 THEN
    score := score - LEAST(15, ((manual_trips::numeric / total_trips) * 20)::int);
  END IF;

  SELECT COUNT(*) INTO fraud_flags FROM public.verification_records
    WHERE user_id = _user_id AND status = 'flagged' AND created_at > now() - interval '30 days';
  score := score - LEAST(40, fraud_flags * 10);

  score := GREATEST(0, LEAST(100, score));

  level := CASE
    WHEN score >= 90 THEN 'eco_leader'
    WHEN score >= 70 THEN 'trusted'
    WHEN score >= 50 THEN 'standard'
    ELSE 'needs_verification'
  END;

  UPDATE public.profiles SET trust_score = score, trust_level = level WHERE id = _user_id;
  RETURN score;
END; $$;

-- Record verification helper (called from client)
CREATE OR REPLACE FUNCTION public.record_verification(
  _kind text, _source text, _status text DEFAULT 'verified',
  _lat numeric DEFAULT NULL, _lng numeric DEFAULT NULL,
  _address text DEFAULT NULL, _metadata jsonb DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); new_score integer; delta integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  INSERT INTO public.verification_records(user_id, kind, source, status, latitude, longitude, address, metadata)
  VALUES (uid, _kind, _source, _status, _lat, _lng, _address, _metadata);

  -- Update profile location flags for location verifications
  IF _kind = 'location_current' AND _status = 'verified' THEN
    UPDATE public.profiles SET location_verified = true,
      verification_source = _source,
      latitude = COALESCE(_lat, latitude),
      longitude = COALESCE(_lng, longitude)
      WHERE id = uid;
  END IF;

  delta := CASE _status
    WHEN 'verified' THEN CASE _kind
      WHEN 'location_current' THEN 10
      WHEN 'location_home' THEN 8
      WHEN 'location_work' THEN 8
      WHEN 'trip_gps' THEN 5
      WHEN 'trip_ticket' THEN 3
      ELSE 1 END
    WHEN 'flagged' THEN -10
    ELSE 0 END;

  new_score := public.recompute_trust_score(uid);

  INSERT INTO public.verification_history(user_id, delta, reason, new_score)
  VALUES (uid, delta, _kind || ':' || _status, new_score);

  RETURN new_score;
END; $$;

REVOKE EXECUTE ON FUNCTION public.recompute_trust_score(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_verification(text,text,text,numeric,numeric,text,jsonb) TO authenticated;

-- Fraud detection: same trip too soon, impossible distance
CREATE OR REPLACE FUNCTION public.detect_trip_fraud()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE recent_count integer; flagged boolean := false;
BEGIN
  -- Impossible: > 300 km in < 60 minutes (excluding metro/ev)
  IF NEW.distance_km > 300 AND NEW.duration_minutes < 60 THEN
    flagged := true;
  END IF;
  -- Duplicate-ish: same mode + distance within 2 mins on same date
  SELECT COUNT(*) INTO recent_count FROM public.trips
    WHERE user_id = NEW.user_id AND id <> NEW.id
      AND trip_date = NEW.trip_date AND transport_mode = NEW.transport_mode
      AND ABS(distance_km - NEW.distance_km) < 0.5
      AND created_at > now() - interval '2 minutes';
  IF recent_count > 0 THEN flagged := true; END IF;

  IF flagged THEN
    INSERT INTO public.verification_records(user_id, kind, source, status, metadata)
    VALUES (NEW.user_id, 'manual', 'system', 'flagged',
      jsonb_build_object('trip_id', NEW.id, 'distance', NEW.distance_km, 'duration', NEW.duration_minutes));
    PERFORM public.recompute_trust_score(NEW.user_id);
  ELSE
    PERFORM public.recompute_trust_score(NEW.user_id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_detect_trip_fraud ON public.trips;
CREATE TRIGGER trg_detect_trip_fraud AFTER INSERT ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.detect_trip_fraud();
