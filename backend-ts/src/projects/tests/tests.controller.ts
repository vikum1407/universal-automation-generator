import { Controller, Post, Get, Param, Body } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const OUTPUT_BASE = "./qlitz-output";

@Controller("projects/:id/tests")
export class TestsController {
  private base(id: string) { return path.join(OUTPUT_BASE, id); }

  /** API projects write to tests/ subdir; UI projects write spec files at root */
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

  @Post("run")
  async runTests(@Param("id") id: string) {
    const base = this.base(id);
    const resultsFile = path.join(base, "test-results.json");

    if (!fs.existsSync(base)) {
      return { status: "not-run", failures: [{ message: "Project output directory not found." }] };
    }

    try {
      execSync("npx playwright test", { cwd: base, stdio: "pipe" });
      const results = { status: "passed", timestamp: new Date().toISOString(), failures: [] };
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      return results;
    } catch (err: any) {
      const output = (err.stdout?.toString() ?? "") + (err.stderr?.toString() ?? "") || err.message;
      const results = {
        status: "failed",
        timestamp: new Date().toISOString(),
        failures: [{ message: output.slice(0, 5000) }]
      };
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      return results;
    }
  }

  @Get("results")
  async getTestResults(@Param("id") id: string) {
    const resultsFile = path.join(this.base(id), "test-results.json");
    if (!fs.existsSync(resultsFile)) return { status: "not-run", failures: [] };
    return JSON.parse(fs.readFileSync(resultsFile, "utf8"));
  }

  /** List all generated spec files with their content */
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
      // UI: broken selector
      const m = log.match(/selector "([^"]+)"/);
      if (m) {
        suggestions.push({
          type: "ui-selector-fix",
          brokenSelector: m[1],
          newSelector: `${m[1]}-fixed`,
          message: `Replace broken selector: "${m[1]}" → "${m[1]}-fixed"`
        });
      }
      // UI: timeout
      if (log.match(/timeout|waiting for/i)) {
        suggestions.push({
          type: "ui-timeout-fix",
          message: "Page action timed out — increase timeout or verify the element is present",
          hint: "Add `await page.waitForLoadState('networkidle')` before the action"
        });
      }
    } else {
      // API: wrong expected status
      const statusMatch = log.match(/expected.*?(\d{3}).*?received.*?(\d{3})/i)
        ?? log.match(/toBe\((\d+)\).*?(\d{3})/i);
      if (statusMatch) {
        suggestions.push({
          type: "api-status-fix",
          message: `Status mismatch — update expected status to ${statusMatch[2] ?? statusMatch[1]}`,
          newExpectedStatus: Number(statusMatch[2] ?? statusMatch[1])
        });
      }
      // API: auth error
      if (log.match(/401|403|unauthorized|forbidden/i)) {
        suggestions.push({
          type: "api-auth-fix",
          message: "Authentication failed (401/403) — verify Authorization header is set correctly",
          hint: "Update the Bearer token or add required auth headers to your playwright.config.ts"
        });
      }
      // API: not found
      if (log.match(/404|not found/i)) {
        suggestions.push({
          type: "api-path-fix",
          message: "Endpoint returned 404 — verify the base URL and path are correct",
          hint: "Check process.env.API_BASE_URL matches your target environment"
        });
      }
      // API: timeout / connection refused
      if (log.match(/timeout|ECONNREFUSED|ETIMEDOUT/i)) {
        suggestions.push({
          type: "api-timeout-fix",
          message: "Request timed out or connection refused — API may be unavailable",
          hint: "Verify the API server is running and accessible from the test environment"
        });
      }
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
      files.forEach(filePath => {
        let content = fs.readFileSync(filePath, "utf8");
        content = content.replaceAll(brokenSelector, newSelector);
        fs.writeFileSync(filePath, content);
      });
    }

    if (type === "api-status-fix") {
      const { newExpectedStatus } = body;
      files.forEach(filePath => {
        let content = fs.readFileSync(filePath, "utf8");
        content = content.replace(
          /expect\(response\.status\(\)\)\.toBe\(\d+\)/g,
          `expect(response.status()).toBe(${newExpectedStatus})`
        );
        fs.writeFileSync(filePath, content);
      });
    }

    return { ok: true };
  }
}
