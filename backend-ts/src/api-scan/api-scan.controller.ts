import { Controller, Post, Body } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import { APIParser } from './api-parser';
import { APIRequirementGenerator } from './api-requirement-generator';
import { Requirement } from '../rtm/rtm.model';

@Controller('scan-api')
export class APIScanController {
  @Post()
  async scan(@Body() body: { url: string }) {
    const projectId = uuid();
    const base = path.join('./generated-api-project', projectId);

    const parser = new APIParser();
    const schema = await parser.loadSchema(body.url);
    const endpoints = parser.extractEndpoints(schema);

    const reqGen = new APIRequirementGenerator();
    const allRequirements: Requirement[] = reqGen.generate(endpoints);

    fs.mkdirSync(base, { recursive: true });
    fs.writeFileSync(
      path.join(base, 'requirements.json'),
      JSON.stringify(allRequirements, null, 2),
      'utf8'
    );

    return {
      projectId,
      count: allRequirements.length
    };
  }
}
