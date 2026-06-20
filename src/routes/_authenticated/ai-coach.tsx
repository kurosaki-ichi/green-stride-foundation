import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai-coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — EcoRewards AI" },
      { name: "description", content: "Your AI sustainability coach: personalized tips, forecasts, and answers about your carbon footprint." },
    ],
  }),
  component: AICoachPage,
});

const SUGGESTIONS = [
  "How can I reduce my carbon footprint?",
  "Why is my CO₂ increasing?",
  "What is my biggest emission source?",
  "How can I improve my rank?",
  "Which transport option is best?",
];

function AICoachPage() {
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    headers: () => (token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const { messages, sendMessage, status, error } = useChat({
    id: "coach-main",
    transport,
  });

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => { inputRef.current?.focus(); }, [status]);

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || !token) return;
    setInput("");
    await sendMessage({ text: t });
  };

  const busy = status === "submitted" || status === "streaming";

  return (
    <AppShell title="AI Coach" subtitle="Ask anything about your sustainability journey.">
      {messages.length === 0 && (
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-success/5 p-5 mb-3">
          <span className="rounded-2xl bg-primary/10 p-2 inline-flex text-primary"><Sparkles className="h-5 w-5" /></span>
          <h3 className="mt-3 text-lg font-semibold">Hi! I'm EcoCoach.</h3>
          <p className="text-sm text-muted-foreground mt-1">
            I analyze your trips, challenges, and rankings to give personalized sustainability tips.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => submit(s)}
                className="text-left text-sm rounded-2xl bg-card border border-border px-3.5 py-2.5 hover:border-primary transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={scrollerRef} className="space-y-3 max-h-[60vh] overflow-y-auto pb-2">
        {messages.map((m: UIMessage) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          return (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              )}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                    <ReactMarkdown>{text}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{text}</p>
                )}
              </div>
            </div>
          );
        })}
        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-error/10 text-error p-3 text-xs">
            {error.message ?? "Coach is temporarily unavailable. Try again."}
          </div>
        )}
      </div>

      <div className="sticky bottom-20 mt-3 -mx-5 px-5 pt-3 pb-2 bg-gradient-to-t from-background via-background to-transparent">
        <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="flex gap-2">
          <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Ask EcoCoach…" disabled={busy || !token} maxLength={500} className="rounded-2xl" />
          <Button type="submit" size="icon" disabled={busy || !input.trim() || !token} className="rounded-2xl shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
