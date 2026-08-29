"use client";

import { useState } from "react";
import { Activity, ArrowDown, ArrowRight, Box, Check, CheckCircle2, Cpu, Globe, Layers, Network, Server, ShieldCheck, Sliders, Terminal, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type FleetStatus, type ServiceInfo } from "@/lib/api";

interface TopologyViewProps {
  data: FleetStatus | null;
  onOpenChaos: () => void;
}

export function TopologyView({ data, onOpenChaos }: TopologyViewProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>("api-gateway");
  const services = data?.services ?? [];
  const statusMap = new Map(services.map((s) => [s.service, s]));

  const getStatus = (name: string) => {
    const s = statusMap.get(name);
    if (!s) return "healthy";
    if (s.status !== "healthy") return s.status;
    if (s.latency_ms != null && s.latency_ms >= 1000) return "degraded";
    return "healthy";
  };

  const getLatency = (name: string) => statusMap.get(name)?.latency_ms ?? 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Service Mesh Topology Graph
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ingress traffic propagation, microservice dependency links, and control plane nodes.
          </p>
        </div>
        <Button
          size="sm"
          className="h-7 text-xs border border-border/70 bg-[#121417] hover:bg-muted text-foreground"
          onClick={onOpenChaos}
        >
          <Sliders className="h-3 w-3 mr-1.5" />
          Test Fault in Topology
        </Button>
      </div>

      {/* TOPOLOGY CANVAS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr] font-mono">
        <Card className="p-6 rounded-xl border border-border/60 bg-[#111316] shadow-none min-h-[460px] flex flex-col justify-between relative overflow-hidden">
          {/* Top: Ingress */}
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-[#16181c] px-4 py-2 text-xs text-foreground shadow-sm">
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span>Public Client Ingress Traffic</span>
              <Badge variant="outline" className="border-border/60 text-[9px]">
                HTTPS / 443
              </Badge>
            </div>

            <div className="my-2 flex flex-col items-center">
              <div className="h-5 w-px bg-border/60" />
              <ArrowDown className="h-3 w-3 text-muted-foreground/60" />
            </div>

            {/* Middle: API Gateway */}
            <button
              onClick={() => setSelectedNode("api-gateway")}
              className={`group w-full max-w-sm rounded-lg border p-3.5 text-left transition-all ${
                selectedNode === "api-gateway"
                  ? "border-emerald-500/60 bg-[#16181c] shadow-md shadow-emerald-500/5"
                  : "border-border/60 bg-[#141619] hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      getStatus("api-gateway") === "healthy"
                        ? "bg-emerald-400"
                        : getStatus("api-gateway") === "degraded"
                          ? "bg-amber-400 animate-ping"
                          : "bg-red-400 animate-ping"
                    }`}
                  />
                  <span className="font-semibold text-xs text-foreground">api-gateway</span>
                </div>
                <Badge variant="outline" className="border-border/60 text-[9px] uppercase">
                  {getStatus("api-gateway")}
                </Badge>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                <span>Port: 4001</span>
                <span>Latency: {getLatency("api-gateway")}ms</span>
              </div>
            </button>

            <div className="my-2 flex flex-col items-center">
              <div className="h-5 w-px bg-border/60" />
              <ArrowDown className="h-3 w-3 text-muted-foreground/60" />
            </div>

            {/* Bottom: Downstream Microservices */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
              {["orders", "auth"].map((svc) => {
                const status = getStatus(svc);
                const latency = getLatency(svc);
                return (
                  <button
                    key={svc}
                    onClick={() => setSelectedNode(svc)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      selectedNode === svc
                        ? "border-emerald-500/60 bg-[#16181c] shadow-md shadow-emerald-500/5"
                        : "border-border/60 bg-[#141619] hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            status === "healthy"
                              ? "bg-emerald-400"
                              : status === "degraded"
                                ? "bg-amber-400 animate-ping"
                                : "bg-red-400 animate-ping"
                          }`}
                        />
                        <span className="font-semibold text-xs text-foreground">{svc}</span>
                      </div>
                      <Badge variant="outline" className="border-border/60 text-[9px] uppercase">
                        {status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                      <span>{svc === "orders" ? "Port: 4002" : "Port: 4003"}</span>
                      <span>{latency}ms</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Control Plane Overlay Footer */}
          <div className="mt-6 border-t border-border/40 pt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Fleet Control MCP (:5000)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Deploy History MCP (:5001)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>TrueForge Agent (:8790)</span>
            </div>
          </div>
        </Card>

        {/* NODE INSPECTION SIDEBAR */}
        <Card className="p-5 rounded-xl border border-border/60 bg-[#111316] shadow-none space-y-4">
          <div className="border-b border-border/50 pb-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Node Inspector
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-0.5">
              {selectedNode ? selectedNode : "Select a node"}
            </h3>
          </div>

          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5 bg-[#16181c] p-3 rounded-md border border-border/40">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold text-foreground uppercase">{getStatus(selectedNode)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Measured Latency:</span>
                  <span className="font-semibold text-foreground">{getLatency(selectedNode)}ms</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Network Port:</span>
                  <span className="font-semibold text-foreground">
                    {selectedNode === "api-gateway" ? "4001" : selectedNode === "orders" ? "4002" : "4003"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Health Probe:</span>
                  <span className="text-emerald-400">/health (HTTP GET)</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Upstream / Downstream Links
                </div>
                <div className="text-[11px] text-muted-foreground/90 leading-relaxed">
                  {selectedNode === "api-gateway"
                    ? "Inbound from Public Ingress (443), dispatches downstream to orders (4002) and auth (4003)."
                    : selectedNode === "orders"
                      ? "Inbound from api-gateway (4001), synchronizes checkout transaction pipeline."
                      : "Inbound from api-gateway (4001), validates bearer JWTs."}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Click any node in the topology diagram to inspect telemetry and routes.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
