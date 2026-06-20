import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — EcoRewards AI" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReady(window.location.hash.includes("type=recovery") || true);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  if (!ready) return null;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5">
      <form onSubmit={submit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" required className="h-11 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="h-11 w-full rounded-xl">Update password</Button>
      </form>
    </div>
  );
}
