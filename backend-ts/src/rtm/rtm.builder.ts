import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

import type { RTMDocument } from "./rtm.model";
import type { UIRequirement } from "../ui-scan/ui-requirement-generator";

import { RTMGenerationOrchestrator } from "./rtm-generation-orchestrator";
import { RTMAnalyticsService } from "./rtm.analytics";
import { RTMInsightsEngine } from "./rtm.insights";

export interface BuiltRTM {
  rtm: RTMDocument;
  analytics: ReturnType<RTMAnalyticsService["compute"]>;
  insights: ReturnType<RTMInsightsEngine["generateInsights"]>;
}

@Injectable()
export class RTMBuilder {
  constructor(
    private readonly orchestrator: RTMGenerationOrchestrator,
    private readonly analytics: RTMAnalyticsService,
    private readonly insights: RTMInsightsEngine
  ) {}

  private resolveBase(projectId: string) {
    const uiBase = path.join("./generated-ui-project", projectId);
    const apiBase = path.join("./generated-api-project", projectId);

    if (fs.existsSync(uiBase)) return uiBase;
    if (fs.existsSync(apiBase)) return apiBase;

    return null;
  }

  loadRequirements(projectId: string): UIRequirement[] {
    const base = this.resolveBase(projectId);
    if (!base) return [];

    const file = path.join(base, "requirements.json");
    if (!fs.existsSync(file)) return [];

    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      return Array.isArray(data) ? (data as UIRequirement[]) : [];
    } catch {
      return [];
    }
  }

  build(projectId: string, requirements: UIRequirement[]): BuiltRTM {
    const rtm = this.orchestrator.generateRTM(projectId, requirements);
    const analytics = this.analytics.compute(rtm);
    const insights = this.insights.generateInsights(rtm);

    return { rtm, analytics, insights };
  }

  buildFromSelection(
    projectId: string,
    allRequirements: UIRequirement[],
    selectedIds: string[]
  ): BuiltRTM {
    const rtm = this.orchestrator.regenerateFromSelection(
      projectId,
      allRequirements,
      selectedIds
    );

    const analytics = this.analytics.compute(rtm);
    const insights = this.insights.generateInsights(rtm);

    return { rtm, analytics, insights };
  }

  load(projectId: string): BuiltRTM | null {
    const rtm = this.orchestrator.loadRTM(projectId);
    if (!rtm) return null;

    const analytics = this.analytics.compute(rtm);
    const insights = this.insights.generateInsights(rtm);

    return { rtm, analytics, insights };
  }

  overwrite(projectId: string, rtm: RTMDocument): BuiltRTM {
    this.orchestrator.overwriteRTM(projectId, rtm);

    const analytics = this.analytics.compute(rtm);
    const insights = this.insights.generateInsights(rtm);

    return { rtm, analytics, insights };
  }
}
