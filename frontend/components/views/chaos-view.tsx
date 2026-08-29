"use client";

import { useState } from "react";
import { Activity, Check, CheckCircle2, History, Info, Loader2, RefreshCw, ShieldAlert, Sliders, Terminal, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { triggerChaos, resetChaos, type FleetStatus, type ChaosMode } from "@/lib/api";

interface ChaosViewProps {
  data: FleetStatus | null;
  onRefresh: () => void;
}

interface ChaosExperiment {
  id: string;
  target: string;
  mode: string;
  time: string;
  status: "injected" | "healed";
}

export function ChaosView({ data, onRefresh }: ChaosViewProps) {
  const services = data?.services ?? [];
  const [target, setTarget] = useState<string>(services[0]?.service || "orders");
  const [mode, setMode] = useState<ChaosMode>("latency");
  const [injecting, setInjecting] = useState(false);
  const [history, setHistory] = useState<ChaosExperiment[]>([
    {
      id: "EXP-104",
      target: "orders",
      mode: "latency (+3000ms SLA breach)",
      time: "2m ago",
      status: "injected",
    },
    {
      id: "EXP-103",
      target: "api-gateway",
      mode: "kill (503 Service Unavailable)",
      time: "15m ago",
      status: "healed",
    },
  ]);

  const handleInject = async () => {
    if (!target) return;
    setInjecting(true);
    try {
      await triggerChaos(target, mode);
      setHistory((prev) => [
        {
          id: `EXP-${Math.floor(100 + Math.random() * 900)}`,
          target,
          mode: mode === "kill" ? "kill (503 Service Unavailable)" : "latency (+3000ms delay)",
          time: "Just now",
          status: "injected",
        },
        ...prev,
      ]);
      setTimeout(() => {
        onRefresh();
        setInjecting(false);
      }, 500);
    } catch {
      setInjecting(false);
    }
  };

  const handleResetTarget = async (svcName: string) => {
    await resetChaos(svcName);
    setHistory((prev) =>
      prev.map((h) => (h.target === svcName ? { ...h, status: "healed" } : h))
    );
    setTimeout(() => onRefresh(), 400);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Chaos Engineering & Fault Injection Testbed
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 text-[11px]">
            Controlled fault injection to evaluate TrueForge autonomous detection, triage, and human-in-the-loop recovery.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* WORKBENCH CARD */}
        <Card className="rounded-xl border border-border/60 bg-[#111316] p-5 shadow-none space-y-5">
          <div className="border-b border-border/50 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fault Injection Configuration
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-wider text-muted-foreground">
                Target Node
              </label>
              <div className="grid grid-cols-3 gap-2">
                {services.map((s) => (
                  <button
                    key={s.service}
                    onClick={() => setTarget(s.service)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      target === s.service
                        ? "border-emerald-500/60 bg-[#16181c] text-foreground shadow-sm"
                        : "border-border/60 bg-[#141619] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-semibold">{s.service}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase">{s.status}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-wider text-muted-foreground">
                Disruption Mode
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    mode: "latency" as ChaosMode,
                    title: "Latency Spikes (+3000ms)",
                    desc: "Simulates database queue locks & event loop blocking. Triggers SLA breach alerts.",
                  },
                  {
                    mode: "kill" as ChaosMode,
                    title: "Container Outage (503)",
                    desc: "Simulates process crash or pod eviction. Triggers service unavailable alarms.",
                  },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setMode(item.mode)}
                    className={`rounded-lg border p-3.5 text-left transition-all ${
                      mode === item.mode
                        ? "border-amber-500/60 bg-[#16181c] text-foreground"
                        : "border-border/60 bg-[#141619] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-semibold text-foreground">{item.title}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground leading-relaxed font-sans">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-[#16181c] p-3 text-[11px] text-muted-foreground/80 leading-relaxed font-sans">
              Sentinel Telemetry Poller will detect this anomaly within 1.8s, bisect recent deploys with MCP tools, and hold at the License-to-Act gate for your approval.
            </div>

            <div className="flex justify-end pt-2 border-t border-border/50">
              <Button
                size="sm"
                className="h-8 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-5 shadow-sm"
                onClick={handleInject}
                disabled={injecting || !target}
              >
                {injecting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                ) : (
                  <Sliders className="h-3 w-3 mr-1.5" />
                )}
                Inject Fault Simulation
              </Button>
            </div>
          </div>
        </Card>

        {/* EXPERIMENT LOG */}
        <Card className="rounded-xl border border-border/60 bg-[#111316] p-5 shadow-none space-y-4">
          <div className="border-b border-border/50 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fault Injection Log
            </h3>
            <Badge variant="outline" className="border-border/60 text-[9px]">
              {history.length} runs
            </Badge>
          </div>

          <div className="space-y-2.5">
            {history.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-lg border border-border/50 bg-[#16181c] space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    [{exp.target}] {exp.id}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase ${
                      exp.status === "injected"
                        ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                        : "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                    }`}
                  >
                    {exp.status}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Mode: {exp.mode}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted-foreground/60">{exp.time}</span>
                  {exp.status === "injected" && (
                    <button
                      onClick={() => handleResetTarget(exp.target)}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      Reset State
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
