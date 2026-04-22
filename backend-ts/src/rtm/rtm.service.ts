import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

import type {
  RTMRequirementView,
  RTMResponse,
  RTMTestLink,
  TestStatus
} from "./rtm.types";

import type { RTMDocument, Requirement } from "./rtm.model";

import { UIRequirementGenerator } from "../ui-scan/ui-requirement-generator";
import { UIScanNode } from "../ui-scan/ui-selector-extractor";
import { UIFlowGraph } from "../ui-scan/ui-flow-detector";

@Injectable()
export class RTMService {
  private generator = new UIRequirementGenerator();

  private resolveBase(projectId: string) {
    const uiBase = path.join("./generated-ui-project", projectId);
    const apiBase = path.join("./generated-api-project", projectId);

    if (fs.existsSync(uiBase)) return uiBase;
    if (fs.existsSync(apiBase)) return apiBase;

    return null;
  }

  private safeReadJSON<T = any>(filePath: string): T | null {
    if (!fs.existsSync(filePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------
  // BUILD RTM FROM UI SCAN (SEMANTIC)
  // ---------------------------------------------------------
  async buildFromUIScan(projectId: string, nodes: UIScanNode[]) {
    const base = this.resolveBase(projectId);
    if (!base) return null;

    const rtmFile = path.join(base, "rtm.json");

    const semanticReqs = this.generator.generate(nodes);

    const rtm: RTMDocument = {
      generatedAt: new Date().toISOString(),
      project: projectId,
      version: "1.0",
      requirements: semanticReqs.map(r => ({
        id: r.id,
        title: r.description,
        description: r.description,
        type: "ui",
        source: {
          pageName: r.pageUrl,
          endpointPath: undefined,
          method: undefined
        },
        tags: r.tags || [],
        businessPriority: "medium",
        riskLevel: "medium",
        coveredBy: [],
        aiLogic: {
          steps: [],
          assertions: [],
          negativeTests: []
        }
      }))
    };

    fs.writeFileSync(rtmFile, JSON.stringify(rtm, null, 2), "utf8");
    return rtm;
  }

  // ---------------------------------------------------------
  // BUILD RTM FROM FLOW GRAPH (SEMANTIC)
  // ---------------------------------------------------------
  async buildFromFlowGraph(projectId: string, flow: UIFlowGraph) {
    const base = this.resolveBase(projectId);
    if (!base) return null;

    const rtmFile = path.join(base, "rtm.json");

    const semanticReqs = this.generator.generateFromFlows(flow);

    const rtm: RTMDocument = {
      generatedAt: new Date().toISOString(),
      project: projectId,
      version: "1.0",
      requirements: semanticReqs.map(r => ({
        id: r.id,
        title: r.description,
        description: r.description,
        type: "ui",
        source: {
          pageName: "",
          endpointPath: "",
          method: ""
        },
        tags: r.tags || [],
        businessPriority: "medium",
        riskLevel: "medium",
        coveredBy: [],
        aiLogic: {
          steps: [],
          assertions: [],
          negativeTests: []
        }
      }))
    };

    fs.writeFileSync(rtmFile, JSON.stringify(rtm, null, 2), "utf8");
    return rtm;
  }

  // ---------------------------------------------------------
  // GET RTM
  // ---------------------------------------------------------
  async getRTM(projectId: string): Promise<RTMResponse> {
    const base = this.resolveBase(projectId);

    if (!base) {
      return {
        requirements: [],
        summary: {
          totalRequirements: 0,
          coveredRequirements: 0,
          coveragePercent: 0
        }
      };
    }

    const rtmFile = path.join(base, "rtm.json");
    const resultsFile = path.join(base, "test-results.json");

    const rtmData = this.safeReadJSON<RTMDocument>(rtmFile);
    const resultsData = this.safeReadJSON<any>(resultsFile);

    const requirements: Requirement[] = rtmData?.requirements || [];
    const tests: RTMTestLink[] = this.buildTestsIndex(resultsData);

    const requirementViews: RTMRequirementView[] = requirements.map(req => {
      const linkedTests = this.linkTestsToRequirement(req, tests);

      return {
        id: req.id,
        title: req.title,
        description: req.description,
        type: req.type,
        source: req.source,
        tags: req.tags,
        businessPriority: req.businessPriority,
        riskLevel: req.riskLevel,
        coverageStatus: linkedTests.length > 0 ? "covered" : "not-covered",
        tests: linkedTests
      };
    });

    const totalRequirements = requirementViews.length;
    const coveredRequirements = requirementViews.filter(
      r => r.coverageStatus === "covered"
    ).length;

    const coveragePercent =
      totalRequirements === 0
        ? 0
        : Math.round((coveredRequirements / totalRequirements) * 100);

    return {
      requirements: requirementViews,
      summary: {
        totalRequirements,
        coveredRequirements,
        coveragePercent
      }
    };
  }

  // ---------------------------------------------------------
  // TEST INDEX + LINKING
  // ---------------------------------------------------------
  private buildTestsIndex(resultsData: any): RTMTestLink[] {
    if (!resultsData || !Array.isArray(resultsData.tests)) return [];

    return resultsData.tests.map((t: any) => {
      const status: TestStatus =
        t.status === "passed"
          ? "passed"
          : t.status === "failed"
          ? "failed"
          : t.status === "flaky"
          ? "flaky"
          : "not-run";

      return {
        name: t.name || "",
        file: t.file || "",
        status,
        lastRunAt: resultsData.timestamp || null
      };
    });
  }

  private linkTestsToRequirement(
    requirement: Requirement,
    tests: RTMTestLink[]
  ): RTMTestLink[] {
    const id = requirement.id.toLowerCase();
    const title = requirement.title.toLowerCase();

    const pageName = requirement.source.pageName?.toLowerCase() || "";
    const endpointPath = requirement.source.endpointPath?.toLowerCase() || "";

    return tests.filter(t => {
      const name = t.name.toLowerCase();
      const file = t.file.toLowerCase();

      if (name.includes(id) || file.includes(id)) return true;
      if (name.includes(title) || file.includes(title)) return true;
      if (pageName && (name.includes(pageName) || file.includes(pageName)))
        return true;
      if (
        endpointPath &&
        (name.includes(endpointPath) || file.includes(endpointPath))
      )
        return true;

      return false;
    });
  }
}
