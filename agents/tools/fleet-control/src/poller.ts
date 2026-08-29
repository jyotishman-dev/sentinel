import { listServiceNames, getServiceHealth, type ServiceHealth } from "./fleet-client.js";
import { pushLog } from "./log-buffer.js";

const lastStatus = new Map<string, ServiceHealth["status"]>();
const latestSnapshot = new Map<string, ServiceHealth>();

export function getLatestSnapshot(serviceName: string): ServiceHealth | undefined {
  return latestSnapshot.get(serviceName);
}

export function getAllSnapshots(): ServiceHealth[] {
  return listServiceNames().map(
    (name) =>
      latestSnapshot.get(name) ?? {
        service: name,
        status: "unreachable",
        checked_at: new Date().toISOString(),
      }
  );
}

async function pollOnce(): Promise<void> {
  for (const name of listServiceNames()) {
    const health = await getServiceHealth(name);
    latestSnapshot.set(name, health);

    const prev = lastStatus.get(name);
    if (prev && prev !== health.status) {
      pushLog({
        service: name,
        level: health.status === "healthy" ? "info" : "error",
        message: `status changed: ${prev} -> ${health.status}`,
      });
    }
    lastStatus.set(name, health.status);
  }
}

let intervalHandle: ReturnType<typeof setInterval> | undefined;

export function startPolling(intervalMs = 5000): void {
  if (intervalHandle) return; 
  void pollOnce();
  intervalHandle = setInterval(() => void pollOnce(), intervalMs);
}