import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

import type { RTMDocument } from "./rtm.model";
import type { UIRequirement } from "../ui-scan/ui-requirement-generator";

import { UIRequirementGenerator } from "../ui-scan/ui-requirement-generator";
import { AITestLogicService } from "../ai/ai-test-logic.service";

@Injectable()
export class RTMGenerationOrchestrator {
  private uiGen = new UIRequirementGenerator();
  private ai = new AITestLogicService();

  private resolveBase(projectId: string) {
    const uiBase = path.join("./generated-ui-project", projectId);
    const apiBase = path.join("./generated-api-project", projectId);

    if (fs.existsSync(uiBase)) return uiBase;
    if (fs.existsSync(apiBase)) return apiBase;

    return null;
  }

  private writeJSON(filePath: string, data: any) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  }

  generateRTM(projectId: string, rawUIReqs: UIRequirement[]): RTMDocument {
    const base = this.resolveBase(projectId);
    if (!base) throw new Error("Project not found");

    const semantic = this.uiGen.toSemanticRequirements(rawUIReqs);

    const rtm: RTMDocument = {
      generatedAt: new Date().toISOString(),
      project: projectId,
      version: "1.0",
      requirements: semantic
    };

    const rtmFile = path.join(base, "rtm.json");
    this.writeJSON(rtmFile, rtm);

    return rtm;
  }

  regenerateFromSelection(
    projectId: string,
    allUIReqs: UIRequirement[],
    selectedIds: string[]
  ): RTMDocument {
    const filtered = allUIReqs.filter(r => selectedIds.includes(r.id));
    return this.generateRTM(projectId, filtered);
  }

  loadRTM(projectId: string): RTMDocument | null {
    const base = this.resolveBase(projectId);
    if (!base) return null;

    const rtmFile = path.join(base, "rtm.json");
    if (!fs.existsSync(rtmFile)) return null;

    try {
      return JSON.parse(fs.readFileSync(rtmFile, "utf8"));
    } catch {
      return null;
    }
  }

  overwriteRTM(projectId: string, rtm: RTMDocument) {
    const base = this.resolveBase(projectId);
    if (!base) throw new Error("Project not found");

    const rtmFile = path.join(base, "rtm.json");
    this.writeJSON(rtmFile, rtm);
  }

  async regenerateAll(projectId: string) {
    const existing = this.loadRTM(projectId);
    if (!existing) {
      return { regeneratedCount: 0, before: "", after: "" };
    }

    const before = JSON.stringify(existing, null, 2);

    const base = this.resolveBase(projectId);
    const rawFile = path.join(base, "requirements.json");
    const rawUIReqs: UIRequirement[] = JSON.parse(
      fs.readFileSync(rawFile, "utf8")
    );

    const regenerated = this.generateRTM(projectId, rawUIReqs);

    const after = JSON.stringify(regenerated, null, 2);

    return {
      regeneratedCount: regenerated.requirements.length,
      before,
      after
    };
  }

  async autoFix(projectId: string, _testFile: string) {
    const existing = this.loadRTM(projectId);
    if (!existing) {
      return { fixed: false, before: "", after: "" };
    }

    const before = JSON.stringify(existing, null, 2);

    const updated: RTMDocument = {
      ...existing,
      requirements: existing.requirements.map(req => ({
        ...req,
        aiLogic: this.ai.generate(req.description)
      }))
    };

    this.overwriteRTM(projectId, updated);

    const after = JSON.stringify(updated, null, 2);

    return { fixed: true, before, after };
  }
}
