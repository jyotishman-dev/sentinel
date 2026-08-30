"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity,
  AlertCircle,
  Box,
  Check,
  ChevronRight,
  Clock,
  Code,
  ExternalLink,
  GitCommit,
  Layers,
  LayoutDashboard,
  ListFilter,
  Loader2,
  Network,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sliders,
  Terminal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { AgentPanel } from "@/components/agent-panel";
import { SettingsDialog } from "@/components/settings-dialog";
import { SearchDialog } from "@/components/search-dialog";

import { OverviewView } from "@/components/views/overview-view";
import { IncidentsView } from "@/components/views/incidents-view";
import { ServicesView } from "@/components/views/services-view";
import { TopologyView } from "@/components/views/topology-view";
import { DeploymentsView } from "@/components/views/deployments-view";
import { ChaosView } from "@/components/views/chaos-view";
import { SandboxView } from "@/components/views/sandbox-view";
import { AuditLogView } from "@/components/views/audit-log-view";

import {
  AGENT_URL,
  fetchFleetStatus,
  triggerChaos,
  resetChaos,
  dispatchIncidentToTrueForgeAgent,
  type FleetStatus,
  type ChaosMode,
} from "@/lib/api";

const navItems = [
  { name: "Overview", icon: LayoutDashboard, section: "Monitoring" },
  { name: "Incidents", icon: AlertCircle, section: "Monitoring" },
  { name: "Services", icon: Server, section: "Monitoring" },
  { name: "Topology", icon: Network, section: "Monitoring" },
  { name: "Deployments", icon: GitCommit, section: "Operations" },
  { name: "Chaos Lab", icon: Sliders, section: "Operations" },
  { name: "Sandbox", icon: Box, section: "Operations" },
  { name: "Audit Log", icon: ListFilter, section: "Operations" },
];

