import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf, Mail, Lock } from "lucide-react";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — EcoRewards AI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: (search.redirect as any) ?? "/dashboard" });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) toast.error("Google sign-in failed");
  }

  async function forgot() {
    if (!email) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <div className="rounded-xl bg-primary p-2 text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">EcoRewards AI</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to keep tracking your impact.</p>

        <form onSubmit={signIn} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" required className="pl-9 h-11 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" onClick={forgot} className="text-xs text-primary hover:underline">Forgot?</button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" required className="pl-9 h-11 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl text-sm font-semibold">
            {loading ? "Signing in..." : "Sign in"}
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
          New here?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}
