import { Router } from "express";
import { FleetController } from "../controllers/fleet.controller";

export function createFleetRoutes(
  controller: FleetController,
) {
  const router = Router();

  router.get(
    "/servers",
    controller.getServers,
  );

  router.get(
    "/servers/:id",
    controller.getServer,
  );

  router.delete(
    "/servers/:id",
    controller.deleteServer,
  );

  return router;
}