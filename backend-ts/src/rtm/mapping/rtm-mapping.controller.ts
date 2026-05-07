import {
  Controller, Get, Post, Delete, Param, Body,
} from '@nestjs/common';
import { RtmMappingService } from './rtm-mapping.service';
import type { LinkRequirementToUiFlowDto }   from './dto/link-requirement-to-ui-flow.dto';
import type { LinkRequirementToEndpointDto } from './dto/link-requirement-to-endpoint.dto';
import type { LinkJourneyToUiFlowDto, LinkJourneyToEndpointDto } from './dto/link-requirement-to-journey.dto';

// Routes sit under /projects/:projectId/rtm/versions/:versionId/mappings
@Controller('projects/:projectId/rtm/versions/:versionId/mappings')
export class RtmMappingController {
  constructor(private readonly mapping: RtmMappingService) {}

  // ─── Discovery catalog ────────────────────────────────────────────────────────

  @Get('flows')
  listFlows(@Param('projectId') projectId: string) {
    return this.mapping.listDiscoveredFlows(projectId);
  }

  @Get('endpoints')
  listEndpoints(@Param('projectId') projectId: string) {
    return this.mapping.listDiscoveredEndpoints(projectId);
  }

  // ─── Version summary ──────────────────────────────────────────────────────────

  @Get('summary')
  getSummary(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.mapping.getVersionMappingSummary(projectId, versionId);
  }

  // ─── Requirement mappings ─────────────────────────────────────────────────────

  @Get('requirements/:requirementId')
  getReqMappings(
    @Param('projectId')    projectId: string,
    @Param('versionId')    versionId: string,
    @Param('requirementId') requirementId: string,
  ) {
    return this.mapping.getRequirementMappingSummary(projectId, versionId, requirementId);
  }

  @Get('requirements/:requirementId/suggestions')
  getReqSuggestions(
    @Param('projectId')    projectId: string,
    @Param('requirementId') requirementId: string,
  ) {
    return this.mapping.suggestForRequirement(projectId, requirementId);
  }

  @Post('requirements/:requirementId/ui-flows')
  linkReqToFlow(
    @Param('projectId')    projectId: string,
    @Param('versionId')    versionId: string,
    @Param('requirementId') requirementId: string,
    @Body() dto: LinkRequirementToUiFlowDto,
  ) {
    return this.mapping.linkReqToFlow(
      projectId, versionId, requirementId,
      dto.flowId, dto.strength ?? 'primary',
    );
  }

  @Delete('requirements/:requirementId/ui-flows/:flowId')
  unlinkReqFromFlow(
    @Param('requirementId') requirementId: string,
    @Param('flowId') flowId: string,
  ) {
    return this.mapping.unlinkReqFromFlow(requirementId, flowId);
  }

  @Post('requirements/:requirementId/endpoints')
  linkReqToEndpoint(
    @Param('projectId')    projectId: string,
    @Param('versionId')    versionId: string,
    @Param('requirementId') requirementId: string,
    @Body() dto: LinkRequirementToEndpointDto,
  ) {
    return this.mapping.linkReqToEndpoint(
      projectId, versionId, requirementId,
      dto.discoveredEndpointId, dto.strength ?? 'primary',
    );
  }

  @Delete('requirements/:requirementId/endpoints/:endpointId')
  unlinkReqFromEndpoint(
    @Param('requirementId') requirementId: string,
    @Param('endpointId') endpointId: string,
  ) {
    return this.mapping.unlinkReqFromEndpoint(requirementId, endpointId);
  }

  // ─── Journey mappings ─────────────────────────────────────────────────────────

  @Get('journeys/:journeyId')
  getJourneyMappings(
    @Param('projectId')  projectId: string,
    @Param('versionId')  versionId: string,
    @Param('journeyId')  journeyId: string,
  ) {
    return this.mapping.getJourneyMappingSummary(projectId, versionId, journeyId);
  }

  @Get('journeys/:journeyId/suggestions')
  getJourneySuggestions(
    @Param('projectId') projectId: string,
    @Param('journeyId') journeyId: string,
  ) {
    return this.mapping.suggestForJourney(projectId, journeyId);
  }

  @Post('journeys/:journeyId/ui-flows')
  linkJourneyToFlow(
    @Param('projectId')  projectId: string,
    @Param('versionId')  versionId: string,
    @Param('journeyId')  journeyId: string,
    @Body() dto: LinkJourneyToUiFlowDto,
  ) {
    return this.mapping.linkJourneyToFlow(projectId, versionId, journeyId, dto.flowId);
  }

  @Delete('journeys/:journeyId/ui-flows/:flowId')
  unlinkJourneyFromFlow(
    @Param('journeyId') journeyId: string,
    @Param('flowId') flowId: string,
  ) {
    return this.mapping.unlinkJourneyFromFlow(journeyId, flowId);
  }

  @Post('journeys/:journeyId/endpoints')
  linkJourneyToEndpoint(
    @Param('projectId')  projectId: string,
    @Param('versionId')  versionId: string,
    @Param('journeyId')  journeyId: string,
    @Body() dto: LinkJourneyToEndpointDto,
  ) {
    return this.mapping.linkJourneyToEndpoint(projectId, versionId, journeyId, dto.discoveredEndpointId);
  }

  @Delete('journeys/:journeyId/endpoints/:endpointId')
  unlinkJourneyFromEndpoint(
    @Param('journeyId')  journeyId: string,
    @Param('endpointId') endpointId: string,
  ) {
    return this.mapping.unlinkJourneyFromEndpoint(journeyId, endpointId);
  }
}
