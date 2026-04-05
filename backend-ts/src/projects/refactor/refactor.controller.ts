import { Controller, Post, Param } from "@nestjs/common";
import * as fs from "fs";
import { RefactorService } from "../../refactor/refactor.service";

@Controller("projects/:id/refactor")
export class RefactorController {
  constructor(private readonly refactor: RefactorService) {}

  @Post()
  async refactorTests(@Param("id") id: string) {
    const isUI = fs.existsSync(`./generated-ui-project/${id}`);
    const base = isUI
      ? `./generated-ui-project/${id}`
      : `./generated-api-project/${id}`;

    return this.refactor.refactorProject(base);
  }
}
