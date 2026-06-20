
-- Phase 7: Community Feed

-- Extend point_source enum (idempotent)
DO $$ BEGIN
  ALTER TYPE public.point_source ADD VALUE IF NOT EXISTS 'social_post';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.point_source ADD VALUE IF NOT EXISTS 'social_engagement';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.post_type AS ENUM ('text','image','video','achievement','challenge','trip','milestone');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.post_verification AS ENUM ('verified','unverified','community_supported');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.reaction_kind AS ENUM ('like','celebrate','inspiring','eco_hero');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.community_scope AS ENUM ('area','city','state');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- posts
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.post_type NOT NULL DEFAULT 'text',
  body TEXT,
  media_url TEXT,
  media_type TEXT,
  co2_saved NUMERIC DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  verification public.post_verification NOT NULL DEFAULT 'unverified',
  verification_source TEXT,
  source_id UUID,
  area TEXT, city TEXT, state TEXT,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  reported_count INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts read all" ON public.posts FOR SELECT TO authenticated USING (is_hidden = false OR user_id = auth.uid());
CREATE POLICY "posts insert own" ON public.posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "posts update own" ON public.posts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "posts delete own" ON public.posts FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS posts_created_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_user_idx ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_geo_idx ON public.posts(state, city, area);

-- post_media (additional media)
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_media TO authenticated;
GRANT ALL ON public.post_media TO service_role;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_media read" ON public.post_media FOR SELECT TO authenticated USING (true);
CREATE POLICY "post_media insert own" ON public.post_media FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
);
CREATE POLICY "post_media delete own" ON public.post_media FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
);

-- post_reactions
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.reaction_kind NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, kind)
);
GRANT SELECT, INSERT, DELETE ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_reactions TO service_role;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions read" ON public.post_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions insert own" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reactions delete own" ON public.post_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  reported_count INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments read" ON public.comments FOR SELECT TO authenticated USING (is_hidden = false OR user_id = auth.uid());
CREATE POLICY "comments insert own" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments delete own" ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- comment_likes
CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clikes read" ON public.comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clikes insert own" ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "clikes delete own" ON public.comment_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- post_reports
CREATE TABLE IF NOT EXISTS public.post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
GRANT SELECT, INSERT ON public.post_reports TO authenticated;
GRANT ALL ON public.post_reports TO service_role;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports insert own" ON public.post_reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reports read own" ON public.post_reports FOR SELECT TO authenticated USING (user_id = auth.uid());

-- follows
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows read" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows insert own" ON public.follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows delete own" ON public.follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- community_challenges
CREATE TABLE IF NOT EXISTS public.community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.community_scope NOT NULL,
  state TEXT, city TEXT, area TEXT,
  title TEXT NOT NULL,
  description TEXT,
  metric TEXT NOT NULL,
  target NUMERIC NOT NULL,
  current_progress NUMERIC NOT NULL DEFAULT 0,
  reward INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_challenges TO authenticated;
GRANT ALL ON public.community_challenges TO service_role;
ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc read" ON public.community_challenges FOR SELECT TO authenticated USING (true);

-- community_progress
CREATE TABLE IF NOT EXISTS public.community_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.community_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.community_progress TO authenticated;
GRANT ALL ON public.community_progress TO service_role;
ALTER TABLE public.community_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp read" ON public.community_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "cp upsert own" ON public.community_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "cp update own" ON public.community_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Triggers: counters
CREATE OR REPLACE FUNCTION public.post_after_reaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_post_reaction ON public.post_reactions;
CREATE TRIGGER trg_post_reaction AFTER INSERT OR DELETE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.post_after_reaction();

CREATE OR REPLACE FUNCTION public.post_after_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_post_comment ON public.comments;
CREATE TRIGGER trg_post_comment AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.post_after_comment();

CREATE OR REPLACE FUNCTION public.comment_after_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_comment_like ON public.comment_likes;
CREATE TRIGGER trg_comment_like AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.comment_after_like();

-- Post-create: award points + auto-fill geo from profile
CREATE OR REPLACE FUNCTION public.on_post_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p RECORD; pts INTEGER;
BEGIN
  SELECT area, city, state INTO p FROM public.profiles WHERE id = NEW.user_id;
  IF NEW.area IS NULL THEN NEW.area := p.area; END IF;
  IF NEW.city IS NULL THEN NEW.city := p.city; END IF;
  IF NEW.state IS NULL THEN NEW.state := p.state; END IF;
  pts := CASE WHEN NEW.verification = 'verified' THEN 15 ELSE 5 END;
  NEW.points_earned := pts;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_on_post_insert ON public.posts;
CREATE TRIGGER trg_on_post_insert BEFORE INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.on_post_insert();

CREATE OR REPLACE FUNCTION public.on_post_inserted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.award_points(NEW.user_id, NEW.points_earned, 'social_post', NEW.id,
    'Community post (' || NEW.type::text || ')');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_on_post_inserted ON public.posts;
CREATE TRIGGER trg_on_post_inserted AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.on_post_inserted();

