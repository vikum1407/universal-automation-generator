import { Controller, Post, Body } from '@nestjs/common';
import { APIFrameworkGenerator } from './api-framework-generator';
import { Requirement } from '../rtm/rtm.model';

@Controller('generate-api-framework')
export class APIGenerateController {
  @Post()
  async generate(@Body() body: { requirements: Requirement[] }) {
    const generator = new APIFrameworkGenerator();
    const zipPath = await generator.generateFramework(body.requirements);

    return {
      message: 'API framework generated successfully',
      zipPath
    };
  }
}
