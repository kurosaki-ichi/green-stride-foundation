import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/cards/StatCard";
import { ChartCard } from "@/components/cards/ChartCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Leaf, Sparkles, TrendingDown, Trophy, ShieldCheck, Activity, Moon, Sun,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — EcoRewards AI" }] }),
  component: Dashboard,
});

const weekly = [
  { day: "Mon", co2: 4.2 }, { day: "Tue", co2: 3.6 }, { day: "Wed", co2: 5.1 },
  { day: "Thu", co2: 2.9 }, { day: "Fri", co2: 3.8 }, { day: "Sat", co2: 2.1 }, { day: "Sun", co2: 1.7 },
];

const transport = [
  { name: "Metro", value: 38, color: "var(--color-primary)" },
  { name: "Walk", value: 24, color: "var(--color-success)" },
  { name: "Car", value: 22, color: "var(--color-warning)" },
  { name: "Bus", value: 16, color: "var(--color-chart-4)" },
];

function Dashboard() {
  const { theme, toggle } = useTheme();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("name").eq("id", data.user.id).maybeSingle();
      setName(p?.name ?? "");
    });
  }, []);

  return (
    <AppShell
      title={`Hi ${name?.split(" ")[0] || "there"} 👋`}
      subtitle="Here's your impact today."
      right={
        <Button variant="ghost" size="icon" onClick={toggle} className="rounded-xl">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Daily CO₂" value="3.8" unit="kg" icon={Leaf} trend="-12% vs avg" />
        <StatCard label="Weekly CO₂" value="23.4" unit="kg" icon={TrendingDown} accent="success" trend="-8% this week" />
        <StatCard label="Monthly CO₂" value="92" unit="kg" icon={Activity} />
        <StatCard label="Green Points" value="1,240" icon={Sparkles} accent="warning" trend="+86 today" />
        <StatCard label="Current Rank" value="#12" icon={Trophy} trend="Top 5% in area" />
        <StatCard label="Trust Score" value="86" icon={ShieldCheck} accent="success" />
      </div>

      <div className="mt-5 space-y-4">
        <ChartCard title="Weekly trend" description="CO₂ emitted, last 7 days">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }} />
                <Line type="monotone" dataKey="co2" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--color-primary)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Transport breakdown" description="Share of your trips this week">
          <div className="flex items-center gap-4">
            <div className="h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={transport} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={2}>
                    {transport.map((t) => <Cell key={t.name} fill={t.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2">
              {transport.map((t) => (
                <li key={t.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                  <span className="flex-1 text-foreground">{t.name}</span>
                  <span className="text-muted-foreground">{t.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>

        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI insight</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Switching two car trips to metro this week could save <span className="font-semibold text-foreground">4.8 kg CO₂</span> and earn you <span className="font-semibold text-primary">+120 points</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
