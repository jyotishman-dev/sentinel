"use client";

import { useState } from "react";
import { Activity, Check, CheckCircle2, Clock, Cpu, Globe, Layers, RefreshCw, Server, ShieldCheck, Sliders, Terminal, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { triggerChaos, resetChaos, type FleetStatus, type ServiceInfo, type ChaosMode } from "@/lib/api";

interface ServicesViewProps {
  data: FleetStatus | null;
  onRefresh: () => void;
}

const SERVICE_METADATA: Record<string, { port: number; route: string; description: string; lang: string }> = {
  "api-gateway": {
    port: 4001,
    route: "/health",
    description: "Reverse proxy, circuit breaker, rate limiting, and route multiplexer.",
    lang: "Node.js / Express / TypeScript",
  },
  orders: {
    port: 4002,
    route: "/health",
    description: "Transactional order pipeline, checkout state machine, and ledger sync.",
    lang: "Node.js / Express / TypeScript",
  },
  auth: {
    port: 4003,
    route: "/health",
    description: "JWT token verification, session lifecycle management, and ACL policy.",
    lang: "Node.js / Express / TypeScript",
  },
};

export function ServicesView({ data, onRefresh }: ServicesViewProps) {
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const services = data?.services ?? [];
  const uptimeMap = new Map((data?.uptime ?? []).map((u) => [u.service, u]));

  const handleAction = async (serviceName: string, action: "kill" | "latency" | "reset") => {
    setActionLoading(`${serviceName}-${action}`);
    try {
      if (action === "reset") {
        await resetChaos(serviceName);
      } else {
        await triggerChaos(serviceName, action as ChaosMode);
      }
      setTimeout(() => {
        onRefresh();
        setActionLoading(null);
      }, 400);
    } catch {
      setActionLoading(null);
    }
  };

  const filteredServices = selectedService === "ALL" 
    ? services 
    : services.filter((s) => s.service === selectedService);

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Microservices Fleet Control
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Container health inspection, telemetry probes, and fault injection triggers.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#111316] p-1 rounded-md border border-border/60">
          {["ALL", "api-gateway", "orders", "auth"].map((name) => (
            <button
              key={name}
              onClick={() => setSelectedService(name)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                selectedService === name
                  ? "bg-[#1d2025] text-foreground font-semibold border border-border/70"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* SERVICES GRID */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {filteredServices.map((svc: ServiceInfo) => {
          const meta = SERVICE_METADATA[svc.service] || {
            port: 4000,
            route: "/health",
            description: "Generic microservice in mesh cluster.",
            lang: "Node.js / TypeScript",
          };
          const up = uptimeMap.get(svc.service);
          const isDegraded = svc.status !== "healthy" || (svc.latency_ms != null && svc.latency_ms >= 1000);

          return (
            <Card
              key={svc.service}
              className={`rounded-xl border bg-[#111316] p-5 shadow-none space-y-4 font-mono ${
                isDegraded
                  ? svc.status === "down"
                    ? "border-red-500/40 bg-red-500/[0.02]"
                    : "border-amber-500/40 bg-amber-500/[0.02]"
                  : "border-border/60"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        !isDegraded
                          ? "bg-emerald-400"
                          : svc.status === "down"
                            ? "bg-red-400 animate-ping"
                            : "bg-amber-400 animate-ping"
                      }`}
                    />
                    <h3 className="text-base font-semibold text-foreground">{svc.service}</h3>
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    localhost:{meta.port} · {meta.lang}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[9px] uppercase ${
                    !isDegraded
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                      : svc.status === "down"
                        ? "border-red-500/40 text-red-400 bg-red-500/10"
                        : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                  }`}
                >
                  {isDegraded && svc.status === "healthy" ? "degraded" : svc.status}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground/90 leading-relaxed font-sans">
                {meta.description}
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/40 bg-[#0e1012] p-3 text-center text-xs">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                    Latency
                  </div>
                  <div className={`mt-0.5 font-semibold ${svc.latency_ms && svc.latency_ms >= 1000 ? "text-amber-400" : "text-foreground"}`}>
                    {svc.latency_ms != null ? `${svc.latency_ms}ms` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                    Availability
                  </div>
                  <div className="mt-0.5 font-semibold text-foreground">
                    {up ? `${up.uptimePct.toFixed(1)}%` : "100%"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                    Failures
                  </div>
                  <div className={`mt-0.5 font-semibold ${up && up.consecutiveFailures > 0 ? "text-red-400" : "text-foreground"}`}>
                    {up ? up.consecutiveFailures : 0}
                  </div>
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Action Buttons */}
              <div className="space-y-1.5">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                  Target Controls
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
                    onClick={() => handleAction(svc.service, "reset")}
                    disabled={actionLoading === `${svc.service}-reset`}
                  >
                    {actionLoading === `${svc.service}-reset` ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Reset
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
                    onClick={() => handleAction(svc.service, "latency")}
                    disabled={actionLoading === `${svc.service}-latency`}
                  >
                    +3s Latency
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10"
                    onClick={() => handleAction(svc.service, "kill")}
                    disabled={actionLoading === `${svc.service}-kill`}
                  >
                    Kill 503
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
