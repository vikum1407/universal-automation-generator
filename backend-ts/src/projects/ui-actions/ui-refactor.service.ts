import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class UiRefactorService {
  constructor(private readonly prisma: PrismaService) {}

  async refactor(projectId: string) {
    return {
      before: 12,
      after: 9,
      files: 3
    };
  }
}
