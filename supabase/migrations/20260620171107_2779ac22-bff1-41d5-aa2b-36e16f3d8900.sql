
-- ============================================================
-- PHASE 9: Eco Score, Demo Universe, Globe & Public Profiles
-- ============================================================

-- 1. DEMO USERS (synthetic showcase universe, no auth.users FK) ------------
CREATE TABLE IF NOT EXISTS public.demo_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  profile_photo   TEXT,
  state           TEXT NOT NULL,
  city            TEXT NOT NULL,
  area            TEXT NOT NULL,
  latitude        NUMERIC NOT NULL,
  longitude       NUMERIC NOT NULL,
  home_lat        NUMERIC,
  home_lng        NUMERIC,
  work_lat        NUMERIC,
  work_lng        NUMERIC,
  green_points    INTEGER NOT NULL DEFAULT 0,
  trust_score     INTEGER NOT NULL DEFAULT 50,
  verified_pct    INTEGER NOT NULL DEFAULT 0,    -- 0..100
  total_co2       NUMERIC NOT NULL DEFAULT 0,
  total_saved     NUMERIC NOT NULL DEFAULT 0,
  total_trips     INTEGER NOT NULL DEFAULT 0,
  total_distance  NUMERIC NOT NULL DEFAULT 0,
  challenge_count INTEGER NOT NULL DEFAULT 0,
  badge_count     INTEGER NOT NULL DEFAULT 0,
  walk_pct        INTEGER NOT NULL DEFAULT 0,
  cycle_pct       INTEGER NOT NULL DEFAULT 0,
  metro_pct       INTEGER NOT NULL DEFAULT 0,
  bus_pct         INTEGER NOT NULL DEFAULT 0,
  ev_pct          INTEGER NOT NULL DEFAULT 0,
  car_pct         INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.demo_users TO anon, authenticated;
GRANT ALL ON public.demo_users TO service_role;
ALTER TABLE public.demo_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_users readable" ON public.demo_users FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS demo_users_geo_idx ON public.demo_users(state, city, area);
CREATE INDEX IF NOT EXISTS demo_users_points_idx ON public.demo_users(green_points DESC);

-- Demo posts for community feed flavor ----------------------------------
CREATE TABLE IF NOT EXISTS public.demo_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_user_id UUID NOT NULL REFERENCES public.demo_users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  co2_saved    NUMERIC NOT NULL DEFAULT 0,
  type         TEXT NOT NULL DEFAULT 'achievement',
  like_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.demo_posts TO anon, authenticated;
GRANT ALL ON public.demo_posts TO service_role;
ALTER TABLE public.demo_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_posts readable" ON public.demo_posts FOR SELECT TO anon, authenticated USING (true);

-- 2. PROFILE ENHANCEMENTS ---------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS previous_rank INTEGER,
  ADD COLUMN IF NOT EXISTS eco_score     INTEGER NOT NULL DEFAULT 0;

-- 3. ECO SCORE & VERIFICATION HELPERS --------------------------------------
CREATE OR REPLACE FUNCTION public.compute_eco_score(
  _points INTEGER, _trust INTEGER, _verified_pct INTEGER,
  _saved NUMERIC, _challenges INTEGER
) RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(0, ROUND(
       COALESCE(_points,0)               * 0.35
     + COALESCE(_saved,0)        * 2     * 0.30
     + COALESCE(_trust,50)       * 5     * 0.15
     + COALESCE(_verified_pct,0) * 5     * 0.10
     + COALESCE(_challenges,0)   * 20    * 0.10
  ))::int;
$$;

CREATE OR REPLACE FUNCTION public.verification_tier(_trust INTEGER, _verified_pct INTEGER)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN COALESCE(_trust,0)        >= 90 AND COALESCE(_verified_pct,0) >= 80 THEN 'eco_leader'
    WHEN COALESCE(_trust,0)        >= 75 AND COALESCE(_verified_pct,0) >= 60 THEN 'community_champion'
    WHEN COALESCE(_trust,0)        >= 60                                   THEN 'trusted_contributor'
    WHEN COALESCE(_trust,0)        >= 40                                   THEN 'eco_explorer'
    ELSE 'new_member'
  END;
