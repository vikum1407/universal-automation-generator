import { Injectable } from '@nestjs/common';
import { APITestGenerator } from '../../api-scan/api-test-generator';
import { APITestWriter } from '../../api-scan/api-test-writer';
import { Requirement } from '../../rtm/rtm.model';

@Injectable()
export class ApiTestGenerationService {
  constructor(
    private readonly generator: APITestGenerator,
    private readonly writer: APITestWriter,
  ) {}

  async generateTests(projectPath: string) {
    const requirements: Requirement[] = await this.loadRequirements();

    const generated = requirements.map(req => this.generator.generate(req));

    const finalContent = generated.join('\n\n');

    this.writer.writeTests(projectPath, finalContent);

    return { count: requirements.length };
  }

  private async loadRequirements(): Promise<Requirement[]> {
    return [
      {
        id: 'API-1',
        description: 'Health endpoint returns 200',
        method: 'GET',
        url: 'https://example.com/health',
        requestBody: null,
        expectedStatus: 200,
      } as Requirement,
    ];
  }
}
