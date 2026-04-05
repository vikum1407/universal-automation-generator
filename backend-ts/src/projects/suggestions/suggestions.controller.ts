import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import * as fs from "fs";

@Controller("projects/:id/suggestions")
export class SuggestionsController {
  // Generate missing test suggestions
  @Get()
  async getSuggestions(@Param("id") id: string) {
    const uiFlow = `./generated-ui-project/${id}/flow-graph.json`;
    const apiEndpoints = `./generated-api-project/${id}/endpoints.json`;

    const rtmFile = fs.existsSync(`./generated-ui-project/${id}/rtm.json`)
      ? `./generated-ui-project/${id}/rtm.json`
      : `./generated-api-project/${id}/rtm.json`;

    const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));
    const covered = new Set(rtm.requirements.map((r: any) => r.description));

    let items: any[] = [];

    // UI edges
    if (fs.existsSync(uiFlow)) {
      const flow = JSON.parse(fs.readFileSync(uiFlow, "utf8"));
      items = flow.edges.map((e: any) => ({
        id: `${e.from}->${e.to}`,
        description: e.action || `Navigate from ${e.from} to ${e.to}`,
        type: "ui",
        selector: e.selector
      }));
    }

    // API endpoints
    if (fs.existsSync(apiEndpoints)) {
      const endpoints = JSON.parse(fs.readFileSync(apiEndpoints, "utf8"));
      items = endpoints.map((ep: any) => ({
        id: `${ep.method} ${ep.path}`,
        description: ep.summary || `${ep.method} ${ep.path}`,
        type: "api",
        method: ep.method,
        url: ep.path,
        requestBody: ep.requestBody
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
          ? `import { test } from "@playwright/test";

test("${m.description}", async ({ page }) => {
  await page.goto("YOUR_URL_HERE");
  await page.click("${m.selector || ""}");
});`
          : `import request from "supertest";

test("${m.description}", async () => {
  const res = await request("YOUR_API_BASE")
    .${m.method.toLowerCase()}("${m.url}")
    .send(${JSON.stringify(m.requestBody || {}, null, 2)});
  expect(res.status).toBe(200);
});`
    }));
  }

  // Apply suggestion
  @Post("apply")
  async applySuggestion(@Param("id") id: string, @Body() body: any) {
    const { proposedTestName, proposedTestCode, requirement } = body;

    const isUI = fs.existsSync(`./generated-ui-project/${id}`);
    const base = isUI
      ? `./generated-ui-project/${id}`
      : `./generated-api-project/${id}`;

    // write test file
    fs.writeFileSync(`${base}/${proposedTestName}`, proposedTestCode);

    // update RTM
    const rtmFile = `${base}/rtm.json`;
    const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));

    rtm.requirements.push({
      ...requirement,
      coveredBy: [proposedTestName]
    });

    fs.writeFileSync(rtmFile, JSON.stringify(rtm, null, 2));

    return { ok: true };
  }
}