$$;

-- Compute a real user's verified % from verification_records
CREATE OR REPLACE FUNCTION public.user_verified_pct(_user_id UUID)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN COUNT(*) = 0 THEN 0
              ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE verification_type IN ('gps','ticket','receipt'))
                                / NULLIF(COUNT(*),0))::int
         END
  FROM public.trips WHERE user_id = _user_id;
$$;

-- 4. UNIFIED LEADERBOARD V2 (real + demo) ----------------------------------
DROP FUNCTION IF EXISTS public.leaderboard_v2(text, text, text, text, text, integer);
CREATE OR REPLACE FUNCTION public.leaderboard_v2(
  _scope  TEXT DEFAULT 'global',  -- global | state | city | area
  _filter TEXT DEFAULT 'all',     -- all | verified | most_improved | most_sustainable
  _state  TEXT DEFAULT NULL,
  _city   TEXT DEFAULT NULL,
  _area   TEXT DEFAULT NULL,
  _limit  INTEGER DEFAULT 50
) RETURNS TABLE(
  user_id UUID, is_demo BOOLEAN,
  name TEXT, profile_photo TEXT,
  state TEXT, city TEXT, area TEXT,
  green_points INTEGER, trust_score INTEGER, verified_pct INTEGER,
  total_saved NUMERIC, total_trips INTEGER, challenge_count INTEGER,
  eco_score INTEGER, tier TEXT,
  rank BIGINT, previous_rank INTEGER, rank_change INTEGER
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    -- real users
    SELECT
      p.id AS user_id, false AS is_demo,
      COALESCE(NULLIF(p.name,''),'Anonymous') AS name, p.profile_photo,
      p.state, p.city, p.area,
      p.green_points, p.trust_score,
      public.user_verified_pct(p.id) AS verified_pct,
      COALESCE(s.total_saved,0)      AS total_saved,
      COALESCE(s.total_trips,0)      AS total_trips,
      COALESCE(s.challenge_count,0)  AS challenge_count,
      p.previous_rank
    FROM public.profiles p
    LEFT JOIN public.user_statistics s ON s.user_id = p.id
    WHERE p.onboarding_complete = true
    UNION ALL
    SELECT
      d.id AS user_id, true AS is_demo,
      d.name, d.profile_photo,
      d.state, d.city, d.area,
      d.green_points, d.trust_score, d.verified_pct,
      d.total_saved, d.total_trips, d.challenge_count,
      NULL::int
    FROM public.demo_users d
  ),
  scoped AS (
    SELECT *,
      public.compute_eco_score(green_points, trust_score, verified_pct, total_saved, challenge_count) AS eco_score,
      public.verification_tier(trust_score, verified_pct) AS tier
    FROM base
    WHERE
      (_scope = 'global')
      OR (_scope = 'state' AND state = _state)
      OR (_scope = 'city'  AND city  = _city  AND (_state IS NULL OR state = _state))
      OR (_scope = 'area'  AND area  = _area  AND city = _city AND state = _state)
  ),
  filtered AS (
    SELECT * FROM scoped
    WHERE CASE _filter
      WHEN 'verified'         THEN trust_score >= 75 AND verified_pct >= 60
      WHEN 'most_sustainable' THEN total_saved > 0
      ELSE TRUE
    END
  ),
  ordered AS (
    SELECT *,
      RANK() OVER (
        ORDER BY CASE _filter
          WHEN 'most_sustainable' THEN total_saved
          WHEN 'most_improved'    THEN total_saved
          ELSE NULL END DESC NULLS LAST,
          eco_score DESC, green_points DESC
      ) AS rnk
    FROM filtered
  )
  SELECT
    user_id, is_demo, name, profile_photo,
    state, city, area,
    green_points, trust_score, verified_pct,
    total_saved, total_trips, challenge_count,
    eco_score, tier,
    rnk, previous_rank,
    CASE WHEN previous_rank IS NULL THEN 0
         ELSE (previous_rank - rnk::int) END
  FROM ordered
  ORDER BY rnk
  LIMIT GREATEST(1, LEAST(_limit, 200));
