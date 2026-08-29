import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createFleetControlServer } from "./mcp-server.js";
import { startPolling } from "./poller.js";

import type { Express } from "express";
const app: Express  = express();
app.use(express.json());

startPolling();

// Stateless MCP endpoint: a fresh server + transport per request. Simple and
// reliable for a hackathon demo - no session store to keep alive. If you need
// multi-turn MCP session state later, switch sessionIdGenerator to a real
// generator and keep a Map<sessionId, transport>.
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