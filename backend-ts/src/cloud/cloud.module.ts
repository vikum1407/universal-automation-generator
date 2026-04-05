import { Module } from "@nestjs/common";
import { CloudService } from "./cloud.service";
import { CloudHealthService } from "./cloud.health";

@Module({
  providers: [CloudService, CloudHealthService],
  exports: [CloudService, CloudHealthService]
})
export class CloudModule {}
