import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useComments } from "@/hooks/use-community";
import { Send } from "lucide-react";

export function CommentsSheet({
  open, onOpenChange, postId,
}: { open: boolean; onOpenChange: (o: boolean) => void; postId: string }) {
  const { comments, add, loading } = useComments(open ? postId : null);
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    await add(text);
    setText("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Comments</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[50vh] pr-1">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Be the first to comment</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" maxLength={500}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
          <Button onClick={submit} size="icon" aria-label="Post comment"><Send className="h-4 w-4" aria-hidden="true" /></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
