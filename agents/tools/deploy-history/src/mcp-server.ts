import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getRecentDeploys } from "./deploy-data.js";

export function createDeployHistoryServer(): McpServer {
  const server = new McpServer({
    name: "deploy-history",
    version: "1.0.0",
  });

  server.registerTool(
    "get_recent_deploys",
    {
      title: "Get recent deploys",
      description:
        "Get recent deploys/commits, optionally filtered to one service. Use this to check " +
        "whether an incident correlates with something that shipped recently.",
      inputSchema: {
        serviceName: z.string().optional().describe("One of: api-gateway, orders, auth"),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ serviceName, limit }) => {
      const deploys = getRecentDeploys(serviceName, limit ?? 10);
      return { content: [{ type: "text", text: JSON.stringify(deploys, null, 2) }] };
    }
  );

  return server;
}