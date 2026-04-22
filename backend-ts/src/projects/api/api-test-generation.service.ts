import { Injectable } from '@nestjs/common';
import { APITestGenerator } from '../../api-scan/api-test-generator';
import { APITestWriter } from '../../api-scan/api-test-writer';
import { Requirement } from '../../rtm/rtm.model';
import * as fs from 'fs';

@Injectable()
export class ApiTestGenerationService {
  constructor(
    private readonly generator: APITestGenerator,
    private readonly writer: APITestWriter,
  ) {}

  async generateTests(projectPath: string) {
    const requirements: Requirement[] = await this.loadRequirements(projectPath);

    const generated = requirements.map(req => this.generator.generate(req));

    const finalContent = generated.join('\n\n');

    this.writer.writeTests(projectPath, finalContent);

    return { count: requirements.length };
  }

  private async loadRequirements(projectPath: string): Promise<Requirement[]> {
    const rtmPath = `${projectPath}/rtm.json`;

    if (!fs.existsSync(rtmPath)) {
      return [];
    }

    const rtm = JSON.parse(fs.readFileSync(rtmPath, 'utf-8'));

    return (rtm.requirements as Requirement[]).filter(r => r.type === 'api');
  }
}
