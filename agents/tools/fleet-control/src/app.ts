import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createFleetControlServer } from "./mcp-server.js";
import { startPolling, getAllSnapshots, getUptimeInfo, getFleetSummary } from "./poller.js";
import { getRecentLogs, pushLog } from "./log-buffer.js";
import { restartService } from "./fleet-client.js";
import fetch from "node-fetch";

import type { Express } from "express";
const app: Express = express();
app.use(express.json());

// Enable CORS for frontend
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (_req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

startPolling();

app.get("/status", (_req, res) => {
  res.json({
    services: getAllSnapshots(),
    uptime: getUptimeInfo(),
    recentLogs: getRecentLogs(),
    summary: getFleetSummary(),
  });
});

app.post("/trigger-chaos", async (req, res) => {
  const { serviceName, mode } = req.body;
  const SERVICES: Record<string, string> = {
    "api-gateway": process.env.API_GATEWAY_URL ?? "http://localhost:4001",
    orders: process.env.ORDERS_URL ?? "http://localhost:4002",
    auth: process.env.AUTH_URL ?? "http://localhost:4003",
  };

  try {
    const base = SERVICES[serviceName];
    if (!base) {
      return res.status(400).json({ ok: false, error: `Unknown service ${serviceName}` });
    }

    if (mode === "reset") {
      await restartService(serviceName);
      pushLog({ service: serviceName, level: "info", message: "chaos: reset to healthy" });
    } else {
      await fetch(`${base}/chaos/${mode}`, { method: "POST" });
      pushLog({ service: serviceName, level: "warn", message: `chaos injected: ${mode}` });
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/remediate", async (req, res) => {
  const { serviceName } = req.body;
  try {
    await restartService(serviceName);
    pushLog({
      service: serviceName,
      level: "info",
      message: `remediation applied: service ${serviceName} restored to healthy state`,
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/mcp", async (req, res) => {
  const server = createFleetControlServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "fleet-control-mcp" });
});

export default app;