END $$;

-- 5. PUBLIC PROFILE RPC ----------------------------------------------------
DROP FUNCTION IF EXISTS public.public_profile(uuid);
CREATE OR REPLACE FUNCTION public.public_profile(_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  out JSONB; r RECORD; d RECORD;
BEGIN
  -- Try real user first
  SELECT
    p.id, p.name, p.profile_photo, p.state, p.city, p.area, p.country,
    p.green_points, p.trust_score, p.trust_level, p.location_verified,
    p.created_at, p.eco_score, p.previous_rank,
    COALESCE(s.total_saved,0) AS total_saved,
    COALESCE(s.total_co2,0)   AS total_co2,
    COALESCE(s.total_trips,0) AS total_trips,
    COALESCE(s.total_distance,0) AS total_distance,
    COALESCE(s.challenge_count,0) AS challenge_count,
    COALESCE(s.badge_count,0) AS badge_count,
    public.user_verified_pct(p.id) AS verified_pct
  INTO r
  FROM public.profiles p
  LEFT JOIN public.user_statistics s ON s.user_id = p.id
  WHERE p.id = _user_id;

  IF FOUND THEN
    out := jsonb_build_object(
      'is_demo', false,
      'id', r.id, 'name', COALESCE(NULLIF(r.name,''),'Anonymous'),
      'photo', r.profile_photo,
      'location', jsonb_build_object('state', r.state, 'city', r.city, 'area', r.area, 'country', r.country),
      'green_points', r.green_points, 'trust_score', r.trust_score,
      'trust_level', r.trust_level, 'verified_pct', r.verified_pct,
      'location_verified', r.location_verified,
      'created_at', r.created_at,
      'eco_score', public.compute_eco_score(r.green_points, r.trust_score, r.verified_pct, r.total_saved, r.challenge_count),
      'tier', public.verification_tier(r.trust_score, r.verified_pct),
      'stats', jsonb_build_object(
        'total_saved', r.total_saved, 'total_co2', r.total_co2,
        'total_trips', r.total_trips, 'total_distance', r.total_distance,
        'challenges', r.challenge_count, 'badges', r.badge_count
      ),
      'transport', (
        SELECT COALESCE(jsonb_object_agg(transport_mode, cnt), '{}'::jsonb)
        FROM (SELECT transport_mode, COUNT(*) cnt FROM public.trips WHERE user_id = _user_id GROUP BY transport_mode) t
      ),
      'badges', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'icon', b.icon, 'tier', b.tier)), '[]'::jsonb)
        FROM public.user_badges ub JOIN public.badges b ON b.id = ub.badge_id
        WHERE ub.user_id = _user_id
      ),
      'recent_activity', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('title', title, 'type', type, 'points', points_awarded, 'at', created_at) ORDER BY created_at DESC), '[]'::jsonb)
        FROM (SELECT title, type, points_awarded, created_at FROM public.achievement_history WHERE user_id = _user_id ORDER BY created_at DESC LIMIT 10) a
      )
    );
    RETURN out;
  END IF;

  -- Otherwise: demo user
  SELECT * INTO d FROM public.demo_users WHERE id = _user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  out := jsonb_build_object(
    'is_demo', true,
    'id', d.id, 'name', d.name, 'photo', d.profile_photo,
    'location', jsonb_build_object('state', d.state, 'city', d.city, 'area', d.area, 'country', 'India'),
    'green_points', d.green_points, 'trust_score', d.trust_score,
    'trust_level', CASE WHEN d.trust_score >= 90 THEN 'eco_leader'
                        WHEN d.trust_score >= 70 THEN 'trusted'
                        WHEN d.trust_score >= 50 THEN 'standard'
                        ELSE 'needs_verification' END,
    'verified_pct', d.verified_pct,
    'location_verified', true,
    'created_at', d.created_at,
    'eco_score', public.compute_eco_score(d.green_points, d.trust_score, d.verified_pct, d.total_saved, d.challenge_count),
    'tier', public.verification_tier(d.trust_score, d.verified_pct),
    'stats', jsonb_build_object(
      'total_saved', d.total_saved, 'total_co2', d.total_co2,
      'total_trips', d.total_trips, 'total_distance', d.total_distance,
      'challenges', d.challenge_count, 'badges', d.badge_count
    ),
    'transport', jsonb_build_object(
      'walk', d.walk_pct, 'cycle', d.cycle_pct, 'metro', d.metro_pct,
      'bus', d.bus_pct, 'ev', d.ev_pct, 'car', d.car_pct
    ),
    'badges', '[]'::jsonb,
    'recent_activity', '[]'::jsonb
  );
  RETURN out;