const POLL_INTERVAL = 4000;

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [chaosOpen, setChaosOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);

  const [data, setData] = useState<FleetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Chaos modal state
  const [chaosTarget, setChaosTarget] = useState<string>("");
  const [chaosMode, setChaosMode] = useState<ChaosMode>("kill");
  const [chaosInjecting, setChaosInjecting] = useState(false);
  const [chaosError, setChaosError] = useState<string | null>(null);

  // Remediation approval state
  const [remediatingService, setRemediatingService] = useState<string | null>(null);

  const AGENT_PANEL_WIDTH_VW = 42;
  const contentInsetStyle = {
    right: agentOpen ? `${AGENT_PANEL_WIDTH_VW}vw` : 0,
    transition: "right 300ms ease-in-out",
  };

  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async (isRefresh = false) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    if (isRefresh) setRefreshing(true);
    try {
      const status = await fetchFleetStatus(ac.signal);
      setData(status);
      setError(null);
      setLastUpdated(new Date());
      if (!chaosTarget && status.services.length > 0) {
        setChaosTarget(status.services[0].service);
      }
    } catch (err) {
      if (ac.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Failed to fetch telemetry");
    } finally {
      if (!ac.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [chaosTarget]);

  useEffect(() => {
    doFetch();
    const id = setInterval(() => doFetch(), POLL_INTERVAL);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [doFetch]);

  // Global key listener for '/' search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInjectChaos = async () => {
    if (!chaosTarget) return;
    setChaosInjecting(true);
    setChaosError(null);
    const result = await triggerChaos(chaosTarget, chaosMode);
    setChaosInjecting(false);
    if (result.ok) {
      setChaosOpen(false);
      doFetch(true);
    } else {
      setChaosError(result.error || "Injection failed");
    }
  };

  const handleDispatchAgent = async (serviceName: string, details?: string) => {
    setRemediatingService(serviceName);
    setAgentOpen(true);
    try {
      await dispatchIncidentToTrueForgeAgent(
        serviceName,
        details || `Service is reporting abnormal telemetry / downtime.`
      );
    } finally {
      setTimeout(() => {
        setRemediatingService(null);
      }, 800);
    }
  };

  const handleApproveRemediation = async (serviceName: string) => {
    setRemediatingService(serviceName);
    
    // Optimistic instant state transition
    setData((prev) => {
      if (!prev) return prev;
      const updated = prev.services.map((s) =>
        s.service === serviceName ? { ...s, status: "healthy" as const, latency_ms: 1 } : s
      );
      return {
        ...prev,
        services: updated,
        summary: {
          ...prev.summary,
          healthyCount: updated.length,
          activeIncidents: 0,
        },
      };
    });

    try {
      await resetChaos(serviceName);
    } finally {
      setTimeout(() => {
        doFetch(true);
        setRemediatingService(null);
      }, 500);
    }
  };

  const groupedNav = navItems.reduce<Record<string, typeof navItems>>(
    (acc, item) => {
      (acc[item.section] ||= []).push(item);
      return acc;
    },
    {}
  );

  const services = data?.services ?? [];
  const incidentServices = services.filter(
    (s) => s.status !== "healthy" || (s.latency_ms != null && s.latency_ms >= 1000)
  );
  const incidentCount = incidentServices.length;
  const navBadge = incidentCount > 0 ? incidentCount : undefined;

  return (
    <main className="relative min-h-screen bg-[#090a0b] text-[#ededed] font-sans antialiased selection:bg-primary/20">
      {/* TOP NAV BAR */}
      <header
        className="fixed left-0 top-0 z-50 h-13 border-b border-border/50 bg-[#0c0d0e]/90 backdrop-blur-md"
        style={contentInsetStyle}
      >
        <div className="flex h-full items-center justify-between">
          <div className="flex h-full items-center">
            {/* Brand Logo */}
            <div className="flex h-full w-[220px] items-center border-r border-border/50 px-4 gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-[#16181b] text-foreground shadow-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-tight text-foreground">
                  sentinel
                </div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                  control plane
                </div>
              </div>
            </div>

            {/* Cluster Status & Telemetry Metadata */}
            <div className="hidden md:flex items-center gap-4 px-4 text-xs">
              <div className="flex items-center gap-2">
                {error ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    <span className="text-red-400 font-mono text-[11px]">unreachable</span>
                  </>
                ) : incidentCount > 0 ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 font-mono text-[11px]">
                      {incidentCount} active incident{incidentCount > 1 ? "s" : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-muted-foreground font-mono text-[11px]">all systems nominal</span>
                  </>
                )}
              </div>
              <Separator orientation="vertical" className="h-3.5 bg-border/60" />
              <div className="font-mono text-[11px] text-muted-foreground/80 flex items-center gap-2">
                <span>mesh: local-docker</span>
                <span className="text-border">·</span>
                <span>agent: trueforge:8790</span>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 px-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground font-mono"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-3 w-3" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="rounded border border-border/80 bg-muted/60 px-1 py-0.2 font-mono text-[9px]">
                /
              </kbd>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-border/70 bg-[#121417] text-xs font-mono hover:bg-muted"
              onClick={() => doFetch(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </Button>

            <Button
              size="sm"
              className="h-7 gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono"
              onClick={() => setAgentOpen(true)}
            >
              <Terminal className="h-3 w-3" />
              Agent Harness
            </Button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/70 bg-[#121417] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-13">
        {/* SIDEBAR */}
        <aside className="fixed bottom-0 left-0 top-13 z-40 w-[220px] border-r border-border/50 bg-[#0c0d0e]/60 backdrop-blur-md">
          <div className="flex h-full flex-col p-3 justify-between">
            <div className="space-y-5">
              {Object.entries(groupedNav).map(([section, items]) => (
                <div key={section} className="space-y-1">
                  <div className="px-2.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {section}
                  </div>
                  <nav className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = activeNav === item.name;
                      const showBadge = item.name === "Incidents" && navBadge;
                      return (
                        <button
                          key={item.name}
                          onClick={() => setActiveNav(item.name)}
                          className={`group flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-mono transition-colors ${
                            active
                              ? "bg-[#181a1e] text-foreground font-medium border border-border/60"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent"
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon
                              className={`h-3.5 w-3.5 ${
                                active ? "text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
                              }`}
                            />
                            {item.name}
                          </span>
                          {showBadge ? (
                            <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[9px] font-mono font-medium">
                              {navBadge}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ))}

              {/* Agent Runtime Sidebar Pill */}
              <div className="space-y-1 pt-1">
                <div className="px-2.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Agent Harness Runtime
                </div>
                <div className="rounded-lg border border-border/50 bg-[#121417]/80 p-2.5 space-y-2 text-[11px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Watcher:</span>
                    <span className={incidentCount > 0 ? "text-amber-400" : "text-emerald-400"}>
                      {incidentCount > 0 ? "Triage Active" : "Nominal"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Diagnoser:</span>
                    <span className="text-muted-foreground/80">
                      {incidentCount > 0 ? "Correlating" : "Standby"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Patcher:</span>
                    <span className="text-muted-foreground/80">
                      {incidentCount > 0 ? "License Hold" : "Standby"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Session Open */}
            <div className="pt-2 border-t border-border/50">
              <button
                onClick={() => setAgentOpen(true)}
                className="flex w-full items-center justify-between rounded-md border border-border/50 bg-[#121417] px-2.5 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                  Live Session
                </span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN VIEW CONTENT AREA */}
        <section
          className="ml-[220px] transition-[width] duration-300 ease-in-out"
          style={{
            width: agentOpen
              ? `calc(100% - 220px - ${AGENT_PANEL_WIDTH_VW}vw)`
              : "calc(100% - 220px)",
          }}
        >
          <div className="mx-auto max-w-[1500px] p-6 space-y-6">
            {/* VIEW HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 mb-1">
                  <span>Control Plane</span>
                  <span>/</span>
                  <span className="text-foreground">{activeNav}</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {activeNav === "Overview" && "System Health & Cluster Telemetry"}
                  {activeNav === "Incidents" && "Incident Command & Remediation Ledger"}
                  {activeNav === "Services" && "Fleet Service Mesh Inspection"}
                  {activeNav === "Topology" && "Traffic Flow & Topology Map"}
                  {activeNav === "Deployments" && "Deployment History & Rollbacks"}
                  {activeNav === "Chaos Lab" && "Fault Injection & Chaos Engineering"}
                  {activeNav === "Sandbox" && "Agent Isolated Execution Sandbox"}
                  {activeNav === "Audit Log" && "System & Agent Audit Trail"}
                </h1>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <div className="rounded-md border border-border/60 bg-[#121417] px-2.5 py-1 text-muted-foreground text-[11px] flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground/70" />
                  <span>{lastUpdated ? lastUpdated.toLocaleTimeString([], { hour12: false }) : "Polling..."}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-mono border-border/70 bg-[#121417] hover:bg-muted"
                  onClick={() => setChaosOpen(true)}
                >
                  <Sliders className="h-3 w-3 mr-1" />
                  Fault Injection
                </Button>
              </div>
            </div>

            {/* DYNAMIC VIEW ROUTING */}
            {activeNav === "Overview" && (
              <OverviewView
                data={data}
                loading={loading}
                onOpenChaos={() => setChaosOpen(true)}
                onOpenAgent={() => setAgentOpen(true)}
                onNavigate={(v) => setActiveNav(v)}
                onApproveRemediation={handleApproveRemediation}
                onDispatchAgent={handleDispatchAgent}
                remediatingService={remediatingService}
              />
            )}

            {activeNav === "Incidents" && (
              <IncidentsView
                data={data}
                onApproveRemediation={handleApproveRemediation}
                onDispatchAgent={handleDispatchAgent}
                remediatingService={remediatingService}
                onOpenChaos={() => setChaosOpen(true)}
                onOpenAgent={() => setAgentOpen(true)}
              />
            )}

            {activeNav === "Services" && (
              <ServicesView data={data} onRefresh={() => doFetch(true)} />
            )}

            {activeNav === "Topology" && (
              <TopologyView data={data} onOpenChaos={() => setChaosOpen(true)} />
            )}

            {activeNav === "Deployments" && (
              <DeploymentsView onRefresh={() => doFetch(true)} />
            )}

            {activeNav === "Chaos Lab" && (
              <ChaosView data={data} onRefresh={() => doFetch(true)} />
            )}

            {activeNav === "Sandbox" && <SandboxView />}

            {activeNav === "Audit Log" && <AuditLogView data={data} />}
          </div>
        </section>
      </div>

      {/* CHAOS MODAL */}
      {chaosOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setChaosOpen(false);
            setChaosError(null);
          }}
        >
          <Card
            className="w-[460px] max-w-[92vw] border-border/70 bg-[#0e1012] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Fault Injection Trigger</h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono text-[11px]">
                  Simulate live microservice failure or latency anomaly.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground font-mono"
                onClick={() => {
                  setChaosOpen(false);
                  setChaosError(null);
                }}
              >
                ESC
              </Button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Target Service
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {services.map((svc) => (
                    <button
                      key={svc.service}
                      onClick={() => setChaosTarget(svc.service)}
                      className={`p-2 rounded-md border text-left transition-colors ${
                        chaosTarget === svc.service
                          ? "border-emerald-500/60 bg-emerald-500/10 text-foreground"
                          : "border-border/60 bg-[#141619] text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="font-semibold">{svc.service}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{svc.status}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Failure Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { mode: "latency" as ChaosMode, label: "Latency Spike (+3000ms)", desc: "Simulates database queue bottleneck" },
                    { mode: "kill" as ChaosMode, label: "Pod Failure (503)", desc: "Forces service unavailable status" },
                  ].map((f) => (
                    <button
                      key={f.mode}
                      onClick={() => setChaosMode(f.mode)}
                      className={`p-2.5 rounded-md border text-left transition-colors ${
                        chaosMode === f.mode
                          ? "border-amber-500/60 bg-amber-500/10 text-foreground"
                          : "border-border/60 bg-[#141619] text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="font-semibold text-foreground text-xs">{f.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 leading-snug">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {chaosError && (
                <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-[11px] text-red-400">
                  {chaosError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-border/70 bg-transparent text-xs"
                  onClick={() => {
                    setChaosOpen(false);
                    setChaosError(null);
                  }}
                  disabled={chaosInjecting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-amber-500 text-black hover:bg-amber-400 font-semibold text-xs"
                  onClick={handleInjectChaos}
                  disabled={chaosInjecting || !chaosTarget}
                >
                  {chaosInjecting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  ) : null}
                  Inject Fault
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SEARCH DIALOG */}
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectNav={(name) => setActiveNav(name)}
      />

      {/* SETTINGS DIALOG */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* AGENT DRAWER PANEL */}
      <AgentPanel
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        agentUrl={AGENT_URL}
      />
    </main>
  );
}
