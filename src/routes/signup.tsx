import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — EcoRewards AI" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords don't match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin + "/onboarding" },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      toast.success("Check your email to confirm your account.");
      return;
    }
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) { try { await supabase.rpc("redeem_referral", { _code: ref }); } catch { /* ignore */ } }
    toast.success("Account created!");
    window.location.assign("/onboarding");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/onboarding",
    });
    if (result.error) return toast.error("Google sign-in failed");
    if (result.redirected) return;
    window.location.assign("/onboarding");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <div className="rounded-xl bg-primary p-2 text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">EcoRewards AI</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start tracking your impact in under a minute.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required className="h-11 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required className="h-11 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required className="h-11 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" required className="h-11 rounded-xl" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl text-sm font-semibold">
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          OR
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" onClick={google} className="h-11 w-full rounded-xl text-sm font-medium">
          Continue with Google
        </Button>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
