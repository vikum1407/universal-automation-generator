import { Controller, Post, Get, Param, Body } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const OUTPUT_BASE = "./qlitz-output";

@Controller("projects/:id/tests")
export class TestsController {
  private base(id: string) { return path.join(OUTPUT_BASE, id); }

  private isAPIProject(base: string): boolean {
    return (
      fs.existsSync(path.join(base, "endpoints.json")) &&
      !fs.existsSync(path.join(base, "flow-graph.json"))
    );
  }

  private specDir(base: string): string {
    return this.isAPIProject(base) ? path.join(base, "tests") : base;
  }

  private specFiles(base: string): string[] {
    const dir = this.specDir(base);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith(".spec.ts"))
      .map(f => path.join(dir, f));
  }

  // ─── Collect all spec files from root + tests/ subdir ────────────────────

  private allSpecFiles(base: string): { name: string; fullPath: string; subdir: boolean }[] {
    const results: { name: string; fullPath: string; subdir: boolean }[] = [];

    const addDir = (dir: string, subdir: boolean) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir)
        .filter(f => f.endsWith(".spec.ts"))
        .forEach(f => results.push({ name: f, fullPath: path.join(dir, f), subdir }));
    };

    addDir(base, false);
    addDir(path.join(base, "tests"), true);
    return results;
  }

  // ─── GET /tests — enriched test list ─────────────────────────────────────

  @Get()
  async getTests(@Param("id") id: string) {
    const base = this.base(id);

    const rtm = fs.existsSync(path.join(base, "rtm.json"))
      ? JSON.parse(fs.readFileSync(path.join(base, "rtm.json"), "utf8"))
      : { requirements: [] };

    const results = fs.existsSync(path.join(base, "test-results.json"))
      ? JSON.parse(fs.readFileSync(path.join(base, "test-results.json"), "utf8"))
      : null;

    const suggestions: any[] = fs.existsSync(path.join(base, "suggestions.json"))
      ? JSON.parse(fs.readFileSync(path.join(base, "suggestions.json"), "utf8"))
      : [];

    // Requirement → file mapping from RTM coveredBy
    const reqByFile: Record<string, string[]> = {};
    for (const req of rtm.requirements || []) {
      for (const cov of req.coveredBy || []) {
        if (!reqByFile[cov]) reqByFile[cov] = [];
        reqByFile[cov].push(req.description || req.id || "Unknown");
      }
    }

    // Per-test status tracked by runSingle (most accurate)
    const perTestResults: Record<string, "passed" | "failed"> = results?.tests || {};

    // Parse failing filenames from Playwright stdout when no per-test data
    const parsedFailingFiles = new Set<string>();
    if (results?.status === "failed") {
      const failureText = (results.failures || []).map((f: any) => f.message || "").join("\n");
      const patterns = [
        /✗[^\n]*?([a-zA-Z0-9_][a-zA-Z0-9_-]*\.spec\.ts)/g,
        /×[^\n]*?([a-zA-Z0-9_][a-zA-Z0-9_-]*\.spec\.ts)/g,
        /FAILED[^\n]*?([a-zA-Z0-9_][a-zA-Z0-9_-]*\.spec\.ts)/gi,
        /([a-zA-Z0-9_][a-zA-Z0-9_-]*\.spec\.ts):\d+:\d+/g,
      ];
      for (const pattern of patterns) {
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(failureText)) !== null) {
          parsedFailingFiles.add(path.basename(m[1]));
        }
      }
    }

    // AI suggestions count per test filename or testId
    const suggPerTest: Record<string, number> = {};
    for (const s of suggestions) {
      if (s.testId) suggPerTest[s.testId] = (suggPerTest[s.testId] || 0) + 1;
    }

    const files = this.allSpecFiles(base);

    return files.map(file => {
      const content = fs.readFileSync(file.fullPath, "utf8");
      const lines = content.split("\n");

      const isAPI = file.subdir ||
        /request\.(get|post|put|patch|delete)\(/i.test(content);

      // Try multiple name patterns (test / it / describe)
      let testName: string | null = null;
      for (const pat of [
        /(?:test|it)\.(?:only|skip)\s*\(\s*['"`](.+?)['"`]/,
        /(?:test|it)\s*\(\s*['"`](.+?)['"`]/,
        /describe\s*\(\s*['"`](.+?)['"`]/,
      ]) {
        const m = content.match(pat);
        if (m?.[1]) { testName = m[1]; break; }
      }
      // Readable fallback: convert filename to Title Case with spaces
      if (!testName) {
        testName = file.name
          .replace(/\.spec\.ts$/, "")
          .replace(/[-_]+/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase())
          .trim();
      }

      const assertions = (content.match(/expect\s*\(/g) || []).length;
      const selectors = (content.match(/page\.(click|fill|locator|getBy)/g) || []).length;

      const epMatch = content.match(/\.(get|post|put|patch|delete)\s*\(`[^`]*?(\/[^\s`'"]+)/i);
      const endpoint = epMatch ? `${epMatch[1].toUpperCase()} ${epMatch[2]}` : null;

      // Status resolution — most-specific source wins
      let status: "passed" | "failed" | "not-run";
      if (!results) {
        status = "not-run";
      } else if (perTestResults[file.name] !== undefined) {
        // 1. Per-test tracking from runSingle (most accurate)
        status = perTestResults[file.name];
      } else if (parsedFailingFiles.size > 0) {
        // 2. Parsed from Playwright stdout
        status = parsedFailingFiles.has(file.name) ? "failed" : "passed";
      } else {
        // 3. Fallback: reflect overall run status (not-run stays not-run)
        status = results.status === "passed" ? "passed"
               : results.status === "failed" ? "failed"
               : "not-run";
      }

      const stabilityScore = status === "passed" ? 88 :
        status === "failed" ? 28 : 60;

      const riskScore = status === "failed" ? 92 :
        assertions < 2 ? 72 :
        status === "not-run" ? 60 : 22;

      const aiSuggestions = suggPerTest[file.name] || suggPerTest[testName] || 0;

      return {
        id: file.name.replace(/\.spec\.ts$/, ""),
        name: testName,
        fileName: file.name,
        folder: file.subdir ? "tests" : "root",
        type: isAPI ? "api" : "ui",
        status,
        lastRun: results?.timestamp || null,
        duration: null,
        requirements: reqByFile[file.name] || [],
        endpoint,
        stabilityScore,
        riskScore,
        assertionCount: assertions,
        selectorCount: selectors,
        linesOfCode: lines.length,
        aiSuggestions,
        content,
      };
    });
  }

  // ─── GET /tests/summary ───────────────────────────────────────────────────

  @Get("summary")
  async getSummary(@Param("id") id: string) {
    const tests: any[] = await this.getTests(id);
    const base = this.base(id);

    const total = tests.length;
    const passed = tests.filter(t => t.status === "passed").length;
    const failed = tests.filter(t => t.status === "failed").length;
    const notRun = tests.filter(t => t.status === "not-run").length;
    const avgStability = total
      ? Math.round(tests.reduce((s, t) => s + t.stabilityScore, 0) / total) : 0;
    const totalAISugg = tests.reduce((s, t) => s + t.aiSuggestions, 0);

    const results = fs.existsSync(path.join(base, "test-results.json"))
      ? JSON.parse(fs.readFileSync(path.join(base, "test-results.json"), "utf8"))
      : null;

    return {
      total,
      passed,
      failed,
      flaky: 0,
      notRun,
      stabilityScore: avgStability,
      aiSuggestions: totalAISugg,
      lastRunAt: results?.timestamp || null,
      coverageImpact: total ? Math.round((passed / total) * 100) : 0,
    };
  }

  // ─── POST /tests/run — run all ────────────────────────────────────────────

  @Post("run")
  async runTests(@Param("id") id: string) {
    const base = this.base(id);
    const resultsFile = path.join(base, "test-results.json");

    if (!fs.existsSync(base)) {
      return { status: "not-run", failures: [{ message: "Project output directory not found." }] };
    }

    const parsePerFileStatus = (output: string): Record<string, "passed" | "failed"> => {
      const map: Record<string, "passed" | "failed"> = {};
      const failPat = /(?:✗|×|FAILED)[^\n]*?([a-zA-Z0-9_][a-zA-Z0-9_-]*\.spec\.ts)/gi;
      const passPat = /✓[^\n]*?([a-zA-Z0-9_][a-zA-Z0-9_-]*\.spec\.ts)/g;
      let m: RegExpExecArray | null;
      while ((m = passPat.exec(output)) !== null) map[path.basename(m[1])] = "passed";
      while ((m = failPat.exec(output)) !== null) map[path.basename(m[1])] = "failed";
      return map;
    };

    try {
      const stdout = execSync("npx playwright test", { cwd: base, stdio: "pipe" }).toString();
      const tests = parsePerFileStatus(stdout);
      const results = { status: "passed", timestamp: new Date().toISOString(), failures: [], tests };
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      return results;
    } catch (err: any) {
      const output = (err.stdout?.toString() ?? "") + (err.stderr?.toString() ?? "") || err.message;
      const tests = parsePerFileStatus(output);
      const results = {
        status: "failed",
        timestamp: new Date().toISOString(),
        failures: [{ message: output.slice(0, 5000) }],
        tests,
      };
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      return results;
    }
  }

  // ─── POST /tests/:testId/run — run single test ────────────────────────────

  @Post(":testId/run")
  async runSingle(@Param("id") id: string, @Param("testId") testId: string) {
    const base = this.base(id);
    const specName = testId.endsWith(".spec.ts") ? testId : `${testId}.spec.ts`;

    // Find file in root or tests/ subdir
    const rootPath = path.join(base, specName);
    const subPath = path.join(base, "tests", specName);
    const filePath = fs.existsSync(rootPath) ? rootPath :
                     fs.existsSync(subPath) ? subPath : null;

    if (!filePath) {
      return { status: "not-run", message: `Test file "${specName}" not found.` };
    }

    const resultsFile = path.join(base, "test-results.json");
    const saveResult = (testStatus: "passed" | "failed", failures: any[] = []) => {
      const existing = fs.existsSync(resultsFile)
        ? JSON.parse(fs.readFileSync(resultsFile, "utf8"))
        : { status: "not-run", failures: [], tests: {} };
      existing.tests = existing.tests || {};
      existing.tests[specName] = testStatus;
      existing.timestamp = new Date().toISOString();
      fs.writeFileSync(resultsFile, JSON.stringify(existing, null, 2));
      return { status: testStatus, timestamp: existing.timestamp, testId, failures };
    };

    try {
      execSync(`npx playwright test "${filePath}"`, { cwd: base, stdio: "pipe" });
      return saveResult("passed");
    } catch (err: any) {
      const output = (err.stdout?.toString() ?? "") + (err.stderr?.toString() ?? "");
      return saveResult("failed", [{ message: output.slice(0, 2000) }]);
    }
  }

  // ─── POST /tests/:testId/heal ─────────────────────────────────────────────

  @Post(":testId/heal")
  async healTest(@Param("id") id: string, @Param("testId") testId: string) {
    const base = this.base(id);
    const specName = testId.endsWith(".spec.ts") ? testId : `${testId}.spec.ts`;

    const rootPath = path.join(base, specName);
    const subPath = path.join(base, "tests", specName);
    const filePath = fs.existsSync(rootPath) ? rootPath :
                     fs.existsSync(subPath) ? subPath : null;

    if (!filePath) return { ok: false, message: "Test file not found." };

    const original = fs.readFileSync(filePath, "utf8");

    // Apply healing patterns
    let healed = original;
    // Add retry annotation
    if (!healed.includes("test.use(")) {
      healed = `// AUTO-HEALED by Qlitz AI — ${new Date().toISOString()}\nimport { test, expect } from "@playwright/test";\n\ntest.use({ actionTimeout: 10000 });\n\n` +
        healed.replace(/^import\s+\{[^}]+\}\s+from\s+["']@playwright\/test["'];?\n?/m, "");
    }
    // Add waitForLoadState before gotos if missing
    healed = healed.replace(
      /await page\.goto\(([^)]+)\)(?!\s*;?\s*await page\.waitForLoadState)/g,
      `await page.goto($1);\n  await page.waitForLoadState('networkidle')`
    );

    fs.writeFileSync(filePath, healed);

    return { ok: true, testId, message: "Test healed successfully." };
  }

  // ─── POST /tests/:testId/regenerate ──────────────────────────────────────

  @Post(":testId/regenerate")
  async regenerateTest(@Param("id") id: string, @Param("testId") testId: string) {
    const base = this.base(id);
    const specName = testId.endsWith(".spec.ts") ? testId : `${testId}.spec.ts`;

    // Find linked requirement in RTM
    const rtmFile = path.join(base, "rtm.json");
    const rtm = fs.existsSync(rtmFile)
      ? JSON.parse(fs.readFileSync(rtmFile, "utf8"))
      : { requirements: [] };

    const linkedReq = (rtm.requirements || []).find(
      (r: any) => (r.coveredBy || []).includes(specName)
    );

    const rootPath = path.join(base, specName);
    const subPath = path.join(base, "tests", specName);
    const targetPath = fs.existsSync(subPath) ? subPath : rootPath;
    const isAPI = targetPath.includes(path.sep + "tests" + path.sep);

    const regeneratedCode = isAPI
      ? `// REGENERATED by Qlitz AI — ${new Date().toISOString()}
import { test, expect } from "@playwright/test";

test("${linkedReq?.description || testId}", async ({ request }) => {
  const response = await request.get(\`\${process.env.API_BASE_URL ?? ""}/api/endpoint\`);
  expect(response.status()).toBeLessThan(500);
  const json = await response.json();
  expect(json).toBeDefined();
});
`
      : `// REGENERATED by Qlitz AI — ${new Date().toISOString()}
import { test, expect } from "@playwright/test";

test("${linkedReq?.description || testId}", async ({ page }) => {
  await page.goto(process.env.BASE_URL ?? "YOUR_BASE_URL");
  await page.waitForLoadState("networkidle");
  // ${linkedReq?.description || "Regenerated test — add assertions here"}
  await expect(page).toHaveURL(/.*/);
});
`;

    fs.writeFileSync(targetPath, regeneratedCode);
    return { ok: true, testId, message: "Test regenerated from requirement." };
  }

  // ─── GET /tests/results  (existing, kept) ─────────────────────────────────

  @Get("results")
  async getTestResults(@Param("id") id: string) {
    const resultsFile = path.join(this.base(id), "test-results.json");
    if (!fs.existsSync(resultsFile)) return { status: "not-run", failures: [] };
    return JSON.parse(fs.readFileSync(resultsFile, "utf8"));
  }

  // ─── GET /tests/files  (existing, kept) ──────────────────────────────────

  @Get("files")
  async getTestFiles(@Param("id") id: string) {
    const base = this.base(id);
    const files = this.specFiles(base);
    return files.map(f => ({
      name: path.basename(f),
      path: f,
      content: fs.readFileSync(f, "utf8")
    }));
  }

  // ─── Auto-heal endpoints (existing, kept) ─────────────────────────────────

  @Post("autoheal")
  async autoHeal(@Param("id") id: string) {
    const base = this.base(id);
    const resultsFile = path.join(base, "test-results.json");
    if (!fs.existsSync(resultsFile)) return [];
    const results = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
    if (results.status !== "failed") return [];

    const log: string = results.failures?.[0]?.message ?? "";
    const isAPI = this.isAPIProject(base);
    const suggestions: any[] = [];

    if (!isAPI) {
      const m = log.match(/selector "([^"]+)"/);
      if (m) suggestions.push({ type: "ui-selector-fix", brokenSelector: m[1], newSelector: `${m[1]}-fixed`, message: `Replace broken selector` });
      if (log.match(/timeout|waiting for/i)) suggestions.push({ type: "ui-timeout-fix", message: "Add waitForLoadState before actions" });
    } else {
      const sm = log.match(/expected.*?(\d{3}).*?received.*?(\d{3})/i);
      if (sm) suggestions.push({ type: "api-status-fix", message: "Update expected status", newExpectedStatus: Number(sm[2] ?? sm[1]) });
      if (log.match(/401|403/i)) suggestions.push({ type: "api-auth-fix", message: "Authentication failed — update token" });
      if (log.match(/404/i)) suggestions.push({ type: "api-path-fix", message: "Endpoint 404 — verify path" });
      if (log.match(/timeout|ECONNREFUSED/i)) suggestions.push({ type: "api-timeout-fix", message: "Request timed out" });
    }

    return suggestions;
  }

  @Post("autoheal/apply")
  async applyAutoHeal(@Param("id") id: string, @Body() body: any) {
    const base = this.base(id);
    const { type } = body;
    const files = this.specFiles(base);

    if (type === "ui-selector-fix") {
      const { brokenSelector, newSelector } = body;
      files.forEach(f => {
        let c = fs.readFileSync(f, "utf8");
        fs.writeFileSync(f, c.replaceAll(brokenSelector, newSelector));
      });
    }

    if (type === "api-status-fix") {
      const { newExpectedStatus } = body;
      files.forEach(f => {
        let c = fs.readFileSync(f, "utf8");
        fs.writeFileSync(f, c.replace(/expect\(response\.status\(\)\)\.toBe\(\d+\)/g,
          `expect(response.status()).toBe(${newExpectedStatus})`));
      });
    }

    return { ok: true };
  }
}
