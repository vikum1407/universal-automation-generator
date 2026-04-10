import { Controller, Get, Param } from "@nestjs/common";
import * as fs from "fs";

@Controller("projects/:id/flow")
export class FlowController {
  @Get()
  async getFlow(@Param("id") id: string) {
    const file = `./generated-ui-project/${id}/flow-graph.json`;
    if (!fs.existsSync(file)) {
      return { nodes: [], edges: [] };
    }
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  // RTM (UI or API auto-detect)
  @Get("rtm")
  async getRTM(@Param("id") id: string) {
    const uiFile = `./generated-ui-project/${id}/rtm.json`;
    const apiFile = `./generated-api-project/${id}/rtm.json`;

    const file = fs.existsSync(uiFile) ? uiFile : apiFile;
    if (!fs.existsSync(file)) return { generatedAt: "", requirements: [] };

    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  // Coverage (element-level UI + API)
  @Get("coverage")
  async getCoverage(@Param("id") id: string) {
    const uiFlowFile = `./generated-ui-project/${id}/flow-graph.json`;
    const apiEndpointsFile = `./generated-api-project/${id}/endpoints.json`;

    const rtmFile = fs.existsSync(`./generated-ui-project/${id}/rtm.json`)
      ? `./generated-ui-project/${id}/rtm.json`
      : `./generated-api-project/${id}/rtm.json`;

    if (!fs.existsSync(rtmFile)) {
      return [];
    }

    const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));
    let items: any[] = [];

    // UI: use element-level edges
    if (fs.existsSync(uiFlowFile)) {
      const flow = JSON.parse(fs.readFileSync(uiFlowFile, "utf8"));
      const edges = flow.edges || [];

      items = items.concat(
        edges.map((e: any) => ({
          id: `${e.from}->${e.to}`,
          label: `${e.action || "interaction"} (${e.from} → ${e.to})`,
          type: "ui"
        }))
      );
    }

    // API: endpoints
    if (fs.existsSync(apiEndpointsFile)) {
      const endpoints = JSON.parse(
        fs.readFileSync(apiEndpointsFile, "utf8")
      );
      items = items.concat(
        endpoints.map((ep: any) => ({
          id: `${ep.method} ${ep.path}`,
          label: `${ep.method} ${ep.path}`,
          type: "api"
        }))
      );
    }

    const coverage = items.map(item => {
      const req = rtm.requirements.find((r: any) => {
        if (item.type === "ui") {
          return (
            item.id.includes(r.page) ||
            (r.selector && item.label.includes(r.selector)) ||
            item.label.includes(r.description)
          );
        }

        if (item.type === "api") {
          return (
            (r.method && item.id.startsWith(r.method)) ||
            (r.url && item.id.includes(r.url)) ||
            item.label.includes(r.description)
          );
        }

        return false;
      });

      return {
        id: item.id,
        label: item.label,
        type: item.type,
        covered: !!req && req.coveredBy && req.coveredBy.length > 0,
        coveredBy: req?.coveredBy || [],
        requirementId: req?.id || null
      };
    });

    return coverage;
  }

  // Analytics (kept here for convenience; ProjectService has same logic)
  @Get("analytics")
  async getAnalytics(@Param("id") id: string) {
    const isUI = fs.existsSync(`./generated-ui-project/${id}`);
    const base = isUI
      ? `./generated-ui-project/${id}`
      : `./generated-api-project/${id}`;

    const analytics: any = {
      tests: 0,
      passed: 0,
      failed: 0,
      coverage: 0,
      requirements: 0,
      aiSuggestions: 0,
      autoHealed: 0,
      lastRun: null,
      ciStatus: "not-run"
    };

    if (!fs.existsSync(base)) {
      return analytics;
    }

    const testFiles = fs
      .readdirSync(base)
      .filter(f => f.endsWith(".spec.ts"));
    analytics.tests = testFiles.length;

    const resultsFile = `${base}/test-results.json`;
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
      analytics.lastRun = results.timestamp;

      if (results.status === "passed") {
        analytics.passed = analytics.tests;
      } else {
        analytics.failed = results.failures?.length || 1;
        analytics.passed = Math.max(analytics.tests - analytics.failed, 0);
      }
    }

    const rtmFile = `${base}/rtm.json`;
    if (fs.existsSync(rtmFile)) {
      const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));
      analytics.requirements = rtm.requirements?.length || 0;

      if (analytics.requirements > 0) {
        const covered = rtm.requirements.filter(
          (r: any) => r.coveredBy && r.coveredBy.length > 0
        );
        analytics.coverage = Math.round(
          (covered.length / analytics.requirements) * 100
        );
      }
    }

    const aiFile = `${base}/ai-suggestions.json`;
    if (fs.existsSync(aiFile)) {
      const ai = JSON.parse(fs.readFileSync(aiFile, "utf8"));
      analytics.aiSuggestions = Array.isArray(ai) ? ai.length : 0;
    }

    const healFile = `${base}/autoheal-log.json`;
    if (fs.existsSync(healFile)) {
      const heal = JSON.parse(fs.readFileSync(healFile, "utf8"));
      analytics.autoHealed = Array.isArray(heal) ? heal.length : 0;
    }

    const ciFile = `${base}/qlitz-report.json`;
    if (fs.existsSync(ciFile)) {
      const ci = JSON.parse(fs.readFileSync(ciFile, "utf8"));
      const failed = ci.suites?.some((s: any) => s.status === "failed");
      analytics.ciStatus = failed ? "failed" : "passed";
    }

    return analytics;
  }
}
