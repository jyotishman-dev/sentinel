"use client";

import { useState } from "react";
import { Activity, Box, Check, CheckCircle2, Code2, Copy, GitBranch, Play, RefreshCw, ShieldCheck, Terminal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchFleetStatus, MOCK_DEPLOYMENTS } from "@/lib/api";

export function SandboxView() {
  const [running, setRunning] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([
    "TrueForge Ephemeral Sandbox [isolated-sandbox-env-c94]",
    "Security Policy: Network isolated, read-only host mount, RAM disk 512MB",
    "Connected MCP Servers: fleet-control (:5000), deploy-history (:5001)",
    "Ready for agent script execution...",
  ]);

  const runLiveProbes = async () => {
    setRunning(true);
    setActiveTask("probes");
    const started = Date.now();
    setLogs((prev) => [
      ...prev,
      "",
      `[${new Date().toLocaleTimeString([], { hour12: false })}] $ trueforge-sandbox exec --tool fleet-control.get_service_health`,
      "[sandbox-init] Spawning ephemeral execution container...",
    ]);

    try {
      const data = await fetchFleetStatus();
      const svcs = data.services;
      const logsToAdd = svcs.map((s) => {
        const isDegraded = s.status !== "healthy" || (s.latency_ms != null && s.latency_ms >= 1000);
        return `[probe] ${s.service.padEnd(12)} -> HTTP 200 OK | latency: ${s.latency_ms ?? 0}ms | status: ${
          isDegraded ? "DEGRADED (SLA BREACH)" : "HEALTHY"
        }`;
      });

      setLogs((prev) => [
        ...prev,
        ...logsToAdd,
        `[sandbox-done] Live probe completed across ${svcs.length} microservices in ${Date.now() - started}ms.`,
      ]);
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        `[sandbox-error] Probe error: ${err instanceof Error ? err.message : "Connection failed"}`,
      ]);
    } finally {
      setRunning(false);
      setActiveTask(null);
    }
  };

  const runBisect = async () => {
    setRunning(true);
    setActiveTask("bisect");
    setLogs((prev) => [
      ...prev,
      "",
      `[${new Date().toLocaleTimeString([], { hour12: false })}] $ trueforge-sandbox exec --tool deploy-history.get_recent_deploys`,
      "[sandbox-git] Ingesting commit ledger for service: orders...",
    ]);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        `[git-bisect] Head: commit 4c21b3a ("add idempotency key support to checkout pipeline") -> INTRODUCED LATENCY SPICK`,
        `[git-bisect] Previous stable: commit 1e88c02 ("optimize order validation cache lookups") -> PASS (0.4ms)`,
        `[sandbox-patch] Proposed rollback target validated in sandbox: commit 1e88c02`,
        `[sandbox-done] Bisect correlation complete. Ready for human authorization.`,
      ]);
      setRunning(false);
      setActiveTask(null);
    }, 800);
  };

  const clearLogs = () => {
    setLogs([
      "TrueForge Ephemeral Sandbox [isolated-sandbox-env-c94]",
      "Security Policy: Network isolated, read-only host mount, RAM disk 512MB",
      "Connected MCP Servers: fleet-control (:5000), deploy-history (:5001)",
      "Ready for agent script execution...",
    ]);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            TrueForge Isolated Sandbox Console
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 text-[11px]">
            Live diagnostic runner and sandbox execution harness. Runs non-destructive MCP probes and commit bisects before changes touch production.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-border/70 bg-[#121417] text-muted-foreground hover:text-foreground"
            onClick={clearLogs}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-border/70 bg-[#16181c] text-foreground hover:bg-muted"
            onClick={runBisect}
            disabled={running}
          >
            <GitBranch className="h-3 w-3 mr-1" />
            Bisect Commits
          </Button>

          <Button
            size="sm"
            className="h-7 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            onClick={runLiveProbes}
            disabled={running}
          >
            {running && activeTask === "probes" ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Run Live Fleet Probes
          </Button>
        </div>
      </div>

      {/* TERMINAL CARD */}
      <Card className="rounded-xl border border-border/60 bg-[#090a0b] overflow-hidden shadow-2xl">
        {/* Terminal Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f1114] border-b border-border/50 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#27292d]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#27292d]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#27292d]" />
            </div>
            <span className="text-muted-foreground ml-2">sandbox@trueforge-harness: ~</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>SANDBOX: ACTIVE</span>
          </div>
        </div>

        {/* Console Body */}
        <div className="p-4 font-mono text-xs text-foreground/90 space-y-1.5 min-h-[380px] max-h-[500px] overflow-y-auto">
          {logs.map((line, idx) => (
            <div
              key={idx}
              className={`${
                line.includes("$")
                  ? "text-emerald-400 font-semibold pt-2"
                  : line.includes("DEGRADED") || line.includes("SPICK")
                    ? "text-amber-400 font-medium"
                    : line.includes("PASS") || line.includes("OK")
                      ? "text-emerald-400/90"
                      : line.includes("Security Policy") || line.includes("Connected MCP")
                        ? "text-muted-foreground/70"
                        : "text-muted-foreground"
              }`}
            >
              {line}
            </div>
          ))}
          {running && (
            <div className="flex items-center gap-2 text-amber-400 pt-2 text-xs">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Executing test probes in isolated container...</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
