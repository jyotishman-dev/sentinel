import express from "express";


import type {Express}  from "express"
import { FleetClient } from "./clients/fleet.client.js";
import { FleetService } from "./services/fleet.service.js";
import { FleetController } from "./controllers/fleet.controller.js";
import { createFleetRoutes } from "./routes/fleet.routes.js";

const app : Express = express();

app.use(express.json());

const fleetClient = new FleetClient(
  process.env.FLEET_API_URL ?? "http://localhost:8080",
  process.env.FLEET_API_KEY,
);

const fleetService = new FleetService(
  fleetClient,
);

const fleetController = new FleetController(
  fleetService,
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "fleet-control-mcp",
  });
});

app.use(
  "/api/fleet",
  createFleetRoutes(fleetController),
);

export default app;