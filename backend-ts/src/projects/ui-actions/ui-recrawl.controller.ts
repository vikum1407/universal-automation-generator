import { Controller, Post, Param } from "@nestjs/common";
import { UiRecrawlService } from "./ui-recrawl.service";

@Controller("projects/:id")
export class UiRecrawlController {
  constructor(private readonly service: UiRecrawlService) {}

  @Post("recrawl")
  async recrawl(@Param("id") id: string) {
    return this.service.recrawl(id);
  }
}
