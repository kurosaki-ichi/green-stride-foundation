import { useState } from "react";
import { Target, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useGoals, type Goal } from "@/hooks/use-ai";
import { toast } from "sonner";

const KINDS = [
  { v: "reduce_co2", label: "Reduce CO₂", unit: "kg" },
  { v: "earn_points", label: "Earn Points", unit: "pts" },
  { v: "reach_rank", label: "Reach Rank", unit: "#" },
  { v: "complete_challenges", label: "Complete Challenges", unit: "" },
  { v: "custom", label: "Custom", unit: "" },
] as const;

export function GoalPlanner() {
  const { goals, create, remove } = useGoals();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Your goals
        </h3>
        <NewGoalDialog onCreate={create} />
      </div>
      {goals.length === 0 ? (
        <p className="text-xs text-muted-foreground rounded-2xl border border-dashed border-border p-4 text-center">
          No goals yet. Set one and the AI coach will help you reach it.
        </p>
      ) : (
        <div className="space-y-2.5">
          {goals.map((g) => <GoalRow key={g.id} g={g} onDelete={() => remove(g.id)} />)}
        </div>
      )}
    </div>
  );
}

function GoalRow({ g, onDelete }: { g: Goal; onDelete: () => void }) {
  const pct = Math.min(100, Math.round((Number(g.current_value) / Number(g.target)) * 100));
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{g.title}</p>
          {g.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{g.description}</p>}
        </div>
        <button onClick={onDelete} className="text-muted-foreground hover:text-error p-1">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{Number(g.current_value).toFixed(0)} / {Number(g.target).toFixed(0)} {g.unit ?? ""}</span>
        <span>{g.deadline ?? "no deadline"}</span>
      </div>
      <Progress value={pct} className="mt-1.5 h-1.5" />
    </div>
  );
}

function NewGoalDialog({ onCreate }: { onCreate: (g: Pick<Goal, "kind"|"title"|"description"|"target"|"unit"|"deadline">) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]["v"]>("reduce_co2");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !target) { toast.error("Add a title and target"); return; }
    setBusy(true);
    try {
      const unit = KINDS.find((k) => k.v === kind)?.unit ?? null;
      await onCreate({ kind, title: title.trim(), description: desc || null, target: Number(target), unit, deadline: deadline || null });
      toast.success("Goal created");
      setOpen(false); setTitle(""); setTarget(""); setDeadline(""); setDesc("");
    } catch { toast.error("Failed"); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-full gap-1.5"><Plus className="h-3.5 w-3.5" /> New goal</Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader><DialogTitle>Set a sustainability goal</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {KINDS.map((k) => (
              <button key={k.v} onClick={() => setKind(k.v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                  kind === k.v ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                }`}>{k.label}</button>
            ))}
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Reduce CO₂ by 20%)" maxLength={120} />
          <div className="grid grid-cols-2 gap-2">
            <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target" inputMode="decimal" />
            <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" />
          </div>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional details…" rows={2} maxLength={300} className="resize-none" />
          <Button onClick={submit} disabled={busy} className="w-full rounded-2xl">Create goal</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