END $$;

-- 6. GLOBE POINTS & CLUSTERS RPCs ------------------------------------------
DROP FUNCTION IF EXISTS public.globe_points(integer);
CREATE OR REPLACE FUNCTION public.globe_points(_limit INTEGER DEFAULT 800)
RETURNS TABLE(
  id UUID, is_demo BOOLEAN, name TEXT,
  lat NUMERIC, lng NUMERIC,
  state TEXT, city TEXT, area TEXT,
  green_points INTEGER, trust_score INTEGER, verified_pct INTEGER,
  eco_score INTEGER, tier TEXT, total_saved NUMERIC,
  home_lat NUMERIC, home_lng NUMERIC, work_lat NUMERIC, work_lng NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id, false, COALESCE(NULLIF(p.name,''),'Anonymous'),
    p.latitude, p.longitude, p.state, p.city, p.area,
    p.green_points, p.trust_score, public.user_verified_pct(p.id) AS vpct,
    public.compute_eco_score(p.green_points, p.trust_score, public.user_verified_pct(p.id), COALESCE(s.total_saved,0), COALESCE(s.challenge_count,0)),
    public.verification_tier(p.trust_score, public.user_verified_pct(p.id)),
    COALESCE(s.total_saved,0),
    p.home_lat, p.home_lng, p.work_lat, p.work_lng
  FROM public.profiles p
  LEFT JOIN public.user_statistics s ON s.user_id = p.id
  WHERE p.onboarding_complete = true AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
  UNION ALL
  SELECT
    d.id, true, d.name, d.latitude, d.longitude, d.state, d.city, d.area,
    d.green_points, d.trust_score, d.verified_pct,
    public.compute_eco_score(d.green_points, d.trust_score, d.verified_pct, d.total_saved, d.challenge_count),
    public.verification_tier(d.trust_score, d.verified_pct),
    d.total_saved, d.home_lat, d.home_lng, d.work_lat, d.work_lng
  FROM public.demo_users d
  LIMIT GREATEST(50, LEAST(_limit, 2000));
$$;

CREATE OR REPLACE FUNCTION public.globe_clusters()
RETURNS TABLE(state TEXT, city TEXT, lat NUMERIC, lng NUMERIC, user_count BIGINT, total_saved NUMERIC, avg_eco NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH all_users AS (
    SELECT state, city, latitude lat, longitude lng,
      COALESCE(s.total_saved,0) saved,
      public.compute_eco_score(p.green_points, p.trust_score, public.user_verified_pct(p.id), COALESCE(s.total_saved,0), COALESCE(s.challenge_count,0)) eco
    FROM public.profiles p LEFT JOIN public.user_statistics s ON s.user_id=p.id
    WHERE p.onboarding_complete AND p.latitude IS NOT NULL
    UNION ALL
    SELECT state, city, latitude, longitude, total_saved,
      public.compute_eco_score(green_points, trust_score, verified_pct, total_saved, challenge_count)
    FROM public.demo_users
  )
  SELECT state, city, AVG(lat), AVG(lng), COUNT(*), SUM(saved), AVG(eco)
  FROM all_users WHERE city IS NOT NULL AND state IS NOT NULL
  GROUP BY state, city
  ORDER BY COUNT(*) DESC;
$$;

-- 7. SEED THE DEMO UNIVERSE (500 users, 200 posts) -------------------------
CREATE OR REPLACE FUNCTION public.seed_demo_universe() RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  cities JSONB := '[
    {"state":"Maharashtra","city":"Mumbai","lat":19.076,"lng":72.877,"areas":["Bandra","Andheri","Powai","Worli","Dadar"]},
    {"state":"Delhi","city":"New Delhi","lat":28.704,"lng":77.103,"areas":["Connaught Place","Saket","Dwarka","Karol Bagh","Vasant Kunj"]},
    {"state":"Karnataka","city":"Bangalore","lat":12.972,"lng":77.594,"areas":["Indiranagar","Koramangala","Whitefield","HSR Layout","Jayanagar"]},
    {"state":"Telangana","city":"Hyderabad","lat":17.385,"lng":78.486,"areas":["Banjara Hills","Jubilee Hills","Gachibowli","Hitech City","Madhapur"]},
    {"state":"Tamil Nadu","city":"Chennai","lat":13.083,"lng":80.270,"areas":["T Nagar","Adyar","Velachery","Anna Nagar","Mylapore"]},
    {"state":"Maharashtra","city":"Pune","lat":18.520,"lng":73.857,"areas":["Koregaon Park","Baner","Aundh","Kothrud","Viman Nagar"]},
    {"state":"West Bengal","city":"Kolkata","lat":22.572,"lng":88.363,"areas":["Salt Lake","Park Street","New Town","Ballygunge","Howrah"]},
    {"state":"Gujarat","city":"Ahmedabad","lat":23.022,"lng":72.572,"areas":["Satellite","Bopal","Vastrapur","Navrangpura","Maninagar"]},
    {"state":"Rajasthan","city":"Jaipur","lat":26.912,"lng":75.787,"areas":["Malviya Nagar","C-Scheme","Vaishali Nagar","Mansarovar","Raja Park"]},
    {"state":"Uttar Pradesh","city":"Lucknow","lat":26.846,"lng":80.946,"areas":["Gomti Nagar","Hazratganj","Aliganj","Indira Nagar","Jankipuram"]}
  ]'::jsonb;
  first_names TEXT[] := ARRAY['Aarav','Aditi','Anjali','Arjun','Diya','Ishaan','Kavya','Krish','Meera','Neha','Ravi','Riya','Rohan','Sahil','Sara','Vikram','Zara','Aanya','Dev','Ira','Karan','Maya','Nikhil','Priya','Tara','Yash','Vivaan','Ananya','Aryan','Sneha'];
  last_names  TEXT[] := ARRAY['Sharma','Patel','Kumar','Singh','Gupta','Reddy','Iyer','Khan','Mehta','Joshi','Rao','Verma','Shah','Das','Nair','Bose','Pillai','Agarwal','Kapoor','Bhatt'];
  bodies TEXT[] := ARRAY[
    'Cycled 15km to work today 🚴 saved 3.2kg CO₂',
    'Completed the metro week challenge! 🌱',
    'Joined a community tree plantation drive 🌳',
    'Switched to EV — first 100km complete ⚡',
    'Walked instead of cab for the 5th day this week 👟',
    'Our area just hit #1 on the city leaderboard 🏆',
    'Redeemed my coffee voucher with green points ☕',
    'Carpooled to office, 4 of us in one car 🚗',
    'Composting kitchen waste this month ♻️',
    'Skipped 3 flights this quarter, took the train 🚄'
  ];
  c JSONB; n INTEGER := 0; i INTEGER; j INTEGER; uid UUID; lat NUMERIC; lng NUMERIC;
  vp INT; trust INT; pts INT; saved NUMERIC; trips INT; dist NUMERIC; ch INT;
  w INT; cy INT; m INT; b INT; ev INT; car INT; total INT;
BEGIN
  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM public.demo_users LIMIT 1) THEN
    RETURN (SELECT COUNT(*)::int FROM public.demo_users);
  END IF;

  FOR i IN 0..jsonb_array_length(cities)-1 LOOP
    c := cities->i;
    FOR j IN 1..50 LOOP   -- 50 demo users per city × 10 cities = 500
      lat := (c->>'lat')::numeric + (random()-0.5) * 0.08;
      lng := (c->>'lng')::numeric + (random()-0.5) * 0.08;
      trust := 40 + floor(random()*60)::int;          -- 40..99
      vp    := floor(random()*100)::int;
      pts   := 100 + floor(random()*9900)::int;       -- 100..10k
      saved := round((random()*450 + 5)::numeric, 1);
      trips := 5 + floor(random()*200)::int;
      dist  := round((trips * (1 + random()*8))::numeric, 1);
      ch    := floor(random()*25)::int;
      w := floor(random()*30)::int; cy := floor(random()*25)::int;
      m := floor(random()*25)::int; b := floor(random()*20)::int;
      ev := floor(random()*15)::int;
      total := w+cy+m+b+ev; car := GREATEST(0, 100-total);

      uid := gen_random_uuid();
      INSERT INTO public.demo_users(
        id, name, profile_photo, state, city, area,
        latitude, longitude, home_lat, home_lng, work_lat, work_lng,
        green_points, trust_score, verified_pct,
        total_co2, total_saved, total_trips, total_distance,
        challenge_count, badge_count,
        walk_pct, cycle_pct, metro_pct, bus_pct, ev_pct, car_pct
      ) VALUES (
        uid,
        first_names[1 + floor(random()*array_length(first_names,1))::int]
          || ' ' || last_names[1 + floor(random()*array_length(last_names,1))::int],
        'https://i.pravatar.cc/120?u=' || uid::text,
        c->>'state', c->>'city',
        ((c->'areas')->>(floor(random()*5)::int)),
        lat, lng,
        lat + (random()-0.5)*0.01, lng + (random()-0.5)*0.01,
        lat + (random()-0.5)*0.03, lng + (random()-0.5)*0.03,
        pts, trust, vp,
        round((saved * (0.3 + random()*0.7))::numeric, 1), saved, trips, dist,
        ch, floor(random()*8)::int,
        w, cy, m, b, ev, car
      );
      n := n + 1;
    END LOOP;
  END LOOP;

  -- 200 demo posts
  INSERT INTO public.demo_posts(demo_user_id, body, co2_saved, like_count, created_at)
  SELECT d.id, bodies[1 + floor(random()*array_length(bodies,1))::int],
         round((random()*15)::numeric, 1), floor(random()*120)::int,
         now() - (random()*30 || ' days')::interval
  FROM public.demo_users d ORDER BY random() LIMIT 200;

  RETURN n;
