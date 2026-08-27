"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  Box,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  Cpu,
  GitCommit,
  HardDrive,
  LayoutDashboard,
  ListFilter,
  Network,
  Play,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

type Service = {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency: string;
  requests: string;
  errors: string;
  cpu: number;
  memory: number;
};

const services: Service[] = [
  {
    name: "api-gateway",
    status: "healthy",
    latency: "38ms",
    requests: "1.2k/s",
    errors: "0.1%",
    cpu: 31,
    memory: 42,
  },
  {
    name: "orders",
    status: "degraded",
    latency: "421ms",
    requests: "842/s",
    errors: "17.2%",
    cpu: 78,
    memory: 61,
  },
  {
    name: "auth",
    status: "healthy",
    latency: "21ms",
    requests: "1.8k/s",
    errors: "0.0%",
    cpu: 24,
    memory: 38,
  },
];

const events = [
  {
    time: "10:41:23",
    type: "success",
    text: "orders recovery confirmed",
  },
  {
    time: "10:41:19",
    type: "deploy",
    text: "configuration patch applied",
  },
  {
    time: "10:41:14",
    type: "approval",
    text: "human approval received",
  },
  {
    time: "10:41:12",
    type: "patch",
    text: "patch #17 passed sandbox validation",
  },
  {
    time: "10:41:08",
    type: "diagnosis",
    text: "root cause identified by diagnoser",
  },
  {
    time: "10:41:05",
    type: "analysis",
    text: "diagnoser started log correlation",
  },
  {
    time: "10:41:03",
    type: "incident",
    text: "incident INC-042 created",
  },
];

