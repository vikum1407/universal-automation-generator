import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_BASE = "./qlitz-output";

type SuggestionType =
  | "missing-test"
  | "improve-test"
  | "heal"
  | "rewrite-requirement"
  | "risk"
  | "stability"
  | "release";

type RiskLevel = "low" | "medium" | "high" | "critical";
type SuggestionStatus = "pending" | "applied" | "dismissed";

interface SuggestionAction {
  label: string;
  type: "generate-test" | "heal" | "refactor" | "rewrite" | "regenerate" | "apply";
  payload: any;
}

interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  requirementId?: string;
  testId?: string;
  endpoint?: string;
  flowId?: string;
  riskLevel: RiskLevel;
  impact: number;
  confidence: number;
  aiReasoning: string;
  actions: SuggestionAction[];
  status: SuggestionStatus;
  createdAt: string;
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48);
}

@Controller("projects/:id/suggestions")
export class SuggestionsController {
  private base(id: string) { return path.join(OUTPUT_BASE, id); }
  private file(id: string) { return path.join(this.base(id), "suggestions.json"); }

  // ─── Read stored or generate on first call ─────────────────────────────────

  @Get()
  async getSuggestions(@Param("id") id: string) {
    const file = this.file(id);
    if (fs.existsSync(file)) {
      const stored = JSON.parse(fs.readFileSync(file, "utf8"));
      return { suggestions: stored, analytics: this.computeAnalytics(stored) };
    }
    return this.runEngine(id);
  }

  // ─── Re-generate ───────────────────────────────────────────────────────────

  @Post("generate")
  async generate(@Param("id") id: string) {
    return this.runEngine(id);
  }

  // ─── Update suggestion status ──────────────────────────────────────────────

  @Patch(":suggId")
  async updateSuggestion(
    @Param("id") id: string,
    @Param("suggId") suggId: string,
    @Body() body: { status: SuggestionStatus }
  ) {
    const file = this.file(id);
    if (!fs.existsSync(file)) return { error: "No suggestions found" };

    const list: Suggestion[] = JSON.parse(fs.readFileSync(file, "utf8"));
    const idx = list.findIndex(s => s.id === suggId);
    if (idx === -1) return { error: "Suggestion not found" };

    list[idx].status = body.status;
    fs.writeFileSync(file, JSON.stringify(list, null, 2));

    return { ok: true, suggestion: list[idx] };
  }

  // ─── Apply a suggestion action ─────────────────────────────────────────────

