import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import GlobeGL from "globe.gl";
import { useGlobeData, tierColor, type GlobePoint } from "@/hooks/use-phase9";
import { VerificationBadge } from "@/components/VerificationBadge";
import { ArrowLeft, Globe2, Users, Leaf, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/impact-globe")({
  head: () => ({ meta: [{ title: "Global Impact Globe — EcoRewards AI" }] }),
  component: ImpactGlobePage,
});

type Mode = "users" | "communities" | "heatmap";

function ImpactGlobePage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<any>(null);
  const { points, clusters, loading } = useGlobeData(800);
  const [selected, setSelected] = useState<GlobePoint | null>(null);
  const [mode, setMode] = useState<Mode>("users");

  // Init globe once
  useEffect(() => {
    if (!containerRef.current || globeRef.current) return;
    const g = new (GlobeGL as any)(containerRef.current)
      .backgroundColor("rgba(0,0,0,0)")
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
      .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
      .atmosphereColor("#10B981")
      .atmosphereAltitude(0.18)
      .pointAltitude(0.01)
      .pointRadius(0.35)
      .pointResolution(8)
      .pointsTransitionDuration(800)
      .arcStroke(0.4)
      .arcDashLength(0.35)
      .arcDashGap(0.6)
      .arcDashAnimateTime(2200)
      .arcAltitudeAutoScale(0.4);
    globeRef.current = g;

    // auto-rotate
    const controls = g.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableDamping = true;

    const resize = () => {
      if (containerRef.current) {
        g.width(containerRef.current.clientWidth);
        g.height(containerRef.current.clientHeight);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      try { g._destructor && g._destructor(); } catch {}
      if (containerRef.current) containerRef.current.innerHTML = "";
      globeRef.current = null;
    };
  }, []);

  // Update data when points/mode change
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;

    if (mode === "users" || mode === "heatmap") {
      const pts = points.map((p) => ({
        ...p,
        color: tierColor(p.tier),
        size: mode === "heatmap"
          ? Math.max(0.2, Math.min(1.4, p.total_saved / 100))
          : Math.max(0.25, Math.min(1.1, p.eco_score / 4000)),
      }));
      g.pointsData(pts)
        .pointLat("lat").pointLng("lng")
        .pointColor("color")
        .pointAltitude((d: any) => mode === "heatmap" ? d.size * 0.4 : 0.01)
        .pointRadius((d: any) => d.size)
        .onPointClick((d: any) => {
          setSelected(d);
          g.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.8 }, 1000);
          g.controls().autoRotate = false;
        });

      // Arcs from home -> work for sample of points
      const arcs = points
        .filter((p) => p.home_lat && p.work_lat)
        .slice(0, 60)
        .map((p) => ({
          startLat: p.home_lat, startLng: p.home_lng,
          endLat: p.work_lat, endLng: p.work_lng,
          color: [tierColor(p.tier), tierColor(p.tier)],
        }));
      g.arcsData(arcs)
        .arcColor("color")
        .arcStartLat("startLat").arcStartLng("startLng")
        .arcEndLat("endLat").arcEndLng("endLng");
    } else {
      g.pointsData([]).arcsData([]);
    }

    if (mode === "communities") {
      const labels = clusters.slice(0, 60).map((c: any) => ({
        lat: Number(c.lat),
        lng: Number(c.lng),
        text: `${c.city} · ${c.user_count}`,
        size: Math.max(0.5, Math.min(2.5, Number(c.user_count) / 20)),
        color: "#10B981",
      }));
      g.labelsData(labels)
        .labelLat("lat").labelLng("lng").labelText("text")
        .labelSize("size").labelColor(() => "#10B981")
        .labelDotRadius((d: any) => d.size * 0.3)
        .labelAltitude(0.01)
        .onLabelClick(null);
    } else {
      g.labelsData([]);
    }
  }, [points, clusters, mode]);

  const totals = {
    users: points.length,
    saved: points.reduce((s, p) => s + Number(p.total_saved || 0), 0),
    topCity: clusters[0]?.city ?? "—",
    topState: clusters[0]?.state ?? "—",
  };

  return (
    <div className="fixed inset-0 z-30 bg-[#020617] text-white overflow-hidden">
      {/* Backdrop globe */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading veil */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/80 z-10">
          <div className="space-y-3 w-64">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-2 w-full" />
            <p className="text-center text-xs text-muted-foreground">Loading global impact data…</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            onClick={() => navigate({ to: "/leaderboard" })}
            className="rounded-full bg-white/10 p-2 backdrop-blur hover:bg-white/20 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-emerald-400" />
            <h1 className="text-sm font-semibold tracking-wide">Global Impact</h1>
          </div>
          <div className="w-9" />
        </div>
      </div>

      {/* Stats overlay top */}
      <div className="absolute top-16 inset-x-0 z-20 px-4">
        <div className="mx-auto max-w-md grid grid-cols-3 gap-2">
          <StatGlass icon={Users} label="Users" value={totals.users.toLocaleString()} />
          <StatGlass icon={Leaf} label="CO₂ Saved" value={`${(totals.saved / 1000).toFixed(1)}t`} />
          <StatGlass icon={MapPin} label="Top City" value={totals.topCity} />
        </div>
      </div>

      {/* Mode switcher bottom */}
      <div className="absolute bottom-0 inset-x-0 z-20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md flex items-center justify-center gap-1.5 rounded-full bg-white/10 p-1 backdrop-blur">
          {(["users", "communities", "heatmap"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
                mode === m ? "bg-emerald-500 text-white shadow-lg" : "text-white/70 hover:text-white",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mx-auto mt-3 max-w-md flex items-center justify-center gap-3 text-[10px] text-white/70">
          <Legend color="#10B981" label="Eco Leader" />
          <Legend color="#F59E0B" label="Champion" />
          <Legend color="#0EA5E9" label="Trusted" />
          <Legend color="#84CC16" label="Explorer" />
        </div>
      </div>

      {/* User popup */}
      {selected && (
        <div className="absolute bottom-32 inset-x-0 z-30 px-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="mx-auto max-w-md rounded-2xl bg-card text-card-foreground p-4 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-start gap-3">
              <div
                className="h-12 w-12 rounded-full ring-2 shrink-0"
                style={{ background: tierColor(selected.tier), borderColor: tierColor(selected.tier) }}
              >
                <div className="h-full w-full flex items-center justify-center text-white font-bold">
                  {selected.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold">{selected.name}</p>
                  <VerificationBadge tier={selected.tier} size="xs" withLabel={false} />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {[selected.area, selected.city, selected.state].filter(Boolean).join(" • ")}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                  <Pill label="Eco" value={selected.eco_score.toLocaleString()} />
                  <Pill label="Trust" value={`${selected.trust_score}`} />
                  <Pill label="Saved" value={`${Number(selected.total_saved).toFixed(0)}kg`} />
                </div>
              </div>
              <button
                onClick={() => { setSelected(null); globeRef.current?.controls && (globeRef.current.controls().autoRotate = true); }}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Link
              to="/user/$id"
              params={{ id: selected.id }}
              className="mt-3 block w-full"
            >
              <Button className="w-full rounded-xl" size="sm">View full profile</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatGlass({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur p-2.5 ring-1 ring-white/10">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/60">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="text-base font-bold tabular-nums truncate">{value}</p>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-1.5">
      <p className="text-sm font-bold tabular-nums">{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}
