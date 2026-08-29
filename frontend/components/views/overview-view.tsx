"use client";

import { Activity, AlertCircle, ArrowUpRight, Check, ChevronRight, Clock, Code, ExternalLink, Layers, Radio, RefreshCw, Server, ShieldCheck, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { type FleetStatus, type ServiceInfo, type ServiceStatus } from "@/lib/api";

type UiStatus = "healthy" | "degraded" | "down";

function toUiStatus(s: ServiceStatus): UiStatus {
  if (s === "healthy") return "healthy";
  if (s === "down") return "down";
  return "degraded";
}

function StatusDot({ status }: { status: UiStatus }) {
  if (status === "healthy") {
    return <span className="h-2 w-2 rounded-full bg-emerald-400" />;
  }
  if (status === "degraded") {
    return <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />;
  }
  return <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour12: false });
  } catch {
    return iso;
  }
}

interface OverviewViewProps {
  data: FleetStatus | null;
  loading: boolean;
  onOpenChaos: () => void;
  onOpenAgent: () => void;
  onNavigate: (view: string) => void;
  onApproveRemediation: (serviceName: string) => void;
  onDispatchAgent?: (serviceName: string, details?: string) => void;
  remediatingService: string | null;
}

export function OverviewView({
  data,
  loading,
  onOpenChaos,
  onOpenAgent,
  onNavigate,
  onApproveRemediation,
  onDispatchAgent,
  remediatingService,
}: OverviewViewProps) {
  const services = data?.services ?? [];
  const uptimeMap = new Map((data?.uptime ?? []).map((u) => [u.service, u]));
  const logs = data?.recentLogs ?? [];
  const incidentServices = services.filter(
    (s) => s.status !== "healthy" || (s.latency_ms != null && s.latency_ms >= 1000)
  );
  const incidentCount = incidentServices.length;
  const incidentService = incidentServices[0];
  const incidentUptime = incidentService
    ? uptimeMap.get(incidentService.service)
    : undefined;

  const isLatencySpike = incidentService && incidentService.latency_ms != null && incidentService.latency_ms >= 1000;

  const handleDispatch = () => {
    if (!incidentService) return;
    const issueText = isLatencySpike
      ? `Response latency measured at ${incidentService.latency_ms}ms (exceeding SLA threshold).`
      : `Service returned HTTP 503 unavailable.`;
    if (onDispatchAgent) {
      onDispatchAgent(incidentService.service, issueText);
    } else {
      onOpenAgent();
    }
  };

  return (
    <div className="space-y-6">
      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading && !data ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="rounded-xl border border-border/50 bg-[#121417] p-4 shadow-none">
                <Skeleton className="h-3 w-16 bg-muted/60" />
                <Skeleton className="mt-3 h-6 w-20 bg-muted/60" />
              </Card>
            ))}
          </>
        ) : (
          <>
            {[
              {
                label: "Services Online",
                value: `${services.filter((s) => s.status === "healthy" && (s.latency_ms == null || s.latency_ms < 1000)).length} / ${services.length}`,
                sub: "Cluster operational capacity",
                highlight: false,
              },
              {
                label: "Active Incidents",
                value: incidentCount.toString(),
                sub: incidentCount > 0 ? "TrueForge Harness Engaged" : "Zero open alerts",
                highlight: incidentCount > 0,
              },
              {
                label: "Fleet Average Latency",
                value:
                  data?.summary?.avgLatencyMs != null
                    ? `${data.summary.avgLatencyMs}ms`
                    : "—",
                sub: "Ingress to upstream latency",
                highlight: (data?.summary?.avgLatencyMs ?? 0) > 500,
              },
              {
                label: "Availability Index",
                value: services.length
                  ? `${Math.round(((services.length - incidentCount) / services.length) * 100)}%`
                  : "100%",
                sub: "SLA compliance target",
                highlight: false,
              },
            ].map((stat) => (
              <Card
                key={stat.label}
                className="rounded-xl border border-border/60 bg-[#111316] p-4 shadow-none space-y-1"
              >
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                  {stat.label}
                </div>
                <div className={`text-2xl font-semibold tracking-tight font-mono ${stat.highlight ? "text-amber-400" : "text-foreground"}`}>
                  {stat.value}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {stat.sub}
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* TRUEFORGE AGENT HARNESS DISPATCH GATE */}
      {incidentService && (
        <Card className="rounded-xl border border-amber-500/40 bg-[#14120c] p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-mono text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  TrueForge Agent Harness · Autonomous Incident Triage
                </span>
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[9px] font-mono text-amber-300">
                  STATUS: TRIAGE READY
                </Badge>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed max-w-3xl font-sans">
                Anomaly detected on node <span className="font-mono font-bold text-foreground bg-[#1f1d17] px-1.5 py-0.5 rounded border border-amber-500/30">{incidentService.service}</span> (
                {isLatencySpike
                  ? `latency: ${incidentService.latency_ms}ms > 1000ms SLA`
                  : `HTTP 503 unavailable`}
                ). TrueForge Agent will execute MCP investigation (
                <span className="font-mono text-amber-300">fleet-control</span>,{" "}
                <span className="font-mono text-amber-300">deploy-history</span>
                ), diagnose root cause in sandbox, and formulate remediation under the Human-in-the-Loop ("License to Act") approval gate.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold font-mono text-xs shadow-md shadow-amber-500/10"
                onClick={handleDispatch}
                disabled={remediatingService === incidentService.service}
              >
                <Terminal className="h-3.5 w-3.5" />
                Dispatch to Agent Harness
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-muted-foreground/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>TrueForge Agent Harness (:8790) · MCP Server Connected</span>
            </div>
            <button
              onClick={onOpenAgent}
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              Open live agent session <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </Card>
      )}

      {/* SERVICE MESH STATUS CARDS */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground/90">
              Service Mesh Status
            </h2>
            <Badge variant="outline" className="border-border/60 text-[9px] font-mono">
              {services.length} nodes
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-[10px] font-mono text-muted-foreground hover:bg-muted"
            onClick={() => onNavigate("Services")}
          >
            Detailed View <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {services.map((svc: ServiceInfo) => {
            const ui = toUiStatus(svc.status);
            const up = uptimeMap.get(svc.service);
            const isDegraded = svc.status !== "healthy" || (svc.latency_ms != null && svc.latency_ms >= 1000);

            return (
              <Card
                key={svc.service}
                className={`rounded-xl border bg-[#111316] p-4 shadow-none space-y-3.5 transition-all ${
                  isDegraded
                    ? svc.status === "down"
                      ? "border-red-500/40 bg-red-500/[0.02]"
                      : "border-amber-500/40 bg-amber-500/[0.02]"
                    : "border-border/60 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusDot status={ui} />
                    <span className="font-mono text-sm font-semibold">{svc.service}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-mono uppercase ${
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

                <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-3 text-[11px] font-mono">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Latency</div>
                    <div className={`mt-0.5 font-semibold ${svc.latency_ms && svc.latency_ms >= 1000 ? "text-amber-400" : "text-foreground"}`}>
                      {svc.latency_ms != null ? `${svc.latency_ms}ms` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Uptime</div>
                    <div className="mt-0.5 text-foreground font-semibold">
                      {up ? `${Math.round(up.uptimePct)}%` : "100%"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Failures</div>
                    <div className={`mt-0.5 font-semibold ${up && up.consecutiveFailures > 0 ? "text-red-400" : "text-foreground"}`}>
                      {up ? up.consecutiveFailures : 0}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* LOWER SPLIT: INCIDENT TELEMETRY & SYSTEM LOG STREAM */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        {/* TELEMETRY / DIAGNOSTICS CARD */}
        <Card className="rounded-xl border border-border/60 bg-[#111316] shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-border/50 p-4">
            <div className="flex items-center gap-2 font-mono">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Autonomous SRE Telemetry & Diagnostics
              </span>
            </div>
            <Badge variant="outline" className="border-border/60 text-[9px] font-mono">
              {incidentCount > 0 ? "ACTION REQUIRED" : "STEADY STATE"}
            </Badge>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {incidentCount > 0 && incidentService ? (
              <div className="space-y-3.5">
                <div className="text-sm font-semibold">
                  Incident on node [{incidentService.service}]
                </div>
                <div className="rounded-lg border border-border/50 bg-[#16181c] p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Detection Source: Telemetry Poller</span>
                    <span>{formatTime(incidentService.checked_at)}</span>
                  </div>
                  <p className="text-foreground/90 leading-relaxed text-[11px]">
                    Root Cause: Latency measured at {incidentService.latency_ms ?? "N/A"}ms. Diagnoser bisected commit logs and correlated event queue lock. Remediation plan verified against test sandbox.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-semibold"
                    onClick={() => onApproveRemediation(incidentService.service)}
                    disabled={remediatingService === incidentService.service}
                  >
                    Execute Remediation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border/60 text-xs font-mono"
                    onClick={onOpenAgent}
                  >
                    Discuss with Agent
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Check className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">All Systems Operating Nominally</div>
                <p className="text-xs text-muted-foreground font-mono max-w-sm mx-auto">
                  Continuous telemetry probing active across all services. Use Fault Injection in Chaos Lab to test autonomous incident recovery.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* SYSTEM ACTIVITY LOG */}
        <Card className="rounded-xl border border-border/60 bg-[#111316] shadow-none flex flex-col">
          <div className="flex items-center justify-between border-b border-border/50 p-4 font-mono">
            <span className="text-xs font-semibold uppercase tracking-wider">Live System Event Log</span>
            <button
              onClick={() => onNavigate("Audit Log")}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              View Full Trail
            </button>
          </div>

          <div className="divide-y divide-border/30 max-h-[360px] overflow-y-auto font-mono text-[11px] p-1">
            {logs.slice(-6).reverse().map((log, idx) => (
              <div key={idx} className="p-2.5 flex items-start gap-2.5 transition-colors hover:bg-muted/20">
                <span
                  className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                    log.level === "error"
                      ? "bg-red-400"
                      : log.level === "warn"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground/90 truncate">
                    <span className="font-semibold text-muted-foreground mr-1.5">[{log.service}]</span>
                    {log.message}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {formatTime(log.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
