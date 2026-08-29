"use client";

import { useState } from "react";
import { Check, CheckCircle2, ChevronRight, GitCommit, GitPullRequest, History, RefreshCw, RotateCcw, ShieldCheck, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MOCK_DEPLOYMENTS, resetChaos, type DeployItem } from "@/lib/api";

interface DeploymentsViewProps {
  onRefresh: () => void;
}

export function DeploymentsView({ onRefresh }: DeploymentsViewProps) {
  const [deployments, setDeployments] = useState<DeployItem[]>(MOCK_DEPLOYMENTS);
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [rollingBackSha, setRollingBackSha] = useState<string | null>(null);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  const handleRollback = async (deploy: DeployItem) => {
    setRollingBackSha(deploy.sha);
    setRollbackSuccess(null);

    await resetChaos(deploy.service);

    setTimeout(() => {
      setDeployments((prev) =>
        prev.map((d) => {
          if (d.service === deploy.service) {
            return {
              ...d,
              status: d.sha === deploy.sha ? "current" : "previous",
            };
          }
          return d;
        })
      );
      setRollingBackSha(null);
      setRollbackSuccess(`Rolled back ${deploy.service} to commit ${deploy.sha}`);
      onRefresh();
    }, 600);
  };

  const filteredDeploys = selectedService === "ALL"
    ? deployments
    : deployments.filter((d) => d.service === selectedService);

  return (
    <div className="space-y-6 font-mono">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Deployment History & Rollback Ledger
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono text-[11px]">
            Commit history ingested from deploy-history MCP server. Used by Diagnoser agent to correlate incidents.
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

      {rollbackSuccess && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-3.5 w-3.5" />
          <span>{rollbackSuccess}</span>
        </div>
      )}

      {/* DEPLOYMENT LIST */}
      <div className="space-y-2.5">
        {filteredDeploys.map((dep) => {
          const isLive = dep.status === "current";
          return (
            <Card
              key={`${dep.service}-${dep.sha}`}
              className={`p-4 rounded-xl border bg-[#111316] shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isLive ? "border-emerald-500/40 bg-emerald-500/[0.02]" : "border-border/60 hover:border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-[#16181c] text-muted-foreground">
                  <GitCommit className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      [{dep.service}]
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">{dep.sha}</span>
                    <span className="text-[11px] text-muted-foreground">by @{dep.author}</span>
                    {isLive ? (
                      <Badge className="border-emerald-500/40 bg-emerald-500/10 text-[9px] text-emerald-400 font-mono">
                        LIVE RELEASE
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-border/60 text-[9px] font-mono text-muted-foreground">
                        STABLE PREVIOUS
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-foreground/90 mt-1">
                    {dep.message}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                    Deployed at: {new Date(dep.deployed_at).toLocaleTimeString([], { hour12: false })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {!isLive && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-border/70 bg-[#16181c] text-muted-foreground hover:text-foreground"
                    onClick={() => handleRollback(dep)}
                    disabled={rollingBackSha === dep.sha}
                  >
                    {rollingBackSha === dep.sha ? (
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <RotateCcw className="h-3 w-3 mr-1" />
                    )}
                    Rollback to Commit
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
