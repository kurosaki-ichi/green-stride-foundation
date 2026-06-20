import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createPost, uploadMedia } from "@/hooks/use-community";

const TYPES = [
  { v: "text", label: "Story" },
  { v: "image", label: "Photo" },
  { v: "achievement", label: "Achievement" },
  { v: "trip", label: "Trip" },
  { v: "milestone", label: "Milestone" },
] as const;

export function PostComposer({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["v"]>("text");
  const [co2, setCo2] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setBody(""); setType("text"); setCo2(""); setFile(null); setPreview(null); };

  const handleFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    if (f) setType(f.type.startsWith("video") ? "image" : "image");
  };

  const submit = async () => {
    if (!body.trim() && !file) { toast.error("Add a story or media"); return; }
    setBusy(true);
    try {
      let media: { url: string; type: string } | undefined;
      if (file) media = await uploadMedia(file);
      await createPost({
        type: media?.type === "video" ? "video" : type,
        body: body.trim() || undefined,
        media_url: media?.url,
        media_type: media?.type,
        co2_saved: co2 ? Number(co2) : 0,
      });
      toast.success("Posted to community");
      setOpen(false); reset(); onCreated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gap-1.5"><Plus className="h-4 w-4" /> Share</Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader><DialogTitle>Share with community</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {TYPES.map((t) => (
              <button key={t.v} onClick={() => setType(t.v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                  type === t.v ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                }`}>{t.label}</button>
            ))}
          </div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Today I cycled 8 km, saved 1.2 kg CO₂…"
            maxLength={500} rows={4} className="resize-none" />
          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer">
              <input type="file" accept="image/*,video/*" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted/40">
                <ImageIcon className="h-4 w-4" /> {file ? file.name.slice(0, 18) : "Add photo / video"}
              </div>
            </label>
            <input value={co2} onChange={(e) => setCo2(e.target.value)} placeholder="kg CO₂"
              className="w-20 rounded-2xl border border-border bg-card px-3 py-2 text-sm" inputMode="decimal" />
          </div>
          {preview && (
            <div className="relative">
              <img src={preview} alt="" className="w-full max-h-48 object-cover rounded-2xl" />
              <button onClick={() => handleFile(null)} className="absolute top-2 right-2 rounded-full bg-background/80 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <Button onClick={submit} disabled={busy} className="w-full rounded-2xl">
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Post
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">+5 points for sharing · +15 if verified</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
