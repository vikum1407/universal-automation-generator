import { Controller, Post, Body } from '@nestjs/common';
import { APIParser } from './api-parser';
import { APIRequirementGenerator } from './api-requirement-generator';
import { RTMBuilder } from '../rtm/rtm.builder';

@Controller('scan-api')
export class APIScanController {
  @Post()
  async scan(@Body() body: { url: string }) {
    const parser = new APIParser();
    const schema = await parser.loadSchema(body.url);

    const endpoints = parser.extractEndpoints(schema);

    const reqGen = new APIRequirementGenerator();
    const allRequirements = [];

    for (const ep of endpoints) {
      const req = reqGen.generate(ep);
      allRequirements.push(req);
    }

    const rtm = new RTMBuilder().build(allRequirements);

    return {
      endpoints,
      requirements: allRequirements,
      rtmJson: rtm
    };
  }
}
