import { Injectable } from '@nestjs/common';
import { UITestGenerator } from '../../ui-scan/ui-test-generator';
import { UITestWriter } from '../../ui-scan/ui-test-writer';
import { Requirement, RTMDocument } from '../../rtm/rtm.model';
import * as fs from 'fs';

@Injectable()
export class UiTestGenerationService {
  constructor(
    private readonly generator: UITestGenerator,
    private readonly writer: UITestWriter,
  ) {}

  async generateTests(projectPath: string) {
    const requirements: Requirement[] = await this.loadRequirements(projectPath);

    const requirementLike = requirements.map(req => ({
      id: req.id,
      page: req.page,
      description: req.description,
      selector: req.selector,
      type: 'action',
      action: req.action ?? 'click',
      meta: {},
    }));

    this.writer.writeTests(
      requirementLike,
      projectPath
    );

    return { count: requirementLike.length };
  }

  private async loadRequirements(projectPath: string): Promise<Requirement[]> {
    const rtmPath = `${projectPath}/rtm.json`;
    if (!fs.existsSync(rtmPath)) return [];

    const raw = fs.readFileSync(rtmPath, 'utf8');
    const doc = JSON.parse(raw) as RTMDocument;

    return doc.requirements || [];
  }
}
