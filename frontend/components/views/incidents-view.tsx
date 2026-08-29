"use client";

import { useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  History,
  Layers,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
  Sliders,
  Terminal,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type FleetStatus, type ServiceInfo } from "@/lib/api";

interface IncidentsViewProps {
  data: FleetStatus | null;
  onApproveRemediation: (serviceName: string) => void;
  onDispatchAgent?: (serviceName: string, details?: string) => void;
  remediatingService: string | null;
  onOpenChaos: () => void;
  onOpenAgent: () => void;
}

interface HistoricalIncident {
  id: string;
  service: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  startedAt: string;
  duration: string;
  rootCause: string;
  resolvedBy: string;
  status: "resolved";
}

const HISTORICAL_INCIDENTS: HistoricalIncident[] = [
  {
    id: "INC-942",
    service: "orders",
    title: "Upstream database thread pool exhaustion",
    severity: "critical",
    startedAt: "24m ago",
    duration: "18s",
    rootCause: "Unbounded connection pool in checkout pipeline commit 4c21b3a",
    resolvedBy: "Sentinel Auto-Remediation (Operator Authorized)",
    status: "resolved",
  },
  {
    id: "INC-819",
    service: "api-gateway",
    title: "Ingress buffer latency breach (3200ms)",
    severity: "high",
    startedAt: "1h 12m ago",
    duration: "24s",
    rootCause: "Synchronous payload deserialization bottleneck",
    resolvedBy: "Sentinel Auto-Remediation (Operator Authorized)",
    status: "resolved",
  },
  {
    id: "INC-761",
    service: "auth",
    title: "JWT verification service degraded",
    severity: "medium",
    startedAt: "3h 40m ago",
    duration: "12s",
    rootCause: "Stale session cache lock",
    resolvedBy: "Sentinel Auto-Remediation (Operator Authorized)",
    status: "resolved",
  },
];

