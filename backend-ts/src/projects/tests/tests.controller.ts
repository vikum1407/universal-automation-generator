import { Controller, Post, Get, Param, Body } from "@nestjs/common";
import * as fs from "fs";

@Controller("projects/:id/tests")
export class TestsController {
  // Run tests
  @Post("run")
  async runTests(@Param("id") id: string) {
    const isUI = fs.existsSync(`./generated-ui-project/${id}`);
    const base = isUI
      ? `./generated-ui-project/${id}`
      : `./generated-api-project/${id}`;

    const resultsFile = `${base}/test-results.json`;
    const { execSync } = require("child_process");

    try {
      execSync(`npx playwright test`, {
        cwd: base,
        stdio: "pipe"
      });

      const results = {
        status: "passed",
        timestamp: new Date().toISOString(),
        failures: []
      };

      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      return results;
    } catch (err: any) {
      const output = err.stdout?.toString() || err.message;

      const results = {
        status: "failed",
        timestamp: new Date().toISOString(),
        failures: [
          {
            message: output.slice(0, 5000)
          }
        ]
      };

      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      return results;
    }
  }

  // Get test results
  @Get("results")
  async getTestResults(@Param("id") id: string) {
    const isUI = fs.existsSync(`./generated-ui-project/${id}`);
    const base = isUI
      ? `./generated-ui-project/${id}`
      : `./generated-api-project/${id}`;

    const resultsFile = `${base}/test-results.json`;

    if (!fs.existsSync(resultsFile)) {
      return { status: "not-run", failures: [] };
    }

    return JSON.parse(fs.readFileSync(resultsFile, "utf8"));
  }

  // Auto-heal suggestions
  @Post("autoheal")
  async autoHeal(@Param("id") id: string) {
    const isUI = fs.existsSync(`./generated-ui-project/${id}`);
    const base = isUI
      ? `./generated-ui-project/${id}`
      : `./generated-api-project/${id}`;

    const resultsFile = `${base}/test-results.json`;
    if (!fs.existsSync(resultsFile)) return [];

    const results = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
    if (results.status !== "failed") return [];

    const log = results.failures[0].message || "";
    let suggestions: any[] = [];

    if (isUI) {
      const selectorMatch = log.match(/selector "([^"]+)"/);
      const brokenSelector = selectorMatch ? selectorMatch[1] : null;

      if (brokenSelector) {
        suggestions.push({
          type: "ui-selector-fix",
          brokenSelector,
          newSelector: `${brokenSelector}-fixed`,
          message: `Replace selector ${brokenSelector} with ${brokenSelector}-fixed`
        });
      }
    }

    if (!isUI) {
        const statusMatch = log.match(/expected.*200.*received.*(\d+)/i);
        const received = statusMatch ? statusMatch[1] : null;

        if (received) {
            suggestions.push({
            type: "api-status-fix",
            message: `Update expected status to ${received}`,
            newExpectedStatus: Number(received)
            });
        }
    }

    return suggestions;
  }

  // Apply auto-heal
  @Post("autoheal/apply")
  async applyAutoHeal(@Param("id") id: string, @Body() body: any) {
    const { type } = body;

    const isUI = fs.existsSync(`./generated-ui-project/${id}`);
    const base = isUI
      ? `./generated-ui-project/${id}`
      : `./generated-api-project/${id}`;

    const files = fs.readdirSync(base).filter(f => f.endsWith(".spec.ts"));

    if (type === "ui-selector-fix") {
      const { brokenSelector, newSelector } = body;

      files.forEach(file => {
        const path = `${base}/${file}`;
        let content = fs.readFileSync(path, "utf8");
        content = content.replaceAll(brokenSelector, newSelector);
        fs.writeFileSync(path, content);
      });
    }

    if (type === "api-status-fix") {
      const { newExpectedStatus } = body;

      files.forEach(file => {
        const path = `${base}/${file}`;
        let content = fs.readFileSync(path, "utf8");
        content = content.replace(
          /expect\(res\.status\)\.toBe\(\d+\)/g,
          `expect(res.status).toBe(${newExpectedStatus})`
        );
        fs.writeFileSync(path, content);
      });
    }

    return { ok: true };
  }
}
