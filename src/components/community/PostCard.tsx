import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Flag, CheckCircle2, Leaf, Sparkles, Award } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { reportPost, toggleReaction, type FeedPost } from "@/hooks/use-community";
import { CommentsSheet } from "./CommentsSheet";

const TYPE_BADGE: Record<string, { label: string; icon: typeof Leaf; color: string }> = {
  trip: { label: "Trip", icon: Leaf, color: "bg-success/10 text-success" },
  challenge: { label: "Challenge", icon: Sparkles, color: "bg-primary/10 text-primary" },
  achievement: { label: "Achievement", icon: Award, color: "bg-warning/10 text-warning" },
  milestone: { label: "Milestone", icon: Award, color: "bg-warning/10 text-warning" },
  image: { label: "Photo", icon: Leaf, color: "bg-muted text-muted-foreground" },
  video: { label: "Video", icon: Leaf, color: "bg-muted text-muted-foreground" },
  text: { label: "Story", icon: Leaf, color: "bg-muted text-muted-foreground" },
};

export function PostCard({ post, onChange }: { post: FeedPost; onChange?: () => void }) {
  const [liked, setLiked] = useState(post.viewer_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const badge = TYPE_BADGE[post.type] ?? TYPE_BADGE.text;
  const BadgeIcon = badge.icon;

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try { await toggleReaction(post.id, "like"); } catch { setLiked(!next); setLikeCount(post.like_count); }
  };

  const handleShare = async () => {
    const text = `${post.author_name} on EcoRewards: ${post.body ?? "Check out this sustainability win"}`;
    try {
      if (navigator.share) await navigator.share({ title: "EcoRewards", text });
      else { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }
    } catch { /* user cancelled */ }
  };

  const handleReport = async () => {
    try { await reportPost(post.id); toast.success("Reported. Thank you."); onChange?.(); } catch { toast.error("Failed to report"); }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="rounded-3xl bg-card border border-border shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden"
    >
      <header className="flex items-center gap-3 px-4 pt-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold overflow-hidden">
          {post.author_photo ? <img src={post.author_photo} alt="" className="h-full w-full object-cover" /> : post.author_name.slice(0, 1)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{post.author_name}</p>
            {post.verification === "verified" && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {[post.author_area, post.author_city].filter(Boolean).join(" • ") || "Eco community"} · {timeAgo(post.created_at)}
          </p>
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", badge.color)}>
          <BadgeIcon className="h-3 w-3" /> {badge.label}
        </span>
      </header>

      {post.body && <p className="px-4 pt-3 text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>}

      {post.media_url && (
        <div className="mt-3 bg-muted">
          {post.media_type === "video" ? (
            <video src={post.media_url} controls className="w-full max-h-96 object-cover" />
          ) : (
            <img src={post.media_url} alt="" loading="lazy" className="w-full max-h-96 object-cover" />
          )}
        </div>
      )}

      {(Number(post.co2_saved) > 0 || post.points_earned > 0) && (
        <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
          {Number(post.co2_saved) > 0 && (
            <div className="rounded-2xl bg-success/5 border border-success/20 p-3">
              <p className="text-[10px] uppercase tracking-wide text-success/80 font-medium">CO₂ saved</p>
              <p className="text-lg font-semibold text-success">{Number(post.co2_saved).toFixed(1)} kg</p>
            </div>
          )}
          {post.points_earned > 0 && (
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3">
              <p className="text-[10px] uppercase tracking-wide text-primary/80 font-medium">Points</p>
              <p className="text-lg font-semibold text-primary">+{post.points_earned}</p>
            </div>
          )}
        </div>
      )}

      <footer className="flex items-center justify-between px-2 py-1.5 mt-2 border-t border-border">
        <Button variant="ghost" size="sm" onClick={handleLike} className={cn("gap-1.5", liked && "text-error")}>
          <Heart className={cn("h-4 w-4", liked && "fill-current")} /> {likeCount}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowComments(true)} className="gap-1.5">
          <MessageCircle className="h-4 w-4" /> {post.comment_count}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReport} className="gap-1.5 text-muted-foreground">
          <Flag className="h-4 w-4" />
        </Button>
      </footer>

      <CommentsSheet open={showComments} onOpenChange={setShowComments} postId={post.id} />
    </motion.article>
  );
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
