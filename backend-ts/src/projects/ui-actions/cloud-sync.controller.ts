import { Controller, Post, Param } from "@nestjs/common";
import { CloudSyncService } from "./cloud-sync.service";

@Controller("projects/:id")
export class CloudSyncController {
  constructor(private readonly service: CloudSyncService) {}

  @Post("cloud-sync")
  async sync(@Param("id") id: string) {
    return this.service.sync(id);
  }
}
