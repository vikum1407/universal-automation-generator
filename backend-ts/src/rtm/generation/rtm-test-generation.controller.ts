import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RtmTestGenerationService, GenerateTestsDto } from './rtm-test-generation.service';

@Controller('projects/:projectId/rtm/versions/:versionId/generate')
export class RtmTestGenerationController {
  constructor(private readonly svc: RtmTestGenerationService) {}

  @Post()
  generate(
    @Param('projectId')  projectId:    string,
    @Param('versionId')  rtmVersionId: string,
    @Body()              dto:          GenerateTestsDto,
  ) {
    return this.svc.generate(projectId, rtmVersionId, dto);
  }

  @Get('results')
  listResults(
    @Param('projectId')  projectId:    string,
    @Param('versionId')  rtmVersionId: string,
  ) {
    return this.svc.listGeneratedFiles(projectId, rtmVersionId);
  }
}
