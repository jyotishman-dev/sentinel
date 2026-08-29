import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getServiceHealth, restartService } from "./fleet-client.js";
import { getRecentLogs } from "./log-buffer.js";
import { getAllSnapshots, getLatestSnapshot } from "./poller.js";


const SERVICE_NAME = z
  .enum(["api-gateway", "orders", "auth"])
  .describe("Exact service name - one of: api-gateway, orders, auth");

export function createFleetControlServer(): McpServer {
  const server = new McpServer({
    name: "fleet-control",
    version: "1.0.0",
  });

  server.registerTool(
    "list_services",
    {
      title: "List services",
      description: "List every service in the fleet with its last known status.",
      inputSchema: {},
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(getAllSnapshots(), null, 2) }],
    })
  );

  server.registerTool(
    "get_service_health",
    {
      title: "Get service health",
      description: "Check the live health of one service by name (fresh HTTP call, not cached).",
      inputSchema: {
        serviceName: SERVICE_NAME,
      },
    },
    async ({ serviceName }) => {
      const health = await getServiceHealth(serviceName);
      return { content: [{ type: "text", text: JSON.stringify(health, null, 2) }] };
    }
  );

  server.registerTool(
    "get_service_metrics",
    {
      title: "Get service metrics",
      description: "Get latency/status metrics for one service from the last background poll.",
      inputSchema: {
        serviceName: SERVICE_NAME,
      },
    },
    async ({ serviceName }) => {
      const snapshot = getLatestSnapshot(serviceName) ?? (await getServiceHealth(serviceName));
      return { content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }] };
    }
  );

  server.registerTool(
    "get_recent_logs",
    {
      title: "Get recent logs",
      description:
        "Get recent status-change log lines, optionally filtered to one service. Use this to correlate an incident with what changed.",
      inputSchema: {
        serviceName: SERVICE_NAME.optional().describe(
          "Leave empty for logs across all services"
        ),
        limit: z.number().int().min(1).max(200).optional(),
      },
    },
    async ({ serviceName, limit }) => {
      const logs = getRecentLogs(serviceName, limit ?? 20);
      return { content: [{ type: "text", text: JSON.stringify(logs, null, 2) }] };
    }
  );

  server.registerTool(
    "restart_service",
    {
      title: "Restart service",
      description:
        "Restart a service to recover it from a bad state. This is a REAL, IRREVERSIBLE action against " +
        "the live fleet. The agent must get explicit human approval before calling this tool.",
      inputSchema: {
        serviceName: SERVICE_NAME,
      },
      annotations: {
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ serviceName }) => {
      const result = await restartService(serviceName);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  return server;
}