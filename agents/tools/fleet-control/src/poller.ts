import { listServiceNames, getServiceHealth, type ServiceHealth } from "./fleet-client.js";
import { pushLog } from "./log-buffer.js";

const lastStatus = new Map<string, ServiceHealth["status"]>();
const latestSnapshot = new Map<string, ServiceHealth>();

export function getLatestSnapshot(serviceName: string): ServiceHealth | undefined {
  return latestSnapshot.get(serviceName);
}

export function getAllSnapshots(): ServiceHealth[] {
  return listServiceNames().map(
    (name) => latestSnapshot.get(name) ?? { service: name, status: "unreachable" }
  );
}

interface ServiceUptime {
  totalPolls: number;
  healthyPolls: number;
  consecutiveFailures: number;
}

const uptimeTracker = new Map<string, ServiceUptime>();

export function getUptimeInfo() {
  return listServiceNames().map((name) => {
    const tracker = uptimeTracker.get(name) || { totalPolls: 1, healthyPolls: 1, consecutiveFailures: 0 };
    const pct = (tracker.healthyPolls / Math.max(tracker.totalPolls, 1)) * 100;
    return {
      service: name,
      uptimePct: pct,
      consecutiveFailures: tracker.consecutiveFailures,
      totalPolls: tracker.totalPolls,
    };
  });
}

export function getFleetSummary() {
  const snapshots = getAllSnapshots();
  const totalServices = snapshots.length;
  const healthyCount = snapshots.filter((s) => s.status === "healthy").length;
  const activeIncidents = snapshots.filter((s) => s.status !== "healthy").length;
  
  const latencies = snapshots.map((s) => s.latency_ms ?? 0);
  const avgLatencyMs = latencies.length > 0 
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) 
    : 0;

  return {
    totalServices,
    healthyCount,
    activeIncidents,
    avgLatencyMs,
  };
}

async function pollOnce(): Promise<void> {
  for (const name of listServiceNames()) {
    const health = await getServiceHealth(name);
    latestSnapshot.set(name, health);

    // Update uptime tracker
    let tracker = uptimeTracker.get(name);
    if (!tracker) {
      tracker = { totalPolls: 0, healthyPolls: 0, consecutiveFailures: 0 };
      uptimeTracker.set(name, tracker);
    }
    tracker.totalPolls += 1;
    if (health.status === "healthy") {
      tracker.healthyPolls += 1;
      tracker.consecutiveFailures = 0;
    } else {
      tracker.consecutiveFailures += 1;
    }

    const prev = lastStatus.get(name);
    if (prev && prev !== health.status) {
      pushLog({
        service: name,
        level: health.status === "healthy" ? "info" : health.status === "degraded" ? "warn" : "error",
        message: health.status === "degraded"
          ? `status changed: ${prev} -> degraded (latency ${health.latency_ms}ms > 1000ms SLA breach)`
          : `status changed: ${prev} -> ${health.status}`,
      });
    }
    lastStatus.set(name, health.status);
  }
}

let intervalHandle: ReturnType<typeof setInterval> | undefined;

export function startPolling(intervalMs = 4000): void {
  if (intervalHandle) return; // idempotent - safe to call more than once
  void pollOnce();
  intervalHandle = setInterval(() => void pollOnce(), intervalMs);
}