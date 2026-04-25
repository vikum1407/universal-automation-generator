import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_BASE = "./qlitz-output";

@Controller("projects/:id/suggestions")
export class SuggestionsController {
  private base(id: string) { return path.join(OUTPUT_BASE, id); }

  @Get()
  async getSuggestions(@Param("id") id: string) {
    const base = this.base(id);
    const rtmFile = path.join(base, "rtm.json");
    const flowGraphFile = path.join(base, "flow-graph.json");
    const endpointsFile = path.join(base, "endpoints.json");

    if (!fs.existsSync(rtmFile)) return [];

    const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));
    const covered = new Set(rtm.requirements.map((r: any) => r.description));
    let items: any[] = [];

    // UI: interactions from flow graph edges
    if (fs.existsSync(flowGraphFile)) {
      const flow = JSON.parse(fs.readFileSync(flowGraphFile, "utf8"));
      items = (flow.edges || []).map((e: any) => ({
        id: `${e.from}->${e.to}`,
        description: e.action || `Navigate from ${e.from} to ${e.to}`,
        type: "ui",
        selector: e.selector
      }));
    }

    // API: missing endpoint tests
    if (fs.existsSync(endpointsFile)) {
      const endpoints = JSON.parse(fs.readFileSync(endpointsFile, "utf8"));
      items = endpoints.map((ep: any) => ({
        id: `${ep.method} ${ep.path}`,
        description: ep.summary || `${ep.method} ${ep.path}`,
        type: "api",
        method: ep.method,
        url: ep.path,
        requestBody: ep.requestBody,
        parameters: ep.parameters
      }));
    }

    const missing = items.filter(i => !covered.has(i.description));

    return missing.map((m, index) => ({
      suggestionId: `suggest-${id}-${index}`,
      requirement: m,
      proposedTestName:
        m.type === "ui"
          ? `ui-missing-${index + 1}.spec.ts`
          : `api-missing-${index + 1}.spec.ts`,
      proposedTestCode:
        m.type === "ui"
          ? `import { test, expect } from "@playwright/test";

test("${m.description}", async ({ page }) => {
  await page.goto(process.env.BASE_URL ?? "YOUR_URL_HERE");
  await page.click("${m.selector || "YOUR_SELECTOR"}");
  // TODO: add assertions
});`
          : `import { test, expect } from "@playwright/test";

test("${m.description}", async ({ request }) => {
  const response = await request.${m.method.toLowerCase()}(\`\${process.env.API_BASE_URL ?? ""}${m.url}\`, {
    headers: { "Content-Type": "application/json" }${m.requestBody ? `,\n    data: ${JSON.stringify(m.requestBody, null, 4)}` : ""}
  });
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json).toBeDefined();
});`
    }));
  }

  @Post("apply")
  async applySuggestion(@Param("id") id: string, @Body() body: any) {
    const base = this.base(id);
    const { proposedTestName, proposedTestCode, requirement } = body;

    // API tests → tests/ subdirectory; UI tests → root
    const isAPI = requirement?.type === "api";
    const testDir = isAPI ? path.join(base, "tests") : base;
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    fs.writeFileSync(path.join(testDir, proposedTestName), proposedTestCode);

    const rtmFile = path.join(base, "rtm.json");
    if (fs.existsSync(rtmFile)) {
      const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));
      rtm.requirements.push({ ...requirement, coveredBy: [proposedTestName] });
      fs.writeFileSync(rtmFile, JSON.stringify(rtm, null, 2));
    }

    return { ok: true };
  }
}
