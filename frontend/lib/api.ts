export type ServiceStatus = "healthy" | "down" | "unreachable";

export interface ServiceInfo {
  service: string;
  status: ServiceStatus;
  latency_ms: number | null;
  checked_at: string;
}

export interface UptimeInfo {
  service: string;
  uptimePct: number;
  consecutiveFailures: number;
  totalPolls: number;
}

export interface LogEntry {
  service: string;
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
}

export interface Summary {
  totalServices: number;
  healthyCount: number;
  activeIncidents: number;
  avgLatencyMs: number | null;
}

export interface FleetStatus {
  services: ServiceInfo[];
  uptime: UptimeInfo[];
  recentLogs: LogEntry[];
  summary: Summary;
}

export type ChaosMode = "kill" | "latency";

const FLEET_URL =
  process.env.NEXT_PUBLIC_FLEET_CONTROL_URL || "http://localhost:5000";
export const AGENT_URL =
  process.env.NEXT_PUBLIC_AGENT_SESSION_URL || "http://localhost:8790";

const DIRECT_PORTS: Record<string, string> = {
  "api-gateway": "http://localhost:4001",
  orders: "http://localhost:4002",
  auth: "http://localhost:4003",
};

export async function fetchFleetStatus(
  signal?: AbortSignal
): Promise<FleetStatus> {
  const res = await fetch(`${FLEET_URL}/status`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
  return (await res.json()) as FleetStatus;
}

export async function triggerChaos(
  serviceName: string,
  mode: ChaosMode
): Promise<{ ok: boolean; error?: string }> {
  try {
    const directUrl = DIRECT_PORTS[serviceName];
    if (directUrl) {
      await fetch(`${directUrl}/chaos/${mode}`, {
        method: "POST",
      }).catch(() => {});
    }

    const res = await fetch(`${FLEET_URL}/trigger-chaos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceName, mode }),
    }).catch(() => null);

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function resetChaos(
  serviceName: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const directUrl = DIRECT_PORTS[serviceName];
    if (directUrl) {
      await fetch(`${directUrl}/chaos/reset`, {
        method: "POST",
      }).catch(() => {});
    }

    await fetch(`${FLEET_URL}/remediate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceName }),
    }).catch(() => null);

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function dispatchIncidentToTrueForgeAgent(
  serviceName: string,
  issueDetails: string
): Promise<{ ok: boolean; turnId?: string; error?: string }> {
  try {
    const activeSessionId = "01m16pm7c2c3pwcn1hfx37stra";
    const prompt = `[CRITICAL INCIDENT ALERT]
Target Service: ${serviceName}
Anomaly Details: ${issueDetails}

Instructions:
1. Phase 1 — Watcher: Confirm fleet status.
2. Phase 2 — Diagnoser: Call get_service_metrics, get_recent_logs, and get_recent_deploys. Correlate timestamps, identify root cause hypothesis.
3. Phase 3 — Patcher: Formulate remediation strategy, state blast radius, and request human approval ("License to Act") before executing state change.`;

    const res = await fetch(`${AGENT_URL}/api/v1/sessions/${activeSessionId}/turns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: [
          {
            type: "user.message",
            content: prompt,
          },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `TrueForge returned HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to dispatch to TrueForge",
    };
  }
}

export interface DeployItem {
  service: string;
  sha: string;
  author: string;
  message: string;
  deployed_at: string;
  status?: "current" | "previous" | "rolled_back";
}

export const MOCK_DEPLOYMENTS: DeployItem[] = [
  {
    service: "api-gateway",
    sha: "7f21a9c",
    author: "jyotishman-dev",
    message: "bump upstream request timeout to 5s & add circuit breaker",
    deployed_at: new Date(Date.now() - 4 * 60_000).toISOString(),
    status: "current",
  },
  {
    service: "orders",
    sha: "4c21b3a",
    author: "jyotishman-dev",
    message: "add idempotency key support to checkout pipeline",
    deployed_at: new Date(Date.now() - 14 * 60_000).toISOString(),
    status: "current",
  },
  {
    service: "auth",
    sha: "9a01e5d",
    author: "jyotishman-dev",
    message: "rotate JWT session token TTL to 15m",
    deployed_at: new Date(Date.now() - 28 * 60_000).toISOString(),
    status: "current",
  },
  {
    service: "orders",
    sha: "1e88c02",
    author: "jyotishman-dev",
    message: "fix rounding precision in order tax calculations",
    deployed_at: new Date(Date.now() - 65 * 60_000).toISOString(),
    status: "previous",
  },
  {
    service: "api-gateway",
    sha: "d304a11",
    author: "jyotishman-dev",
    message: "refactor rate limiter middleware with sliding window",
    deployed_at: new Date(Date.now() - 120 * 60_000).toISOString(),
    status: "previous",
  },
  {
    service: "auth",
    sha: "b452f99",
    author: "jyotishman-dev",
    message: "swap bcrypt rounds to adaptive workload",
    deployed_at: new Date(Date.now() - 180 * 60_000).toISOString(),
    status: "previous",
  },
];

