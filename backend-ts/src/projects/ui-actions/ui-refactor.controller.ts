import { Controller, Post, Param } from "@nestjs/common";
import { UiRefactorService } from "./ui-refactor.service";

@Controller("projects/:id")
export class UiRefactorController {
  constructor(private readonly service: UiRefactorService) {}

  @Post("refactor")
  async refactor(@Param("id") id: string) {
    return this.service.refactor(id);
  }
}
