import express from "express";

const app = express();

const SERVICE_NAME = "api-gateway";

interface ServiceState {
  healthy: boolean;
  latency_ms: number;
}

let state: ServiceState = {
  healthy: true,
  latency_ms: 0,
};

app.get("/health", (_req, res) => {
  setTimeout(() => {
    if (!state.healthy) {
      return res.status(503).json({
        service: SERVICE_NAME,
        status: "down",
      });
    }

    return res.json({
      service: SERVICE_NAME,
      status: "healthy",
      latency_ms: state.latency_ms,
    });
  }, state.latency_ms);
});

app.post("/chaos/kill", (_req, res) => {
  state.healthy = false;

  console.log(`[${SERVICE_NAME}] chaos: killed`);

  return res.json({ ok: true });
});

app.post("/chaos/latency", (_req, res) => {
  state.latency_ms = 3000;

  console.log(`[${SERVICE_NAME}] chaos: latency spike injected`);

  return res.json({ ok: true });
});

app.post("/chaos/reset", (_req, res) => {
  state = {
    healthy: true,
    latency_ms: 0,
  };

  console.log(`[${SERVICE_NAME}] chaos: reset to healthy`);

  return res.json({ ok: true });
});

export default app;