import { Controller, Post, Body } from '@nestjs/common';
import { RTMGenerator } from '../rtm/rtm.generator';
import { Requirement } from '../rtm/rtm.model';
import { UITestGenerator } from '../ui-scan/ui-test-generator';
import { APITestGenerator } from '../api-scan/api-test-generator';

@Controller('enhance')
export class EnhanceController {
  @Post()
  enhance(@Body() body: { ui: Requirement[]; api: Requirement[] }) {
    const rtmGen = new RTMGenerator();
    const uiGen = new UITestGenerator();
    const apiGen = new APITestGenerator();

    const combined = [...body.ui, ...body.api];
    const rtm = rtmGen.generate(combined);

    const uiTests = body.ui.map(req => ({
      id: req.id,
      content: uiGen.generate(req)
    }));

    const apiTests = body.api.map(req => ({
      id: req.id,
      content: apiGen.generate(req)
    }));

    return {
      rtm,
      uiTests,
      apiTests
    };
  }
}
