import { Request, Response, NextFunction } from "express";
import { FleetService } from "../services/fleet.service";

export class FleetController {
  constructor(
    private readonly fleetService: FleetService,
  ) {}

  getServers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const servers = await this.fleetService.getServers();

      res.json({
        success: true,
        data: servers,
      });
    } catch (error) {
      next(error);
    }
  };

  getServer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const server = await this.fleetService.getServer(
        req.params.id,
      );

      res.json({
        success: true,
        data: server,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteServer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await this.fleetService.deleteServer(
        req.params.id,
      );

      res.json({
        success: true,
        message: "Server deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}