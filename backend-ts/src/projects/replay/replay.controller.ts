import { Controller, Get, Post, Param, Query } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const OUTPUT_BASE = "./qlitz-output";

type RunStatus = "passed" | "failed" | "partial" | "cancelled";
type ResultStatus = "passed" | "failed" | "flaky" | "skipped";
type TriggerType = "user" | "ci" | "auto-heal" | "suggestion" | "schedule";

interface TestRunResult {
  id: string;
  runId: string;
  testId: string;
  testFileName: string;
  requirements: string[];
  status: ResultStatus;
  durationMs: number;
  retries: number;
  errorMessage: string | null;
  errorStack: string | null;
  stdout: string;
}

interface TestRun {
  id: string;
  projectId: string;
  label: string;
  testIds: string[];
  status: RunStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  environment: string;
  triggeredBy: TriggerType;
  summary: { total: number; passed: number; failed: number; flaky: number; skipped: number };
  results: TestRunResult[];
}

interface RunStore { runs: TestRun[]; }

@Controller("projects/:id/replay")
export class ReplayController {
  private base(id: string) { return path.join(OUTPUT_BASE, id); }
  private storeFile(id: string) { return path.join(this.base(id), "replay-runs.json"); }

  private load(id: string): RunStore {
    const f = this.storeFile(id);
    if (!fs.existsSync(f)) return { runs: [] };
    try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return { runs: [] }; }
  }

  private save(id: string, store: RunStore) {
    fs.writeFileSync(this.storeFile(id), JSON.stringify(store, null, 2));
  }

  // ─── Collect spec files ────────────────────────────────────────────────────

  private allSpecs(base: string): { name: string; fullPath: string }[] {
    const specs: { name: string; fullPath: string }[] = [];
    const addDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).filter(f => f.endsWith(".spec.ts"))
        .forEach(f => specs.push({ name: f, fullPath: path.join(dir, f) }));
    };
    addDir(base);
    addDir(path.join(base, "tests"));
    return specs;
  }

  private readRtm(base: string): any {
    const f = path.join(base, "rtm.json");
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : { requirements: [] };
  }

  private reqsForSpec(specName: string, rtm: any): string[] {
    return (rtm.requirements || [])
      .filter((r: any) => (r.coveredBy || []).includes(specName))
      .map((r: any) => r.description || r.id || "");
  }

  // ─── Parse Playwright output ───────────────────────────────────────────────

  private parseOutput(output: string): {
    perFile: Record<string, "passed" | "failed">;
    durationMs: number;
  } {
    const perFile: Record<string, "passed" | "failed"> = {};

    // ✓ filename.spec.ts (X.Xs)
    const passRe = /✓[^\n]*?([a-zA-Z0-9_][\w-]*\.spec\.ts)/g;
    const failRe = /(?:✗|×|✕|FAILED)[^\n]*?([a-zA-Z0-9_][\w-]*\.spec\.ts)/gi;
    let m: RegExpExecArray | null;
    while ((m = passRe.exec(output)) !== null) perFile[path.basename(m[1])] = "passed";
    while ((m = failRe.exec(output)) !== null) perFile[path.basename(m[1])] = "failed";

    // Extract total duration
    const durRe = /(\d+(?:\.\d+)?)\s*s(?:econds?)?\s*$/m;
    const durMatch = output.match(durRe);
    const durationMs = durMatch ? Math.round(parseFloat(durMatch[1]) * 1000) : 0;

    return { perFile, durationMs };
  }

  private extractError(output: string, specName: string): { msg: string | null; stack: string | null } {
    const errRe = new RegExp(`${specName.replace(".", "\\.")}[\\s\\S]{0,300}?(Error[^\\n]+)`, "i");
    const m = output.match(errRe);
    if (!m) return { msg: null, stack: null };
    const stack = output.slice(m.index ?? 0, (m.index ?? 0) + 600).split("\n").slice(0, 12).join("\n");
    return { msg: m[1].trim(), stack };
  }

  // ─── Run execution ─────────────────────────────────────────────────────────

  private executeRun(
    id: string,
    label: string,
    trigger: TriggerType,
    specFilter?: string,
  ): TestRun {
    const base = this.base(id);
    const rtm = this.readRtm(base);
    const allSpecs = this.allSpecs(base);
    const specs = specFilter ? allSpecs.filter(s => s.name === specFilter) : allSpecs;

    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const startedAt = new Date().toISOString();
    const startMs = Date.now();

    let globalOutput = "";
    let globalStatus: RunStatus = "passed";

    const results: TestRunResult[] = specs.map(spec => {
      const reqList = this.reqsForSpec(spec.name, rtm);
      let status: ResultStatus = "skipped";
      let durationMs = 0;
      let errorMessage: string | null = null;
      let errorStack: string | null = null;
      let stdout = "";

      if (fs.existsSync(spec.fullPath)) {
        const t0 = Date.now();
        try {
          stdout = execSync(`npx playwright test "${spec.fullPath}"`, {
            cwd: base, stdio: "pipe", timeout: 120000,
          }).toString();
          status = "passed";
        } catch (err: any) {
          stdout = ((err.stdout?.toString() ?? "") + (err.stderr?.toString() ?? "")).slice(0, 4000);
          status = "failed";
          globalStatus = "failed";
          const e = this.extractError(stdout, spec.name);
          errorMessage = e.msg;
          errorStack = e.stack;
        }
        durationMs = Date.now() - t0;
        globalOutput += "\n" + stdout;
      }

      return {
        id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        runId,
        testId: spec.name.replace(/\.spec\.ts$/, ""),
        testFileName: spec.name,
        requirements: reqList,
        status,
        durationMs,
        retries: 0,
        errorMessage,
        errorStack,
        stdout: stdout.slice(0, 3000),
      };
    });

    const passed = results.filter(r => r.status === "passed").length;
    const failed = results.filter(r => r.status === "failed").length;
    const skipped = results.filter(r => r.status === "skipped").length;

    if (passed > 0 && failed > 0) globalStatus = "partial";
    if (failed === 0 && skipped === results.length) globalStatus = "cancelled";

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startMs;

    return {
      id: runId,
      projectId: id,
      label,
      testIds: specs.map(s => s.name),
      status: globalStatus,
      startedAt,
      finishedAt,
      durationMs,
      environment: "local",
      triggeredBy: trigger,
      summary: { total: results.length, passed, failed, flaky: 0, skipped },
      results,
    };
  }

  // ─── GET /replay/runs ─────────────────────────────────────────────────────

  @Get("runs")
  getRuns(@Param("id") id: string) {
    const { runs } = this.load(id);
    return runs
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .map(r => ({ ...r, results: undefined })); // strip results for list view
  }

  // ─── GET /replay/runs/:runId ──────────────────────────────────────────────

  @Get("runs/:runId")
  getRun(@Param("id") id: string, @Param("runId") runId: string) {
    const { runs } = this.load(id);
    return runs.find(r => r.id === runId) ?? null;
  }

  // ─── GET /replay/summary ──────────────────────────────────────────────────

  @Get("summary")
  getSummary(@Param("id") id: string) {
    const { runs } = this.load(id);
    if (!runs.length) {
      return { totalRuns: 0, last24hRuns: 0, passRate: 0, avgDurationMs: 0, flakyTests: 0, lastRunStatus: null, lastRunAt: null };
    }

    const sorted = [...runs].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    const last = sorted[0];
    const day = Date.now() - 24 * 3600 * 1000;
    const last24 = runs.filter(r => new Date(r.startedAt).getTime() > day);
    const passRate = runs.length > 0
      ? Math.round(runs.filter(r => r.status === "passed" || r.status === "partial").length / runs.length * 100) : 0;
    const avgDurationMs = runs.length > 0
      ? Math.round(runs.reduce((s, r) => s + r.durationMs, 0) / runs.length) : 0;

    return {
      totalRuns: runs.length,
      last24hRuns: last24.length,
      passRate,
      avgDurationMs,
      flakyTests: 0,
      lastRunStatus: last.status,
      lastRunAt: last.startedAt,
    };
  }

  // ─── GET /replay/tests/:testId/history ────────────────────────────────────

  @Get("tests/:testId/history")
  getTestHistory(@Param("id") id: string, @Param("testId") testId: string) {
    const { runs } = this.load(id);
    const history: any[] = [];
    for (const run of runs) {
      const result = run.results?.find(r => r.testId === testId || r.testFileName === testId);
      if (result) {
        history.push({ ...result, startedAt: run.startedAt, environment: run.environment, runLabel: run.label });
      }
    }
    return history.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  // ─── GET /replay/compare ─────────────────────────────────────────────────

  @Get("compare")
  compareRuns(
    @Param("id") id: string,
    @Query("runA") runAId: string,
    @Query("runB") runBId: string,
  ) {
    const { runs } = this.load(id);
    const runA = runs.find(r => r.id === runAId);
    const runB = runs.find(r => r.id === runBId);
    if (!runA || !runB) return null;

    const allTestIds = new Set([
      ...runA.results.map(r => r.testFileName),
      ...runB.results.map(r => r.testFileName),
    ]);

    const diff = Array.from(allTestIds).map(fileName => {
      const a = runA.results.find(r => r.testFileName === fileName);
      const b = runB.results.find(r => r.testFileName === fileName);
      const changed = a?.status !== b?.status;
      const fixed = a?.status === "failed" && b?.status === "passed";
      const broken = a?.status === "passed" && b?.status === "failed";
      const durationDelta = (b?.durationMs ?? 0) - (a?.durationMs ?? 0);
      return {
        fileName,
        testId: (a ?? b)!.testId,
        statusA: a?.status ?? "missing",
        statusB: b?.status ?? "missing",
        changed, fixed, broken,
        durationA: a?.durationMs ?? null,
        durationB: b?.durationMs ?? null,
        durationDelta,
        errorA: a?.errorMessage ?? null,
        errorB: b?.errorMessage ?? null,
      };
    });

    return {
      runA: { id: runA.id, label: runA.label, startedAt: runA.startedAt, status: runA.status, summary: runA.summary },
      runB: { id: runB.id, label: runB.label, startedAt: runB.startedAt, status: runB.status, summary: runB.summary },
      diff,
      newFailures: diff.filter(d => d.broken).length,
      fixedTests: diff.filter(d => d.fixed).length,
      unchanged: diff.filter(d => !d.changed).length,
    };
  }

  // ─── POST /replay/run — run all tests ─────────────────────────────────────

  @Post("run")
  async runAll(@Param("id") id: string) {
    const base = this.base(id);
    if (!fs.existsSync(base)) return { error: "Project output directory not found." };

    const run = this.executeRun(id, "Full Suite", "user");
    const store = this.load(id);
    store.runs.unshift(run);
    if (store.runs.length > 50) store.runs = store.runs.slice(0, 50); // keep last 50 runs
    this.save(id, store);
    return run;
  }

  // ─── POST /replay/tests/:testId/run — run single ─────────────────────────

  @Post("tests/:testId/run")
  async runSingle(@Param("id") id: string, @Param("testId") testId: string) {
    const base = this.base(id);
    const specName = testId.endsWith(".spec.ts") ? testId : `${testId}.spec.ts`;

    const rootPath = path.join(base, specName);
    const subPath = path.join(base, "tests", specName);
    if (!fs.existsSync(rootPath) && !fs.existsSync(subPath)) {
      return { error: `Test file "${specName}" not found.` };
    }

    const run = this.executeRun(id, `Single: ${specName}`, "user", specName);
    const store = this.load(id);
    store.runs.unshift(run);
    if (store.runs.length > 50) store.runs = store.runs.slice(0, 50);
    this.save(id, store);
    return run;
  }
}
