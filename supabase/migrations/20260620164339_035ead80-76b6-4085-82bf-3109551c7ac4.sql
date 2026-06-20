
-- 1. Extend point source enum
ALTER TYPE public.point_source ADD VALUE IF NOT EXISTS 'redemption';

-- 2. Reward categories
CREATE TABLE public.reward_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reward_categories TO authenticated, anon;
GRANT ALL ON public.reward_categories TO service_role;
ALTER TABLE public.reward_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.reward_categories FOR SELECT USING (true);

-- 3. Membership tiers
CREATE TABLE public.membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  min_lifetime_points INTEGER NOT NULL DEFAULT 0,
  multiplier NUMERIC NOT NULL DEFAULT 1.0,
  color TEXT,
  icon TEXT,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.membership_tiers TO authenticated, anon;
GRANT ALL ON public.membership_tiers TO service_role;
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tiers" ON public.membership_tiers FOR SELECT USING (true);

-- 4. Rewards catalog
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.reward_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  description TEXT,
  terms TEXT,
  image_url TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost >= 0),
  cash_value NUMERIC,
  currency TEXT NOT NULL DEFAULT 'INR',
  validity_days INTEGER NOT NULL DEFAULT 30,
  min_tier TEXT NOT NULL DEFAULT 'bronze',
  featured BOOLEAN NOT NULL DEFAULT false,
  trending BOOLEAN NOT NULL DEFAULT false,
  recommended BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rewards TO authenticated, anon;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active rewards" ON public.rewards FOR SELECT USING (is_active = true);

