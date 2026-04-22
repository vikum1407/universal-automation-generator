import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpException,
  HttpStatus
} from "@nestjs/common";

import type { UIRequirement } from "../ui-scan/ui-requirement-generator";

import { RTMBuilder } from "./rtm.builder";
import { RTMGenerationOrchestrator } from "./rtm-generation-orchestrator";

@Controller("projects/:projectId/rtm")
export class RTMController {
  constructor(
    private readonly builder: RTMBuilder,
    private readonly orchestrator: RTMGenerationOrchestrator
  ) {}

  // ---------------------------------------------------------
  // GET FULL RTM (RTM + analytics + insights)
  // ---------------------------------------------------------
  @Get()
  getRTM(@Param("projectId") projectId: string) {
    const result = this.builder.load(projectId);
    if (!result) {
      throw new HttpException("RTM not found", HttpStatus.NOT_FOUND);
    }
    return result;
  }

  // ---------------------------------------------------------
  // GENERATE RTM FROM RAW REQUIREMENTS
  // ---------------------------------------------------------
  @Post("generate")
  generate(@Param("projectId") projectId: string) {
    const rawReqs: UIRequirement[] = this.builder.loadRequirements(projectId);
    const result = this.builder.build(projectId, rawReqs);
    return result;
  }

  // ---------------------------------------------------------
  // REGENERATE SELECTED REQUIREMENTS
  // ---------------------------------------------------------
  @Post("regenerate")
  regenerateSelected(
    @Param("projectId") projectId: string,
    @Body("selectedIds") selectedIds: string[]
  ) {
    const allReqs: UIRequirement[] = this.builder.loadRequirements(projectId);

    const result = this.builder.buildFromSelection(
      projectId,
      allReqs as UIRequirement[],
      selectedIds
    );

    return result;
  }

  // ---------------------------------------------------------
  // REGENERATE ALL REQUIREMENTS (semantic)
  // ---------------------------------------------------------
  @Post("regenerate-all")
  async regenerateAll(@Param("projectId") projectId: string) {
    const result = await this.orchestrator.regenerateAll(projectId);
    return result;
  }

  // ---------------------------------------------------------
  // AI AUTO-FIX TEST FILES
  // ---------------------------------------------------------
  @Post("auto-fix")
  async autoFix(
    @Param("projectId") projectId: string,
    @Body("testFile") testFile: string
  ) {
    const result = await this.orchestrator.autoFix(projectId, testFile);
    return result;
  }

  // ---------------------------------------------------------
  // EXPORT RTM (JSON / MD / CSV / DOCX / PDF)
  // ---------------------------------------------------------
  @Post("export")
  exportRTM(
    @Param("projectId") projectId: string,
    @Body("format") format: string
  ) {
    const result = this.builder.load(projectId);
    if (!result) {
      throw new HttpException("RTM not found", HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      format
    };
  }
}