function StatusDot({ status }: { status: Service["status"] }) {
  if (status === "healthy") {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
    );
  }

  if (status === "degraded") {
    return <span className="h-2 w-2 rounded-full bg-amber-400" />;
  }

  return <span className="h-2 w-2 rounded-full bg-red-500" />;
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-zinc-500">{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          {label}
        </div>
        <div className="font-mono text-sm text-zinc-200">{value}</div>
      </div>
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case "success":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case "incident":
      return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />;
    case "approval":
      return <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />;
    case "patch":
      return <Code2 className="h-3.5 w-3.5 text-purple-400" />;
    case "diagnosis":
      return <Bot className="h-3.5 w-3.5 text-cyan-400" />;
    default:
      return <Activity className="h-3.5 w-3.5 text-zinc-400" />;
  }
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [chaosOpen, setChaosOpen] = useState(false);
  const [approved, setApproved] = useState(false);

  return (
    <main className="min-h-screen bg-[#08090b] text-zinc-200">
      {/* TOP BAR */}
      <header className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-zinc-800/80 bg-[#0b0c0f]/95 backdrop-blur">
        <div className="flex h-full items-center">
          <div className="flex h-full w-[220px] items-center border-r border-zinc-800/80 px-5">
            <div className="mr-3 flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-black">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div>
              <div className="text-sm font-semibold tracking-tight">
                sentinel
              </div>
              <div className="font-mono text-[9px] text-zinc-500">
                CONTROL PLANE
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-between px-5">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-zinc-400">All systems operational</span>
              </div>

              <Separator orientation="vertical" className="h-4 bg-zinc-800" />

              <div className="font-mono text-xs text-zinc-500">
                production / us-east-1
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <Search className="h-3.5 w-3.5" />
                Search
                <kbd className="ml-2 rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[9px]">
                  /
                </kbd>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 border-zinc-700 bg-transparent text-xs hover:bg-zinc-800"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>

              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        {/* SIDEBAR */}
        <aside className="fixed bottom-0 left-0 top-14 w-[220px] border-r border-zinc-800/80 bg-[#0b0c0f]">
          <div className="p-3">
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Monitor
            </div>

            <nav className="space-y-0.5">
              {[
                ["Overview", LayoutDashboard],
                ["Incidents", AlertTriangle],
                ["Services", Server],
                ["Topology", Network],
              ].map(([name, Icon]: any) => (
                <button
                  key={name}
                  onClick={() => setActiveNav(name)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs transition ${
                    activeNav === name
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {name}
                  </span>

                  {name === "Incidents" && (
                    <Badge className="h-5 bg-red-500/10 px-1.5 text-[9px] text-red-400 hover:bg-red-500/10">
                      1
                    </Badge>
                  )}
                </button>
              ))}
            </nav>

            <div className="mb-2 mt-7 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Operations
            </div>

            <nav className="space-y-0.5">
              {[
                ["Deployments", GitCommit],
                ["Chaos Lab", Zap],
                ["Sandbox", Box],
                ["Audit Log", ListFilter],
              ].map(([name, Icon]: any) => (
                <button
                  key={name}
                  onClick={() => {
                    setActiveNav(name);
                    if (name === "Chaos Lab") setChaosOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-300"
                >
                  <Icon className="h-4 w-4" />
                  {name}
                </button>
              ))}
            </nav>

            <div className="mb-2 mt-7 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Agent Runtime
            </div>

            <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
              {[
                ["Watcher", "Monitoring"],
                ["Diagnoser", "Idle"],
                ["Patcher", "Idle"],
              ].map(([agent, status]) => (
                <div
                  key={agent}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs text-zinc-400">{agent}</span>
                  </div>
                  <span className="font-mono text-[9px] text-zinc-600">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800/80 p-3">
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300">
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <section className="ml-[220px] w-[calc(100%-220px)]">
          <div className="mx-auto max-w-[1500px] p-6">
            {/* PAGE HEADER */}
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
                  <span>Production</span>
                  <ChevronDown className="h-3 w-3" />
                </div>

                <h1 className="text-xl font-semibold tracking-tight">
                  Fleet overview
                </h1>

                <p className="mt-1 text-xs text-zinc-500">
                  Live infrastructure health and autonomous operations.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-zinc-700 bg-transparent text-xs"
                >
                  <Clock3 className="mr-2 h-3.5 w-3.5" />
                  Last 15 minutes
                </Button>

                <Button
                  size="sm"
                  className="h-8 bg-zinc-100 text-xs text-black hover:bg-white"
                  onClick={() => setChaosOpen(true)}
                >
                  <Zap className="mr-2 h-3.5 w-3.5" />
                  Chaos Lab
                </Button>
              </div>
            </div>

            {/* SUMMARY */}
            <div className="mb-5 grid grid-cols-4 gap-3">
              {[
                ["Services", "3 / 3", "Operational"],
                ["Active incidents", "1", "Needs attention"],
                ["Requests", "3.8k/s", "Across fleet"],
                ["Uptime", "99.97%", "Last 30 days"],
              ].map(([label, value, sub], i) => (
                <Card
                  key={label}
                  className="rounded-lg border-zinc-800 bg-[#0d0f12] p-4 shadow-none"
                >
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">
                    {label}
                  </div>

                  <div className="mt-2 text-2xl font-semibold tracking-tight">
                    {value}
                  </div>

                  <div
                    className={`mt-1 text-[10px] ${
                      i === 1 ? "text-amber-500" : "text-zinc-600"
                    }`}
                  >
                    {sub}
                  </div>
                </Card>
              ))}
            </div>

            {/* SERVICES */}
            <div className="mb-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-zinc-300">
                  Services
                </h2>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-zinc-500 hover:bg-zinc-900"
                >
                  View all
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {services.map((service) => (
                  <Card
                    key={service.name}
                    className={`rounded-lg border-zinc-800 bg-[#0d0f12] p-4 shadow-none ${
                      service.status === "degraded"
                        ? "border-amber-500/30"
                        : ""
                    }`}
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <StatusDot status={service.status} />

                        <span className="font-mono text-sm">
                          {service.name}
                        </span>
                      </div>

                      <Badge
                        variant="outline"
                        className={`border-zinc-700 text-[9px] uppercase ${
                          service.status === "degraded"
                            ? "border-amber-500/30 text-amber-400"
                            : "text-emerald-500"
                        }`}
                      >
                        {service.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Metric
                        icon={<Activity className="h-3.5 w-3.5" />}
                        label="Latency"
                        value={service.latency}
                      />

                      <Metric
                        icon={<Zap className="h-3.5 w-3.5" />}
                        label="Requests"
                        value={service.requests}
                      />

                      <Metric
                        icon={<AlertTriangle className="h-3.5 w-3.5" />}
                        label="Errors"
                        value={service.errors}
                      />
                    </div>

                    <Separator className="my-4 bg-zinc-800" />

                    <div className="space-y-3">
                      <div>
                        <div className="mb-1.5 flex justify-between text-[10px]">
                          <span className="text-zinc-600">CPU</span>
                          <span className="font-mono text-zinc-500">
                            {service.cpu}%
                          </span>
                        </div>

                        <Progress
                          value={service.cpu}
                          className="h-1 bg-zinc-800"
                        />
                      </div>

                      <div>
                        <div className="mb-1.5 flex justify-between text-[10px]">
                          <span className="text-zinc-600">Memory</span>
                          <span className="font-mono text-zinc-500">
                            {service.memory}%
                          </span>
                        </div>

                        <Progress
                          value={service.memory}
                          className="h-1 bg-zinc-800"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* LOWER GRID */}
            <div className="grid grid-cols-[1.4fr_0.9fr] gap-3">
              {/* INCIDENT */}
              <Card className="rounded-lg border-zinc-800 bg-[#0d0f12] shadow-none">
                <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="text-sm font-medium">
                        Active incident
                      </span>
                    </div>

                    <div className="mt-1 font-mono text-[10px] text-zinc-600">
                      INC-042 · orders
                    </div>
                  </div>

                  <Badge className="bg-amber-500/10 text-[9px] text-amber-400 hover:bg-amber-500/10">
                    INVESTIGATING
                  </Badge>
                </div>

                <div className="p-4">
                  <div className="mb-5">
                    <div className="text-base font-medium">
                      Orders service latency degradation
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      Elevated latency detected across the orders API.
                    </div>
                  </div>

                  <div className="mb-6 grid grid-cols-3 gap-3">
                    <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-3">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">
                        Latency
                      </div>
                      <div className="mt-1 font-mono text-lg text-amber-400">
                        421ms
                      </div>
                      <div className="text-[9px] text-zinc-600">
                        +380ms baseline
                      </div>
                    </div>

                    <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-3">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">
                        Error rate
                      </div>
                      <div className="mt-1 font-mono text-lg text-red-400">
                        17.2%
                      </div>
                      <div className="text-[9px] text-zinc-600">
                        +16.9% baseline
                      </div>
                    </div>

                    <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-3">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">
                        Duration
                      </div>
                      <div className="mt-1 font-mono text-lg">
                        02m 18s
                      </div>
                      <div className="text-[9px] text-zinc-600">
                        since detection
                      </div>
                    </div>
                  </div>

                  {/* INCIDENT PIPELINE */}
                  <div className="mb-6">
                    <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">
                      Resolution pipeline
                    </div>

                    <div className="flex items-center">
                      {[
                        ["Detected", true],
                        ["Diagnosed", true],
                        ["Validated", true],
                        ["Approval", !approved],
                        ["Recovery", approved],
                      ].map(([label, done], i) => (
                        <div
                          key={label as string}
                          className="flex flex-1 items-center"
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                                done
                                  ? "border-emerald-500/40 bg-emerald-500/10"
                                  : "border-zinc-700 bg-zinc-900"
                              }`}
                            >
                              {done ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                              )}
                            </div>

                            <span className="mt-2 text-[9px] text-zinc-500">
                              {label as string}
                            </span>
                          </div>

                          {i < 4 && (
                            <div className="mx-2 h-px flex-1 bg-zinc-800" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ROOT CAUSE */}
                  <div className="rounded-md border border-zinc-800 bg-[#0a0c0f] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Bot className="h-4 w-4 text-cyan-400" />

                      <span className="text-xs font-medium">
                        Diagnoser finding
                      </span>

                      <Badge
                        variant="outline"
                        className="ml-auto border-cyan-500/20 text-[9px] text-cyan-400"
                      >
                        91% CONFIDENCE
                      </Badge>
                    </div>

                    <p className="text-xs leading-5 text-zinc-400">
                      Configuration mismatch introduced during deployment{" "}
                      <span className="font-mono text-zinc-300">#184</span>.
                      Sandbox reproduction confirmed the failure.
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[9px] text-emerald-500">
                        <CheckCircle2 className="h-3 w-3" />
                        logs correlated
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] text-emerald-500">
                        <CheckCircle2 className="h-3 w-3" />
                        deploy matched
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] text-emerald-500">
                        <CheckCircle2 className="h-3 w-3" />
                        sandbox verified
                      </div>
                    </div>
                  </div>

                  {/* APPROVAL */}
                  {!approved ? (
                    <div className="mt-4 flex items-center justify-between rounded-md border border-blue-500/20 bg-blue-500/[0.04] p-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <ShieldCheck className="h-4 w-4 text-blue-400" />
                          Action requires approval
                        </div>

                        <div className="mt-1 text-[10px] text-zinc-600">
                          Patch #17 · low blast radius · sandbox tests passed
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-zinc-700 bg-transparent text-xs"
                        >
                          Reject
                        </Button>

                        <Button
                          size="sm"
                          className="h-8 bg-blue-600 text-xs hover:bg-blue-500"
                          onClick={() => setApproved(true)}
                        >
                          Approve fix
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-3 rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />

                      <div>
                        <div className="text-xs font-medium text-emerald-400">
                          Fix approved and deployed
                        </div>

                        <div className="mt-1 text-[10px] text-zinc-600">
                          Watcher is monitoring recovery.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* ACTIVITY */}
              <Card className="rounded-lg border-zinc-800 bg-[#0d0f12] shadow-none">
                <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                  <div>
                    <div className="text-sm font-medium">System activity</div>
                    <div className="mt-1 text-[10px] text-zinc-600">
                      Live event stream
                    </div>
                  </div>

                  <Activity className="h-4 w-4 text-zinc-600" />
                </div>

                <div className="divide-y divide-zinc-800/60">
                  {events.map((event) => (
                    <div
                      key={`${event.time}-${event.text}`}
                      className="flex gap-3 px-4 py-3"
                    >
                      <div className="mt-0.5">
                        <EventIcon type={event.type} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-zinc-400">
                          {event.text}
                        </div>

                        <div className="mt-1 font-mono text-[9px] text-zinc-700">
                          {event.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-800 p-3">
                  <Button
                    variant="ghost"
                    className="h-7 w-full text-[10px] text-zinc-600 hover:bg-zinc-900 hover:text-zinc-400"
                  >
                    View complete activity
                  </Button>
                </div>
              </Card>
            </div>

            {/* AGENTS */}
            <div className="mt-5">
              <div className="mb-3 text-xs font-semibold text-zinc-300">
                Agent runtime
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    name: "Watcher",
                    role: "Detection & monitoring",
                    icon: Activity,
                    state: "ACTIVE",
                    detail: "Polling fleet health",
                  },
                  {
                    name: "Diagnoser",
                    role: "Root cause analysis",
                    icon: Bot,
                    state: "IDLE",
                    detail: "Awaiting incident",
                  },
                  {
                    name: "Patcher",
                    role: "Remediation planning",
                    icon: Code2,
                    state: approved ? "DEPLOYING" : "STANDBY",
                    detail: approved
                      ? "Applying patch #17"
                      : "Awaiting approval",
                  },
                ].map((agent) => {
                  const Icon = agent.icon;

                  return (
                    <Card
                      key={agent.name}
                      className="rounded-lg border-zinc-800 bg-[#0d0f12] p-4 shadow-none"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900">
                            <Icon className="h-4 w-4 text-zinc-400" />
                          </div>

                          <div>
                            <div className="text-xs font-medium">
                              {agent.name}
                            </div>

                            <div className="mt-0.5 text-[9px] text-zinc-600">
                              {agent.role}
                            </div>
                          </div>
                        </div>

                        <span className="flex items-center gap-1.5 font-mono text-[8px] text-zinc-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {agent.state}
                        </span>
                      </div>

                      <Separator className="my-4 bg-zinc-800" />

                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <Terminal className="h-3 w-3" />
                        {agent.detail}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* CHAOS MODAL */}
      {chaosOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <Card className="w-[480px] border-zinc-700 bg-[#101216] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-semibold">Chaos Lab</h2>
                </div>

                <p className="mt-1 text-xs text-zinc-500">
                  Inject a controlled failure into the fleet.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-zinc-500"
                onClick={() => setChaosOpen(false)}
              >
                ESC
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-600">
                  Target service
                </label>

                <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 font-mono text-xs">
                  orders
                  <ChevronDown className="float-right h-3.5 w-3.5 text-zinc-600" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-widest text-zinc-600">
                  Failure mode
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Kill container",
                    "Spike latency",
                    "Corrupt config",
                    "Memory pressure",
                  ].map((failure) => (
                    <button
                      key={failure}
                      className="rounded-md border border-zinc-800 bg-zinc-900/30 px-3 py-3 text-left text-xs text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
                    >
                      {failure}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-amber-500/20 bg-amber-500/[0.03] p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-amber-400" />

                  <div>
                    <div className="text-[10px] font-medium text-amber-400">
                      Controlled failure
                    </div>

                    <div className="mt-1 text-[9px] leading-4 text-zinc-600">
                      This will intentionally degrade the selected service.
                      Sentinel should detect and respond automatically.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="border-zinc-700 bg-transparent text-xs"
                  onClick={() => setChaosOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  className="bg-amber-500 text-xs text-black hover:bg-amber-400"
                  onClick={() => {
                    setChaosOpen(false);
                  }}
                >
                  <Play className="mr-2 h-3.5 w-3.5" />
                  Inject failure
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}