-- Feed RPC: enriched posts with author + viewer reactions
CREATE OR REPLACE FUNCTION public.community_feed(_limit INTEGER DEFAULT 30, _scope TEXT DEFAULT 'all')
RETURNS TABLE(
  id UUID, user_id UUID, author_name TEXT, author_photo TEXT, author_area TEXT, author_city TEXT,
  type public.post_type, body TEXT, media_url TEXT, media_type TEXT,
  co2_saved NUMERIC, points_earned INTEGER, verification public.post_verification,
  area TEXT, city TEXT, state TEXT,
  like_count INTEGER, comment_count INTEGER, share_count INTEGER,
  created_at TIMESTAMPTZ, viewer_liked BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH me AS (SELECT id, area, city, state FROM public.profiles WHERE id = auth.uid())
  SELECT
    po.id, po.user_id,
    COALESCE(NULLIF(pr.name,''), 'Anonymous'),
    pr.profile_photo, pr.area, pr.city,
    po.type, po.body, po.media_url, po.media_type,
    po.co2_saved, po.points_earned, po.verification,
    po.area, po.city, po.state,
    po.like_count, po.comment_count, po.share_count,
    po.created_at,
    EXISTS (SELECT 1 FROM public.post_reactions r
            WHERE r.post_id = po.id AND r.user_id = auth.uid())
  FROM public.posts po
  JOIN public.profiles pr ON pr.id = po.user_id
  LEFT JOIN me ON true
  WHERE po.is_hidden = false
    AND (
      _scope = 'all'
      OR (_scope = 'city' AND po.city IS NOT DISTINCT FROM me.city)
      OR (_scope = 'area' AND po.area IS NOT DISTINCT FROM me.area)
      OR (_scope = 'following' AND po.user_id IN (
            SELECT followed_id FROM public.follows WHERE follower_id = auth.uid()
          ))
    )
  ORDER BY po.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 100));
$$;

-- Toggle reaction
CREATE OR REPLACE FUNCTION public.toggle_reaction(_post_id UUID, _kind public.reaction_kind DEFAULT 'like')
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid UUID := auth.uid(); existed BOOLEAN;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  DELETE FROM public.post_reactions WHERE post_id = _post_id AND user_id = uid AND kind = _kind
    RETURNING true INTO existed;
  IF existed IS TRUE THEN RETURN false; END IF;
  INSERT INTO public.post_reactions(post_id, user_id, kind) VALUES (_post_id, uid, _kind);
  RETURN true;
END $$;

-- Toggle follow
CREATE OR REPLACE FUNCTION public.toggle_follow(_target UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid UUID := auth.uid(); existed BOOLEAN;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF uid = _target THEN RAISE EXCEPTION 'Cannot follow yourself'; END IF;
  DELETE FROM public.follows WHERE follower_id = uid AND followed_id = _target RETURNING true INTO existed;
  IF existed IS TRUE THEN RETURN false; END IF;
  INSERT INTO public.follows(follower_id, followed_id) VALUES (uid, _target);
  RETURN true;
END $$;

-- Report post
CREATE OR REPLACE FUNCTION public.report_post(_post_id UUID, _reason TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid UUID := auth.uid(); cnt INTEGER;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  INSERT INTO public.post_reports(post_id, user_id, reason) VALUES (_post_id, uid, _reason)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  UPDATE public.posts SET reported_count = (
    SELECT COUNT(*) FROM public.post_reports WHERE post_id = _post_id
  ) WHERE id = _post_id RETURNING reported_count INTO cnt;
  IF cnt >= 5 THEN UPDATE public.posts SET is_hidden = true WHERE id = _post_id; END IF;
END $$;

-- Top contributors
CREATE OR REPLACE FUNCTION public.top_contributors(_limit INTEGER DEFAULT 10)
RETURNS TABLE(user_id UUID, name TEXT, photo TEXT, city TEXT, area TEXT,
  posts INTEGER, likes_received INTEGER, green_points INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT pr.id, COALESCE(NULLIF(pr.name,''), 'Anonymous'), pr.profile_photo, pr.city, pr.area,
    COUNT(po.id)::int, COALESCE(SUM(po.like_count),0)::int, pr.green_points
  FROM public.profiles pr
  LEFT JOIN public.posts po ON po.user_id = pr.id AND po.is_hidden = false
  WHERE pr.onboarding_complete = true
  GROUP BY pr.id
  HAVING COUNT(po.id) > 0
  ORDER BY COUNT(po.id) DESC, COALESCE(SUM(po.like_count),0) DESC
  LIMIT GREATEST(1, LEAST(_limit, 50));
$$;

-- Seed community challenges
INSERT INTO public.community_challenges (scope, title, description, metric, target, reward, ends_at)
VALUES
  ('city', 'City CO₂ Drawdown', 'Together save 500 kg of CO₂ this month', 'co2_saved', 500, 200, now() + interval '30 days'),
  ('area', 'Area Cycle Sprint', 'Cycle 200 km collectively in your area', 'distance_cycle', 200, 150, now() + interval '14 days'),
  ('state', 'State Transit Push', '1000 sustainable trips across the state', 'trips_public', 1000, 300, now() + interval '60 days')
ON CONFLICT DO NOTHING;
