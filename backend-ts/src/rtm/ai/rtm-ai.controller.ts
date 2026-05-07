import {
  Controller, Post, Body, Param, HttpCode,
} from '@nestjs/common';
import { RtmAIService } from './rtm-ai.service';
import { ExtractFromDocDto } from './dto/extract-from-doc.dto';
import { RewriteRequirementDto } from './dto/rewrite-requirement.dto';
import { ScoreRiskDto } from './dto/score-risk.dto';

// All routes: /projects/:projectId/rtm/versions/:versionId/ai/...
@Controller('projects/:projectId/rtm/versions/:versionId/ai')
export class RtmAIController {
  constructor(private readonly svc: RtmAIService) {}

  // ── Extract requirements from free-text ───────────────────────────────────

  @Post('extract')
  @HttpCode(200)
  extract(
    @Param('projectId')  projectId:  string,
    @Param('versionId')  versionId:  string,
    @Body()              dto:        ExtractFromDocDto,
  ) {
    return this.svc.extractAndImport(projectId, versionId, dto.content);
  }

  // ── Cluster requirements ──────────────────────────────────────────────────

  @Post('cluster')
  @HttpCode(200)
  cluster(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.svc.clusterRequirements(projectId, versionId);
  }

  // ── Rewrite a single requirement ──────────────────────────────────────────

  @Post('rewrite/:requirementId')
  @HttpCode(200)
  rewrite(
    @Param('projectId')     projectId:     string,
    @Param('versionId')     versionId:     string,
    @Param('requirementId') requirementId: string,
    @Body()                 dto:           RewriteRequirementDto,
  ) {
    return this.svc.rewriteRequirement(projectId, versionId, requirementId, dto.rewriteMode);
  }

  // ── Accept a rewrite (persists it) ───────────────────────────────────────

  @Post('rewrite/:requirementId/accept')
  @HttpCode(200)
  acceptRewrite(
    @Param('requirementId') requirementId: string,
    @Body() body: { improvedTitle: string; improvedDescription: string },
  ) {
    return this.svc.acceptRewrite(requirementId, body.improvedTitle, body.improvedDescription);
  }

  // ── Score risk for specific requirements ──────────────────────────────────

  @Post('score-risk')
  @HttpCode(200)
  scoreRisk(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Body()             dto:       ScoreRiskDto,
  ) {
    return this.svc.scoreRisk(projectId, versionId, dto.requirementIds);
  }

  // ── Score risk for all requirements in version ────────────────────────────

  @Post('score-risk/all')
  @HttpCode(200)
  scoreAllRisk(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.svc.scoreAllRisk(projectId, versionId);
  }
}
