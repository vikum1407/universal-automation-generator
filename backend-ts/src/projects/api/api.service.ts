import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import { ApiTestGenerationService } from './api-test-generation.service';

@Injectable()
export class ApiService {
  constructor(
    private readonly testGen: ApiTestGenerationService,
  ) {}

  async createProject(projectId: string) {
    const projectPath = join(process.cwd(), 'generated-api-project', projectId);

    await fs.mkdir(projectPath, { recursive: true });

    await this.testGen.generateTests(projectPath);

    return { projectId, projectPath };
  }
}
