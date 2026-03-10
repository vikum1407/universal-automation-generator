import { Controller, Post, Body } from '@nestjs/common';
import { UIFrameworkGenerator } from './ui-framework-generator';
import { Requirement } from '../rtm/rtm.model';

@Controller('generate-ui-framework')
export class UIGenerateController {
  @Post()
  async generate(@Body() body: { requirements: Requirement[] }) {
    const grouped: Record<string, Requirement[]> = {};

    for (const req of body.requirements) {
      if (!grouped[req.page]) grouped[req.page] = [];
      grouped[req.page].push(req);
    }

    const generator = new UIFrameworkGenerator();
    const zipPath = await generator.generate(grouped);

    return {
      message: 'Framework generated successfully',
      zipPath
    };
  }
}
