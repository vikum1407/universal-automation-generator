import { Injectable } from '@nestjs/common';
import { APITestGenerator } from './api-test-generator';
import { APITestWriter } from './api-test-writer';
import { Requirement } from '../../rtm/rtm.model';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ApiTestGenerationService {
  constructor(
    private readonly generator: APITestGenerator,
    private readonly writer: APITestWriter,
  ) {}

  async generateTests(projectPath: string) {
    const rtmPath = path.join(projectPath, 'rtm.json');

    if (!fs.existsSync(rtmPath)) {
      return { count: 0 };
    }

    const rtm = JSON.parse(fs.readFileSync(rtmPath, 'utf8'));
    const requirements: Requirement[] = rtm.requirements.filter(
      (r: Requirement) => r.type === 'api'
    );

    const tests = requirements.map(req => {
      const name = `${req.source.method}_${req.source.endpointPath}`
        .replace(/[{}\/]/g, '_')
        .replace(/_+/g, '_');

      return {
        name,
        content: this.generator.generate(req)
      };
    });

    this.writer.writeTests(projectPath, tests);

    return { count: tests.length };
  }
}
