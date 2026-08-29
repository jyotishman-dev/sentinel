import { FleetClient } from "../clients/fleet.client";

export class FleetService {
  constructor(
    private readonly fleetClient: FleetClient,
  ) {}

  async getServers() {
    return this.fleetClient.get("/servers");
  }

  async getServer(id: string) {
    return this.fleetClient.get(`/servers/${id}`);
  }

  async deleteServer(id: string) {
    return this.fleetClient.delete(`/servers/${id}`);
  }
}