END $$;

SELECT public.seed_demo_universe();

-- 8. EXTENDED COMMUNITY FEED including demo posts --------------------------
DROP FUNCTION IF EXISTS public.community_feed_v2(integer);
CREATE OR REPLACE FUNCTION public.community_feed_v2(_limit INTEGER DEFAULT 40)
RETURNS TABLE(
  id UUID, user_id UUID, is_demo BOOLEAN,
  author_name TEXT, author_photo TEXT, author_city TEXT, author_area TEXT,
  body TEXT, co2_saved NUMERIC, like_count INTEGER, created_at TIMESTAMPTZ,
  tier TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  (SELECT po.id, po.user_id, false,
      COALESCE(NULLIF(pr.name,''),'Anonymous'), pr.profile_photo, pr.city, pr.area,
      po.body, po.co2_saved, po.like_count, po.created_at,
      public.verification_tier(pr.trust_score, public.user_verified_pct(pr.id))
    FROM public.posts po JOIN public.profiles pr ON pr.id = po.user_id
    WHERE po.is_hidden = false)
  UNION ALL
  (SELECT p.id, p.demo_user_id, true,
      d.name, d.profile_photo, d.city, d.area,
      p.body, p.co2_saved, p.like_count, p.created_at,
      public.verification_tier(d.trust_score, d.verified_pct)
    FROM public.demo_posts p JOIN public.demo_users d ON d.id = p.demo_user_id)
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;