-- 5. Reward inventory
CREATE TABLE public.reward_inventory (
  reward_id UUID PRIMARY KEY REFERENCES public.rewards(id) ON DELETE CASCADE,
  total_stock INTEGER,           -- NULL = unlimited
  remaining_stock INTEGER,       -- NULL = unlimited
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reward_inventory TO authenticated, anon;
GRANT ALL ON public.reward_inventory TO service_role;
ALTER TABLE public.reward_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read inventory" ON public.reward_inventory FOR SELECT USING (true);

-- 6. Redemptions ledger
CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
  points_spent INTEGER NOT NULL CHECK (points_spent >= 0),
  status TEXT NOT NULL DEFAULT 'completed', -- completed | refunded | cancelled
  transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX redemptions_user_idx ON public.redemptions(user_id, created_at DESC);
CREATE INDEX redemptions_reward_idx ON public.redemptions(reward_id);
GRANT SELECT, INSERT ON public.redemptions TO authenticated;
GRANT ALL ON public.redemptions TO service_role;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own redemptions" ON public.redemptions FOR SELECT USING (auth.uid() = user_id);

-- 7. Coupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
  redemption_id UUID NOT NULL REFERENCES public.redemptions(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  qr_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active | used | expired
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX coupons_user_idx ON public.coupons(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own coupons" ON public.coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users mark own coupons used" ON public.coupons FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. User favourites
CREATE TABLE public.user_rewards (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  favourited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, reward_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_rewards TO authenticated;
GRANT ALL ON public.user_rewards TO service_role;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favourites" ON public.user_rewards FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Membership tier helper
CREATE OR REPLACE FUNCTION public.tier_for_points(_lifetime INTEGER)
RETURNS TABLE (slug TEXT, name TEXT, multiplier NUMERIC, min_lifetime_points INTEGER, next_slug TEXT, next_threshold INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ordered AS (
    SELECT t.slug, t.name, t.multiplier, t.min_lifetime_points,
      LEAD(t.slug) OVER (ORDER BY t.min_lifetime_points) AS next_slug,
      LEAD(t.min_lifetime_points) OVER (ORDER BY t.min_lifetime_points) AS next_threshold
    FROM public.membership_tiers t
  )
  SELECT slug, name, multiplier, min_lifetime_points, next_slug, next_threshold
  FROM ordered
  WHERE min_lifetime_points <= COALESCE(_lifetime, 0)
  ORDER BY min_lifetime_points DESC LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.tier_for_points(INTEGER) TO authenticated, anon;

-- 10. Reward popularity analytics (safe public projection)
CREATE OR REPLACE FUNCTION public.reward_analytics()
RETURNS TABLE (
  reward_id UUID, title TEXT, brand TEXT, image_url TEXT, points_cost INTEGER,
  redemption_count INTEGER, last_redeemed TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.title, r.brand, r.image_url, r.points_cost,
    r.redemption_count,
    (SELECT MAX(created_at) FROM public.redemptions WHERE reward_id = r.id)
  FROM public.rewards r
  WHERE r.is_active = true
  ORDER BY r.redemption_count DESC, r.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.reward_analytics() TO authenticated;

-- 11. Atomic spend_points RPC
CREATE OR REPLACE FUNCTION public.spend_points(_reward_id UUID)
RETURNS TABLE (
  coupon_id UUID, code TEXT, qr_payload TEXT, expires_at TIMESTAMPTZ,
  redemption_id UUID, points_spent INTEGER, new_balance INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  r RECORD;
  w RECORD;
  inv RECORD;
  new_bal INTEGER;
  red_id UUID;
  tx_id UUID;
  cpn_id UUID := gen_random_uuid();
  cpn_code TEXT;
  cpn_qr TEXT;
  cpn_expiry TIMESTAMPTZ;
  cur_month DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000'; END IF;

  -- Load reward
  SELECT * INTO r FROM public.rewards WHERE id = _reward_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reward unavailable' USING ERRCODE = 'P0002'; END IF;

  -- Lock wallet row
  SELECT * INTO w FROM public.points_wallet WHERE user_id = uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet missing' USING ERRCODE = 'P0002'; END IF;

  IF w.balance < r.points_cost THEN
    RAISE EXCEPTION 'Insufficient points: need % have %', r.points_cost, w.balance USING ERRCODE = '22023';
  END IF;

  -- Stock check + decrement (atomic)
  SELECT * INTO inv FROM public.reward_inventory WHERE reward_id = _reward_id FOR UPDATE;
  IF FOUND AND inv.remaining_stock IS NOT NULL THEN
    IF inv.remaining_stock <= 0 THEN
      RAISE EXCEPTION 'Reward out of stock' USING ERRCODE = '22023';
    END IF;
    UPDATE public.reward_inventory SET remaining_stock = remaining_stock - 1, updated_at = now()
      WHERE reward_id = _reward_id;
  END IF;

  -- Decrement wallet
  new_bal := w.balance - r.points_cost;
  UPDATE public.points_wallet SET
    balance = new_bal,
    lifetime_spent = lifetime_spent + r.points_cost,
    updated_at = now()
  WHERE user_id = uid;

  -- Mirror to profile
  UPDATE public.profiles SET green_points = GREATEST(0, green_points - r.points_cost) WHERE id = uid;

  -- Create redemption first (need its id for coupon)
  red_id := gen_random_uuid();
  INSERT INTO public.redemptions(id, user_id, reward_id, points_spent, status)
    VALUES (red_id, uid, _reward_id, r.points_cost, 'completed');

  -- Create transaction (separate from award_points so we don't double-debit)
  tx_id := gen_random_uuid();
  INSERT INTO public.point_transactions(id, user_id, amount, source, source_id, description)
    VALUES (tx_id, uid, -r.points_cost, 'redemption'::point_source, red_id,
            'Redeemed: ' || r.title);

  UPDATE public.redemptions SET transaction_id = tx_id WHERE id = red_id;
  UPDATE public.rewards SET redemption_count = redemption_count + 1, updated_at = now()
    WHERE id = _reward_id;

  -- Generate coupon
  cpn_code := upper(
    substr(encode(gen_random_bytes(3), 'hex'), 1, 4) || '-' ||
    substr(encode(gen_random_bytes(3), 'hex'), 1, 4) || '-' ||
    substr(encode(gen_random_bytes(3), 'hex'), 1, 4)
  );
  cpn_expiry := now() + (r.validity_days || ' days')::interval;
  cpn_qr := 'ECOR:' || cpn_id::text || ':' || cpn_code;

  INSERT INTO public.coupons(id, user_id, reward_id, redemption_id, code, qr_payload, status, expires_at)
    VALUES (cpn_id, uid, _reward_id, red_id, cpn_code, cpn_qr, 'active', cpn_expiry);

  RETURN QUERY SELECT cpn_id, cpn_code, cpn_qr, cpn_expiry, red_id, r.points_cost, new_bal;
END; $$;

REVOKE EXECUTE ON FUNCTION public.spend_points(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_points(UUID) TO authenticated;

-- 12. Expire coupons helper (callable by anyone signed in; idempotent)
CREATE OR REPLACE FUNCTION public.expire_my_coupons()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER; uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN 0; END IF;
  UPDATE public.coupons SET status = 'expired'
    WHERE user_id = uid AND status = 'active' AND expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;
GRANT EXECUTE ON FUNCTION public.expire_my_coupons() TO authenticated;

-- 13. updated_at trigger for rewards
CREATE TRIGGER trg_rewards_touch BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 14. Seed membership tiers
INSERT INTO public.membership_tiers(name, slug, min_lifetime_points, multiplier, color, icon, benefits, sort_order)
VALUES
  ('Bronze',   'bronze',       0,   1.00, '#A16207', 'medal', '["Access to marketplace","Daily challenges"]'::jsonb, 1),
  ('Silver',   'silver',    1000,   1.10, '#64748B', 'award', '["10% bonus on trip points","Weekly challenges","Exclusive Silver rewards"]'::jsonb, 2),
  ('Gold',     'gold',      5000,   1.25, '#CA8A04', 'trophy','["25% bonus on trip points","Premium rewards access","Priority support"]'::jsonb, 3),
  ('Platinum', 'platinum', 20000,   1.50, '#0EA5E9', 'crown', '["50% bonus on trip points","All Platinum perks","Free monthly coupon"]'::jsonb, 4)
ON CONFLICT (slug) DO NOTHING;

-- 15. Seed categories
INSERT INTO public.reward_categories(name, slug, icon, sort_order) VALUES
  ('Food & Drink',   'food',          'coffee',     1),
  ('Travel',         'travel',        'train',      2),
  ('Shopping',       'shopping',      'shopping-bag', 3),
  ('Entertainment',  'entertainment', 'film',       4),
  ('Eco',            'eco',           'leaf',       5)
ON CONFLICT (slug) DO NOTHING;

-- 16. Seed demo rewards
WITH cat AS (SELECT slug, id FROM public.reward_categories)
INSERT INTO public.rewards(category_id, title, brand, description, terms, image_url, points_cost, cash_value, validity_days, featured, trending, recommended, is_demo)
SELECT (SELECT id FROM cat WHERE slug = c), title, brand, description, terms, image_url, cost, value, days, feat, trend, rec, true
FROM (VALUES
  ('food', '₹100 Coffee Voucher',       'Blue Tokai',     'Enjoy a handcrafted coffee at any outlet',          'Single use. Not valid with other offers.',    NULL, 500,  100, 30, true,  true,  true),
  ('food', 'Buy 1 Get 1 Smoothie',      'Drunken Monkey', 'Two smoothies for the price of one',                 'Valid on weekdays only.',                     NULL, 350,   90, 30, false, true,  false),
  ('entertainment', '₹150 Movie Discount','PVR Cinemas',  'Flat ₹150 off any weekday show',                     'Excludes IMAX and 4DX.',                      NULL, 1500, 150, 45, true,  false, true),
  ('travel', 'Free Metro Ride',         'BMRCL',          'A complimentary single-journey ticket',              'Valid on any line. One-time use.',            NULL, 300,   50, 14, false, true,  true),
  ('travel', '₹50 Bus Pass Top-up',     'BMTC',           'Top up your daily pass',                             'Add value at any depot or partner kiosk.',    NULL, 250,   50, 30, false, false, false),
  ('shopping', '15% off books',         'Crossword',      'Discount on any in-store purchase',                  'Max discount ₹500. Excludes textbooks.',      NULL, 800,  500, 60, false, false, true),
  ('shopping', '20% off running gear',  'Decathlon',      'On select running & cycling apparel',                'Valid in-store and online.',                  NULL, 1200, 600, 45, true,  false, false),
  ('eco',    'Plant a Tree',            'Grow-Trees',     'We plant a sapling in your name',                    'Certificate emailed within 7 days.',          NULL, 700,    0, 90, false, true,  true),
  ('eco',    '10% off reusables',       'EcoRight',       'Discount on bottles, bags and lunchboxes',           'One-time use per account.',                   NULL, 400,  200, 30, false, false, true),
  ('food',   'Free Cold-Pressed Juice', 'Raw Pressery',   'Any 250ml bottle on us',                             'In-store redemption only.',                   NULL, 450,  120, 21, false, false, false)
) AS s(c, title, brand, description, terms, image_url, cost, value, days, feat, trend, rec)
ON CONFLICT DO NOTHING;

-- 17. Inventory rows (limited stock for trending demo)
INSERT INTO public.reward_inventory(reward_id, total_stock, remaining_stock)
SELECT id, 250, 250 FROM public.rewards WHERE trending = true
ON CONFLICT (reward_id) DO NOTHING;
