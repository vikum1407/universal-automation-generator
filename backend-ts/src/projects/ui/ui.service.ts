import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import { UiTestGenerationService } from './ui-test-generation.service';

@Injectable()
export class UiService {
  constructor(
    private readonly testGen: UiTestGenerationService,
  ) {}

  async createProject(projectId: string) {
    const projectPath = join(process.cwd(), 'generated-ui-project', projectId);

    await fs.mkdir(projectPath, { recursive: true });

    await this.testGen.generateTests(projectPath);

    return { projectId, projectPath };
  }
}
