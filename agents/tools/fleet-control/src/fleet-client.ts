import fetch from "node-fetch";

export interface ServiceHealth {
  service: string;
  status: "healthy" | "degraded" | "down" | "unreachable";
  latency_ms?: number;
}

const SERVICES: Record<string, string> = {
  "api-gateway": process.env.API_GATEWAY_URL ?? "http://localhost:4001",
  orders: process.env.ORDERS_URL ?? "http://localhost:4002",
  auth: process.env.AUTH_URL ?? "http://localhost:4003",
};

export function listServiceNames(): string[] {
  return Object.keys(SERVICES);
}

export async function getServiceHealth(serviceName: string): Promise<ServiceHealth> {
  const base = SERVICES[serviceName];
  if (!base) {
    throw new Error(
      `Unknown service "${serviceName}". Known services: ${listServiceNames().join(", ")}`
    );
  }

  const started = Date.now();
  try {
    const res = await fetch(`${base}/health`, { method: "GET" });
    const roundTrip = Date.now() - started;

    if (res.status === 503) {
      return { service: serviceName, status: "down", latency_ms: roundTrip };
    }

    const data = (await res.json()) as { latency_ms?: number; status?: string };
    const effectiveLatency = data.latency_ms ?? roundTrip;
    const isDegraded = effectiveLatency >= 1000 || data.status === "degraded";

    return {
      service: serviceName,
      status: isDegraded ? "degraded" : "healthy",
      latency_ms: effectiveLatency,
    };
  } catch {
    return { service: serviceName, status: "unreachable" };
  }
}

export async function restartService(serviceName: string): Promise<{ ok: boolean }> {
  const base = SERVICES[serviceName];
  if (!base) {
    throw new Error(
      `Unknown service "${serviceName}". Known services: ${listServiceNames().join(", ")}`
    );
  }
  
  const res = await fetch(`${base}/chaos/reset`, { method: "POST" });
  return (await res.json()) as { ok: boolean };
}