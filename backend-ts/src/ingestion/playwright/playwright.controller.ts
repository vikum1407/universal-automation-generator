import { Controller, Post, Body } from "@nestjs/common";
import { PlaywrightService } from "./playwright.service";

@Controller("api/ingest/playwright")
export class PlaywrightController {
  constructor(private readonly service: PlaywrightService) {}

  @Post()
  async ingest(@Body() payload: any) {
    return this.service.record(payload);
  }

  @Post("assertion")
  async ingestAssertion(@Body() payload: any) {
    return this.service.recordAssertion(payload);
  }
}