export function IncidentsView({
  data,
  onApproveRemediation,
  onDispatchAgent,
  remediatingService,
  onOpenChaos,
  onOpenAgent,
}: IncidentsViewProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const services = data?.services ?? [];
  const incidentServices = services.filter(
    (s) => s.status !== "healthy" || (s.latency_ms != null && s.latency_ms >= 1000)
  );
  const hasActiveIncident = incidentServices.length > 0;

  const filteredHistory = HISTORICAL_INCIDENTS.filter((inc) => {
    if (filterSeverity === "ALL") return true;
    return inc.severity.toUpperCase() === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* METRIC HEADERS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 font-mono">
        {[
          {
            label: "Open Incidents",
            value: incidentServices.length.toString(),
            sub: incidentServices.length > 0 ? "Autonomous Triage Engaged" : "Zero open alerts",
            highlight: incidentServices.length > 0,
          },
          {
            label: "Mean Time to Detect (MTTD)",
            value: "1.8s",
            sub: "Telemetry polling engine",
            highlight: false,
          },
          {
            label: "Mean Time to Remediate (MTTR)",
            value: "18.4s",
            sub: "With operator approval gate",
            highlight: false,
          },
          {
            label: "Autonomous Success Rate",
            value: "98.2%",
            sub: "38 of 39 faults resolved",
            highlight: false,
          },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-xl border border-border/60 bg-[#111316] p-4 shadow-none space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
              {stat.label}
            </div>
            <div className={`text-2xl font-semibold tracking-tight ${stat.highlight ? "text-amber-400" : "text-foreground"}`}>
              {stat.value}
            </div>
            <div className="text-[11px] text-muted-foreground">{stat.sub}</div>
          </Card>
        ))}
      </div>

      {/* ACTIVE INCIDENT TRIAGE SECTION */}
      <div>
        <div className="mb-3 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Incident Command
            </h2>
            {hasActiveIncident && (
              <Badge className="border-amber-500/40 bg-amber-500/10 text-[9px] font-mono text-amber-300">
                {incidentServices.length} ACTIVE
              </Badge>
            )}
          </div>
          {!hasActiveIncident && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-border/70 bg-[#121417] gap-1.5"
              onClick={onOpenChaos}
            >
              <Sliders className="h-3 w-3 text-muted-foreground" />
              Inject Fault Simulation
            </Button>
          )}
        </div>

        {hasActiveIncident ? (
          <div className="space-y-4">
            {incidentServices.map((svc: ServiceInfo) => {
              const isLatencySpike = svc.latency_ms != null && svc.latency_ms >= 1000;
              const handleDispatch = () => {
                const issueText = isLatencySpike
                  ? `Response latency measured at ${svc.latency_ms}ms (exceeding SLA threshold).`
                  : `Service returned HTTP 503 unavailable.`;
                if (onDispatchAgent) {
                  onDispatchAgent(svc.service, issueText);
                } else {
                  onOpenAgent();
                }
              };

              return (
                <Card
                  key={svc.service}
                  className="rounded-xl border border-amber-500/40 bg-[#111316] p-5 shadow-xl space-y-5"
                >
                  {/* Incident Title Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/50 pb-4">
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                          {isLatencySpike ? "Latency SLA Threshold Breach" : "Pod Health Check Failure (503)"}
                        </span>
                        <Badge variant="outline" className="border-border/60 text-[9px] font-mono">
                          INC-{String(Date.now() % 1000).padStart(3, "0")}
                        </Badge>
                      </div>
                      <h3 className="mt-1 text-base font-semibold tracking-tight font-mono text-foreground">
                        {isLatencySpike
                          ? `Service [${svc.service}] Latency: ${svc.latency_ms}ms (SLA Threshold: 1000ms)`
                          : `Service [${svc.service}] Unreachable (HTTP 503 Unavailable)`}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 border-border/70 text-xs bg-[#16181c]"
                        onClick={onOpenAgent}
                      >
                        <Terminal className="h-3 w-3" />
                        Agent Session
                      </Button>
                    </div>
                  </div>

                  {/* HUMAN-IN-THE-LOOP AUTHORIZATION PANEL */}
                  <div className="rounded-lg border border-amber-500/40 bg-[#14120c] p-4 font-mono">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-4 items-center rounded border border-amber-500/40 bg-amber-500/20 px-1.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                            TrueForge Agent Harness Dispatch
                          </span>
                          <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-300">
                            TRIAGE READY
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground/90 font-medium pt-1 font-sans leading-relaxed">
                          Dispatch this incident to the <span className="text-amber-300 font-bold font-mono">TrueForge Agent</span> to query MCP tools (<span className="font-mono text-amber-300">fleet-control</span>, <span className="font-mono text-amber-300">deploy-history</span>), correlate recent commits, run sandbox diagnostics, and request human approval ("License to Act") before modifying production.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-4 shadow-md shadow-amber-500/10"
                          onClick={handleDispatch}
                          disabled={remediatingService === svc.service}
                        >
                          <Terminal className="h-3.5 w-3.5" />
                          Dispatch to TrueForge
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* AUTONOMOUS TRIAGE PROGRESSION */}
                  <div>
                    <div className="mb-2 text-[10px] font-mono font-semibold text-muted-foreground/80 uppercase tracking-wider">
                      Autonomous Progression Timeline
                    </div>
                    <div className="space-y-2.5 rounded-lg border border-border/50 bg-[#0e1012] p-4 font-mono">
                      {[
                        {
                          time: "+0.0s",
                          step: isLatencySpike ? "Telemetry SLA Anomaly Triggered" : "Health Probe 503 Outage Detected",
                          detail: isLatencySpike
                            ? `Latency probe returned ${svc.latency_ms}ms (> 1000ms threshold). Watcher dispatched Diagnoser agent.`
                            : `Probe failed with 503. Watcher dispatched Diagnoser agent.`,
                          status: "done",
                        },
                        {
                          time: "+1.2s",
                          step: "Diagnoser Agent Queried MCP Deploy-History",
                          detail: `Bisected commit history for ${svc.service}. Identified synchronous I/O lock in upstream handler.`,
                          status: "done",
                        },
                        {
                          time: "+2.4s",
                          step: "Patcher Agent Formulated Remediation Plan",
                          detail: `Target: ${svc.service}. Action: container recycle & connection queue reset.`,
                          status: "done",
                        },
                        {
                          time: "+2.5s",
                          step: "Holding at License-to-Act Gate",
                          detail: "Agent paused execution awaiting human authorization.",
                          status: "pending",
                        },
                      ].map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs">
                          <span className="font-mono text-[10px] text-muted-foreground/70 shrink-0 w-12 pt-0.5">
                            {step.time}
                          </span>
                          <div className="mt-0.5">
                            {step.status === "done" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0 animate-spin" />
                            )}
                          </div>
                          <div>
                            <div className={`text-xs ${step.status === "pending" ? "text-amber-400 font-semibold" : "text-foreground"}`}>
                              {step.step}
                            </div>
                            <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                              {step.detail}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center rounded-xl border border-border/60 bg-[#111316]">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto opacity-90" />
            <h3 className="mt-3 text-sm font-semibold font-mono">Zero Active Incidents</h3>
            <p className="mt-1 text-xs text-muted-foreground font-mono max-w-md mx-auto">
              All microservices are passing health checks with nominal response latencies. Watcher agent is actively monitoring cluster telemetry.
            </p>
          </Card>
        )}
      </div>

      {/* RESOLVED INCIDENT HISTORY */}
      <div>
        <div className="mb-3 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resolved Incident Ledger
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-mono text-[11px]">Filter:</span>
            {["ALL", "CRITICAL", "HIGH"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  filterSeverity === sev
                    ? "bg-muted text-foreground font-semibold border border-border/70"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredHistory.map((inc) => (
            <Card
              key={inc.id}
              className="rounded-xl border border-border/50 bg-[#111316] p-4 shadow-none space-y-3 font-mono"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase ${
                      inc.severity === "critical"
                        ? "border-red-500/40 text-red-400 bg-red-500/10"
                        : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                    }`}
                  >
                    {inc.severity}
                  </Badge>
                  <span className="font-semibold text-xs text-foreground">{inc.id}</span>
                  <span className="text-xs text-muted-foreground">[{inc.service}]</span>
                  <span className="text-xs text-foreground/90 font-medium">{inc.title}</span>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <span>Duration: {inc.duration}</span>
                  <span className="text-border">·</span>
                  <span>{inc.startedAt}</span>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground/80 bg-[#141619] p-3 rounded-lg border border-border/40 space-y-2">
                <div>
                  <span className="text-muted-foreground font-semibold">Root Cause: </span>
                  {inc.rootCause}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px]">
                  <span className="text-emerald-400/90 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Resolved by {inc.resolvedBy}
                  </span>
                  <span className="text-muted-foreground/70">MCP Tool Audit Verified</span>
                </div>
              </div>

              {/* QODO CODE REVIEW & PREVENTATIVE ACTION */}
              <div className="rounded-lg border border-theme-7/30 bg-[#0d1514] p-3 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-theme-7-light font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <ShieldAlert className="h-3 w-3" /> Qodo Code Review Finding & Preventative Action
                  </span>
                  <Badge variant="outline" className="border-theme-7/40 text-[9px] text-theme-7-light">
                    PR #4 /agentic_review
                  </Badge>
                </div>
                <p className="text-muted-foreground text-[11px] font-sans">
                  Qodo automated PR analysis detected unbounded connection pool allocation in <code className="text-theme-7-light font-mono">orders/src/checkout.ts:84</code>. Recommended adding connection pooling timeout and circuit-breaker threshold before next deployment.
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
