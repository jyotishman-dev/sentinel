import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createDeployHistoryServer } from "./mcp-server.js";

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const server = createDeployHistoryServer();
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
  res.json({ ok: true, service: "deploy-history-mcp" });
});

export default app;