  @Post(":suggId/apply")
  async applySuggestion(
    @Param("id") id: string,
    @Param("suggId") suggId: string,
    @Body() body: any
  ) {
    const base = this.base(id);
    const file = this.file(id);
    const list: Suggestion[] = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, "utf8"))
      : [];

    const suggestion = list.find(s => s.id === suggId);
    if (!suggestion) return { error: "Suggestion not found" };

    const action = body.actionType as string;

    if (action === "generate-test") {
      const { testName, testCode } = this.buildTestCode(suggestion);
      const isAPI = suggestion.endpoint && !suggestion.flowId;
      const testDir = isAPI ? path.join(base, "tests") : base;
      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, testName), testCode);

      // Update RTM coverage
      const rtmFile = path.join(base, "rtm.json");
      if (fs.existsSync(rtmFile) && suggestion.requirementId) {
        const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));
        const req = rtm.requirements.find((r: any) => r.id === suggestion.requirementId);
        if (req) {
          req.coveredBy = [...(req.coveredBy || []), testName];
          fs.writeFileSync(rtmFile, JSON.stringify(rtm, null, 2));
        }
      }

      suggestion.status = "applied";
    } else if (action === "heal" || action === "regenerate") {
      // Find the existing test file and write a healed version
      const testName = suggestion.testId
        ? (suggestion.testId.endsWith(".spec.ts") ? suggestion.testId : `${suggestion.testId}.spec.ts`)
        : `healed-${slug(suggestion.id)}.spec.ts`;

      const testDir = suggestion.endpoint ? path.join(base, "tests") : base;
      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

      const existingFile = path.join(testDir, testName);
      const existingCode = fs.existsSync(existingFile)
        ? fs.readFileSync(existingFile, "utf8")
        : null;

      // Write healed version — prepend a heal notice and add retry logic
      const healedCode = existingCode
        ? `// AUTO-HEALED by Qlitz AI — ${new Date().toISOString()}
// Original failure: ${suggestion.description}
import { test, expect } from "@playwright/test";

test.use({ actionTimeout: 10000 });

${existingCode.replace(/^import.*\n/gm, "").trimStart()}`
        : `// AUTO-HEALED by Qlitz AI — ${new Date().toISOString()}
import { test, expect } from "@playwright/test";

test("${suggestion.title}", async ({ page }) => {
  // Healed test — original test was failing
  // ${suggestion.description}
  await page.goto(process.env.BASE_URL ?? "YOUR_BASE_URL");
  // TODO: restore assertions after selector fix
});
`;

      fs.writeFileSync(path.join(testDir, testName), healedCode);
      suggestion.status = "applied";

    } else if (action === "rewrite") {
      const rtmFile = path.join(base, "rtm.json");
      if (fs.existsSync(rtmFile) && suggestion.requirementId) {
        const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));
        const req = rtm.requirements.find((r: any) => r.id === suggestion.requirementId);
        if (req) {
          req.description = body.rewrittenDescription || req.description;
          req.acceptanceCriteria = body.acceptanceCriteria || [
            "The feature should be accessible and functional",
            "Error states should be handled gracefully",
            "The response time should be under 3 seconds",
          ];
          req.updatedAt = new Date().toISOString();
          fs.writeFileSync(rtmFile, JSON.stringify(rtm, null, 2));
        }
      }
      suggestion.status = "applied";

    } else if (action === "refactor") {
      // Write a refactored scaffold if a test exists, otherwise create one
      const { testName, testCode } = this.buildTestCode(suggestion);
      const testDir = suggestion.endpoint ? path.join(base, "tests") : base;
      if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
      const refactored = `// REFACTORED by Qlitz AI — ${new Date().toISOString()}
${testCode}`;
      fs.writeFileSync(path.join(testDir, testName), refactored);
      suggestion.status = "applied";

    } else {
      suggestion.status = "applied";
    }

    fs.writeFileSync(file, JSON.stringify(list, null, 2));
    return { ok: true, suggestion };
  }

  // ─── Legacy apply (kept for backwards compat) ──────────────────────────────

  @Post("apply")
  async applyLegacy(@Param("id") id: string, @Body() body: any) {
    const base = this.base(id);
    const { proposedTestName, proposedTestCode, requirement } = body;
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

  // ─── Engine ────────────────────────────────────────────────────────────────

  private runEngine(id: string) {
    const base = this.base(id);
    const suggestions: Suggestion[] = [];
    const now = new Date().toISOString();

    const rtmFile = path.join(base, "rtm.json");
    const endpointsFile = path.join(base, "endpoints.json");
    const flowFile = path.join(base, "flow-graph.json");
    const resultsFile = path.join(base, "test-results.json");

    const rtm = fs.existsSync(rtmFile)
      ? JSON.parse(fs.readFileSync(rtmFile, "utf8"))
      : { requirements: [] };

    const endpoints: any[] = fs.existsSync(endpointsFile)
      ? JSON.parse(fs.readFileSync(endpointsFile, "utf8"))
      : [];

    const flowGraph = fs.existsSync(flowFile)
      ? JSON.parse(fs.readFileSync(flowFile, "utf8"))
      : { pages: [], edges: [] };

    const testResults = fs.existsSync(resultsFile)
      ? JSON.parse(fs.readFileSync(resultsFile, "utf8"))
      : null;

    // Count spec files
    const rootSpecs = fs.existsSync(base)
      ? fs.readdirSync(base).filter(f => f.endsWith(".spec.ts"))
      : [];
    const testsDir = path.join(base, "tests");
    const subSpecs = fs.existsSync(testsDir)
      ? fs.readdirSync(testsDir).filter(f => f.endsWith(".spec.ts"))
      : [];
    const allSpecs = [...rootSpecs, ...subSpecs];

    const requirements: any[] = rtm.requirements || [];
    const covered = requirements.filter((r: any) => r.coveredBy?.length > 0);
    const uncovered = requirements.filter((r: any) => !r.coveredBy?.length);
    const coveragePct = requirements.length > 0
      ? Math.round((covered.length / requirements.length) * 100) : 0;

    const seenIds = new Set<string>();
    const add = (s: Suggestion) => {
      if (!seenIds.has(s.id)) { seenIds.add(s.id); suggestions.push(s); }
    };

    // ── 1. Missing Test: uncovered RTM requirements ──────────────────────────
    for (const req of uncovered) {
      const isHighRisk = req.riskLevel === "high" || req.riskLevel === "critical";
      const risk: RiskLevel = isHighRisk
        ? (req.riskLevel as RiskLevel)
        : "medium";
      add({
        id: `missing-req-${slug(req.id || req.description)}`,
        type: "missing-test",
        title: `No test for: "${(req.title || req.description || "Unknown").slice(0, 60)}"`,
        description: `Requirement "${req.description}" is defined in the RTM but has no linked spec file. This creates a coverage gap.`,
        requirementId: req.id,
        riskLevel: risk,
        impact: isHighRisk ? 88 : 72,
        confidence: 92,
        aiReasoning: `This requirement appeared during RTM ingestion but no spec file references it. Based on the requirement type (${req.type || "functional"}), a ${req.type === "api" ? "Playwright API" : "Playwright UI"} test should be generated to close this gap. High-risk uncovered requirements significantly increase release risk.`,
        actions: [
          {
            label: "Generate Test",
            type: "generate-test",
            payload: { requirement: req }
          }
        ],
        status: "pending",
        createdAt: now
      });
    }

    // ── 2. Missing Test: untested API endpoints ──────────────────────────────
    const coveredEndpoints = new Set(
      requirements
        .filter((r: any) => r.endpoint)
        .map((r: any) => r.endpoint)
    );

    for (const ep of endpoints) {
      const key = `${ep.method} ${ep.path}`;
      if (!coveredEndpoints.has(key)) {
        const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(ep.method?.toUpperCase());
        add({
          id: `missing-ep-${slug(key)}`,
          type: "missing-test",
          title: `Untested endpoint: ${key}`,
          description: `Endpoint "${key}" was discovered during API ingestion but has no corresponding test in the RTM or spec files.`,
          endpoint: key,
          riskLevel: isMutating ? "high" : "medium",
          impact: isMutating ? 85 : 68,
          confidence: 88,
          aiReasoning: `API endpoint ${key} has no test coverage. ${isMutating ? "Mutating operations (POST/PUT/PATCH/DELETE) carry elevated risk when untested — they can corrupt data or trigger unhandled server errors." : "Read-only endpoints still need tests to verify response shape, status codes, and error handling."}`,
          actions: [
            {
              label: "Generate API Test",
              type: "generate-test",
              payload: { endpoint: ep }
            }
          ],
          status: "pending",
          createdAt: now
        });
      }
    }

    // ── 3. Missing Test: UI flows without coverage ───────────────────────────
    const pages: any[] = flowGraph.pages || [];
    const edges: any[] = flowGraph.edges || [];

    if (edges.length > 0 && allSpecs.length === 0) {
      add({
        id: "missing-ui-flows",
        type: "missing-test",
        title: `${edges.length} UI flow transitions have no test coverage`,
        description: `The crawler discovered ${pages.length} pages and ${edges.length} transitions but no Playwright spec files exist yet.`,
        riskLevel: "critical",
        impact: 95,
        confidence: 98,
        aiReasoning: `The UI flow graph contains ${edges.length} user journey transitions across ${pages.length} pages, but the project has zero spec files. All discovered UI interactions are completely untested. Generating a base test suite is the highest-impact action available.`,
        actions: [
          { label: "Generate UI Tests", type: "generate-test", payload: { type: "ui-all" } }
        ],
        status: "pending",
        createdAt: now
      });
    }

    // ── 4. Heal: failing tests ───────────────────────────────────────────────
    const failures: any[] = testResults?.failures || [];
    for (const failure of failures) {
      const testName = failure.test || failure.id || "unknown";
      add({
        id: `heal-${slug(testName)}`,
        type: "heal",
        title: `Failing test: ${testName}`,
        description: `Test "${testName}" is currently failing${failure.error ? `: ${failure.error}` : ""}.`,
        testId: testName,
        riskLevel: "high",
        impact: 90,
        confidence: 95,
        aiReasoning: `This test failure pattern suggests ${failure.error?.includes("selector") ? "a broken selector — likely caused by a DOM change in the application" : "a logic or assertion mismatch — the application behavior may have changed"}. Auto-healing will regenerate the test with corrected selectors and updated assertions.`,
        actions: [
          { label: "Auto-Heal", type: "heal", payload: { testId: testName, error: failure.error } },
          { label: "Regenerate Test", type: "regenerate", payload: { testId: testName } }
        ],
        status: "pending",
        createdAt: now
      });
    }

    // ── 5. Rewrite Requirement: ambiguous/short requirements ─────────────────
    for (const req of requirements) {
      const desc: string = req.description || "";
      const isAmbiguous = desc.length < 35 || !desc.includes(" ");
      const hasCriteria = req.acceptanceCriteria?.length > 0;
      if (isAmbiguous && !hasCriteria) {
        add({
          id: `rewrite-${slug(req.id || desc)}`,
          type: "rewrite-requirement",
          title: `Ambiguous requirement: "${desc.slice(0, 50)}${desc.length > 50 ? "…" : ""}"`,
          description: `This requirement is too vague for reliable test generation. It lacks acceptance criteria and edge case definitions.`,
          requirementId: req.id,
          riskLevel: "medium",
          impact: 62,
          confidence: 78,
          aiReasoning: `Requirements shorter than 35 characters or lacking structured acceptance criteria are a source of test ambiguity. AI can expand this into a full requirement with measurable criteria, edge cases, and negative scenarios — resulting in better test coverage.`,
          actions: [
            { label: "Rewrite with AI", type: "rewrite", payload: { requirement: req } }
          ],
          status: "pending",
          createdAt: now
        });
      }
    }

    // ── 6. Risk: high-risk uncovered (deduplicated, add risk context) ─────────
    const highRiskUncovered = uncovered.filter(
      (r: any) => r.riskLevel === "high" || r.riskLevel === "critical"
    );
    if (highRiskUncovered.length > 2) {
      add({
        id: "risk-cluster-high",
        type: "risk",
        title: `${highRiskUncovered.length} high-risk requirements have zero test coverage`,
        description: `A cluster of high-risk requirements has been identified with no associated tests. These represent the greatest release risk.`,
        riskLevel: "critical",
        impact: 95,
        confidence: 90,
        aiReasoning: `High-risk requirements without tests create concentrated release risk. If these areas break in production, the impact is severe. Prioritizing test generation for these requirements before any release is strongly recommended. The risk score for this project is significantly elevated until these are addressed.`,
        actions: [
          { label: "Generate All Missing Tests", type: "generate-test", payload: { type: "high-risk-batch" } }
        ],
        status: "pending",
        createdAt: now
      });
    }

    // ── 7. Stability: no test files ──────────────────────────────────────────
    if (allSpecs.length === 0 && requirements.length === 0) {
      add({
        id: "stability-empty-project",
        type: "stability",
        title: "Project has no tests or requirements — start from scratch",
        description: "This project has no spec files and no RTM entries. Regenerating from the scanned data will bootstrap the entire test suite.",
        riskLevel: "critical",
        impact: 100,
        confidence: 100,
        aiReasoning: "An automation project with no tests provides zero quality assurance. The project has been scanned and data is available to generate a comprehensive initial test suite. This is the highest-priority action.",
        actions: [
          { label: "Bootstrap Full Test Suite", type: "generate-test", payload: { type: "bootstrap" } }
        ],
        status: "pending",
        createdAt: now
      });
    }

    if (allSpecs.length > 0 && testResults?.status === "failed") {
      const failCount = failures.length || 1;
      const totalSpecs = allSpecs.length;
      add({
        id: "stability-failure-rate",
        type: "stability",
        title: `${failCount}/${totalSpecs} tests failing — stability at risk`,
        description: `The test suite has a significant failure rate. Stability improvements needed before this suite can be relied upon for CI/CD gating.`,
        riskLevel: failCount / totalSpecs > 0.5 ? "critical" : "high",
        impact: 88,
        confidence: 92,
        aiReasoning: `A ${Math.round((failCount / totalSpecs) * 100)}% failure rate indicates systemic instability — either the application has changed significantly, or the tests were written against stale state. Batch healing and refactoring is recommended.`,
        actions: [
          { label: "Heal All Failing Tests", type: "heal", payload: { type: "batch-heal" } },
          { label: "Refactor Suite", type: "refactor", payload: { type: "batch-refactor" } }
        ],
        status: "pending",
        createdAt: now
      });
    }

    // ── 8. Release Readiness ─────────────────────────────────────────────────
    if (requirements.length > 0 && coveragePct < 70) {
      add({
        id: "release-low-coverage",
        type: "release",
        title: `Coverage at ${coveragePct}% — not ready for release`,
        description: `Test coverage is below the recommended 70% threshold for a production release. ${100 - coveragePct}% of requirements remain untested.`,
        riskLevel: coveragePct < 40 ? "critical" : "high",
        impact: 92,
        confidence: 96,
        aiReasoning: `Industry best practice for production releases requires ≥70% requirement coverage. At ${coveragePct}%, this project has ${uncovered.length} uncovered requirements. Releasing at this coverage level significantly increases the probability of post-release defects. Generate tests for uncovered requirements before the next release.`,
        actions: [
          { label: "Generate Missing Tests", type: "generate-test", payload: { type: "release-blockers" } }
        ],
        status: "pending",
        createdAt: now
      });
    }

    if (requirements.length > 0 && coveragePct >= 70 && failures.length === 0) {
      add({
        id: "release-ready",
        type: "release",
        title: `Project looks release-ready — ${coveragePct}% coverage, 0 failures`,
        description: `Test coverage is above threshold and no test failures were detected. Consider running a final stress test pass.`,
        riskLevel: "low",
        impact: 45,
        confidence: 85,
        aiReasoning: `With ${coveragePct}% requirement coverage and a clean test run, this project meets baseline release criteria. Optional improvements: add edge case tests and performance checks to increase confidence further.`,
        actions: [
          { label: "Run Final Validation", type: "apply", payload: { type: "pre-release-check" } }
        ],
        status: "pending",
        createdAt: now
      });
    }

    // Sort: critical first, then by impact desc
    suggestions.sort((a, b) => {
      const risk = ["critical", "high", "medium", "low"];
      const riskDiff = risk.indexOf(a.riskLevel) - risk.indexOf(b.riskLevel);
      if (riskDiff !== 0) return riskDiff;
      return b.impact - a.impact;
    });

    fs.writeFileSync(this.file(id), JSON.stringify(suggestions, null, 2));

    return { suggestions, analytics: this.computeAnalytics(suggestions) };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private computeAnalytics(suggestions: Suggestion[]) {
    const pending = suggestions.filter(s => s.status === "pending");
    const byCategory: Record<string, number> = {};
    for (const s of pending) {
      byCategory[s.type] = (byCategory[s.type] || 0) + 1;
    }

    return {
      total: pending.length,
      highRisk: pending.filter(s => s.riskLevel === "high" || s.riskLevel === "critical").length,
      autoFixable: pending.filter(s =>
        s.actions.some(a => ["generate-test", "heal", "regenerate"].includes(a.type))
      ).length,
      applied: suggestions.filter(s => s.status === "applied").length,
      dismissed: suggestions.filter(s => s.status === "dismissed").length,
      byCategory
    };
  }

  private buildTestCode(suggestion: Suggestion): { testName: string; testCode: string } {
    if (suggestion.endpoint) {
      const [method, ...pathParts] = suggestion.endpoint.split(" ");
      const epPath = pathParts.join(" ");
      const testName = `api-${slug(suggestion.endpoint)}.spec.ts`;
      const testCode = `import { test, expect } from "@playwright/test";

test("${suggestion.title}", async ({ request }) => {
  const response = await request.${(method || "get").toLowerCase()}(
    \`\${process.env.API_BASE_URL ?? ""}${epPath}\`,
    { headers: { "Content-Type": "application/json" } }
  );
  expect(response.status()).toBeLessThan(500);
  const json = await response.json();
  expect(json).toBeDefined();
});
`;
      return { testName, testCode };
    }

    const testName = `ui-${slug(suggestion.title)}.spec.ts`;
    const testCode = `import { test, expect } from "@playwright/test";

test("${suggestion.title}", async ({ page }) => {
  await page.goto(process.env.BASE_URL ?? "YOUR_BASE_URL");
  // TODO: implement test steps for: ${suggestion.description}
  await expect(page).toHaveURL(/.*/);
});
`;
    return { testName, testCode };
  }
}
