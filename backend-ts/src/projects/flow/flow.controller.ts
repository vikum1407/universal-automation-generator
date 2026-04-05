import { Controller, Get, Param } from "@nestjs/common";
import * as fs from "fs";

@Controller("projects/:id/flow")
export class FlowController {
  // RTM (UI or API auto-detect)
  @Get("rtm")
  async getRTM(@Param("id") id: string) {
    const uiFile = `./generated-ui-project/${id}/rtm.json`;
    const apiFile = `./generated-api-project/${id}/rtm.json`;

    const file = fs.existsSync(uiFile) ? uiFile : apiFile;
    if (!fs.existsSync(file)) return { generatedAt: "", requirements: [] };

    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  // Coverage
  @Get("coverage")
  async getCoverage(@Param("id") id: string) {
    const uiFlow = `./generated-ui-project/${id}/flow-graph.json`;
    const apiEndpoints = `./generated-api-project/${id}/endpoints.json`;

    const rtmFile = fs.existsSync(`./generated-ui-project/${id}/rtm.json`)
      ? `./generated-ui-project/${id}/rtm.json`
      : `./generated-api-project/${id}/rtm.json`;

    const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));
    let items: any[] = [];

    if (fs.existsSync(uiFlow)) {
      const flow = JSON.parse(fs.readFileSync(uiFlow, "utf8"));
      items = flow.edges.map((e: any) => ({
        id: `${e.from}->${e.to}`,
        label: `${e.action || "navigate"} (${e.from} → ${e.to})`
      }));
    }

    if (fs.existsSync(apiEndpoints)) {
      const endpoints = JSON.parse(fs.readFileSync(apiEndpoints, "utf8"));
      items = endpoints.map((ep: any) => ({
        id: `${ep.method} ${ep.path}`,
        label: `${ep.method} ${ep.path}`
      }));
    }

    const coverage = items.map(item => {
      const req = rtm.requirements.find((r: any) =>
        item.label.includes(r.description) ||
        item.id.includes(r.page) ||
        item.id.includes(r.url)
      );

      return {
        id: item.id,
        label: item.label,
        covered: !!req,
        coveredBy: req?.coveredBy || []
      };
    });

    return coverage;
  }

  // Analytics
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

    // Tests
    const testFiles = fs.readdirSync(base).filter(f => f.endsWith(".spec.ts"));
    analytics.tests = testFiles.length;

    // Test results
    const resultsFile = `${base}/test-results.json`;
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
      analytics.lastRun = results.timestamp;

      if (results.status === "passed") {
        analytics.passed = analytics.tests;
      } else {
        analytics.failed = results.failures?.length || 1;
        analytics.passed = analytics.tests - analytics.failed;
      }
    }

    // RTM
    const rtmFile = `${base}/rtm.json`;
    if (fs.existsSync(rtmFile)) {
      const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));
      analytics.requirements = rtm.requirements?.length || 0;

      const covered = rtm.requirements.filter((r: any) => r.coveredBy?.length > 0);
      analytics.coverage = Math.round((covered.length / analytics.requirements) * 100);
    }

    // AI suggestions
    const aiFile = `${base}/ai-suggestions.json`;
    if (fs.existsSync(aiFile)) {
      const ai = JSON.parse(fs.readFileSync(aiFile, "utf8"));
      analytics.aiSuggestions = ai.length;
    }

    // Auto-heal
    const healFile = `${base}/autoheal-log.json`;
    if (fs.existsSync(healFile)) {
      const heal = JSON.parse(fs.readFileSync(healFile, "utf8"));
      analytics.autoHealed = heal.length;
    }

    // CI status
    const ciFile = `${base}/qlitz-report.json`;
    if (fs.existsSync(ciFile)) {
      const ci = JSON.parse(fs.readFileSync(ciFile, "utf8"));
      const failed = ci.suites?.some((s: any) => s.status === "failed");
      analytics.ciStatus = failed ? "failed" : "passed";
    }

    return analytics;
  }
}
