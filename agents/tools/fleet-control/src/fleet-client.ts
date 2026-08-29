import fetch from "node-fetch";

export interface ServiceHealth {
  service: string;
  status: "healthy" | "down" | "unreachable";
  latency_ms?: number;
  checked_at: string; 
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
      return {
        service: serviceName,
        status: "down",
        latency_ms: roundTrip,
        checked_at: new Date().toISOString(),
      };
    }

    const data = (await res.json()) as { latency_ms?: number };
    return {
      service: serviceName,
      status: "healthy",
      latency_ms: data.latency_ms ?? roundTrip,
      checked_at: new Date().toISOString(),
    };
  } catch {
    return { service: serviceName, status: "unreachable", checked_at: new Date().toISOString() };
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