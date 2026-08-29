"use client";

import { useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Download, Filter, Info, ListFilter, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type FleetStatus, type LogEntry } from "@/lib/api";

interface AuditLogViewProps {
  data: FleetStatus | null;
}

export function AuditLogView({ data }: AuditLogViewProps) {
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const logs: LogEntry[] = data?.recentLogs ?? [];

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== "ALL" && log.level.toUpperCase() !== levelFilter) return false;
    if (serviceFilter !== "ALL" && log.service !== serviceFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.service.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel-audit-log-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            System & Agent Audit Trail
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 text-[11px]">
            Append-only immutable event ledger of telemetry state changes, anomaly triggers, and agent interventions.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-border/70 bg-[#121417] text-muted-foreground hover:text-foreground"
          onClick={handleExport}
        >
          <Download className="h-3 w-3 mr-1.5" />
          Export JSON
        </Button>
      </div>

      {/* FILTER BAR */}
      <Card className="rounded-xl border border-border/60 bg-[#111316] p-3 shadow-none flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 border-0 bg-transparent text-xs shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Level Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground">Level:</span>
            {["ALL", "ERROR", "WARN", "INFO"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  levelFilter === lvl
                    ? "bg-muted text-foreground font-semibold border border-border/70"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Service Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground">Service:</span>
            {["ALL", "api-gateway", "orders", "auth"].map((svc) => (
              <button
                key={svc}
                onClick={() => setServiceFilter(svc)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  serviceFilter === svc
                    ? "bg-muted text-foreground font-semibold border border-border/70"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {svc}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* LOG STREAM LIST */}
      <Card className="rounded-xl border border-border/60 bg-[#111316] overflow-hidden shadow-none">
        <div className="divide-y divide-border/30">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No matching log records found.
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3 flex items-start gap-3 text-xs transition-colors hover:bg-muted/10"
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                    log.level === "error"
                      ? "bg-red-400"
                      : log.level === "warn"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                  }`}
                />
                <div className="font-mono text-[10px] text-muted-foreground/70 shrink-0 w-20 pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">[{log.service}]</span>
                    <Badge
                      variant="outline"
                      className={`text-[8px] uppercase px-1 py-0 ${
                        log.level === "error"
                          ? "border-red-500/40 text-red-400 bg-red-500/10"
                          : log.level === "warn"
                            ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                            : "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                      }`}
                    >
                      {log.level}
                    </Badge>
                  </div>
                  <div className="text-foreground/90 mt-1 text-[11px]">
                    {log.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
