import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

@Controller('api/suites')
export class SuitesController {

  // ----------------------------------------------------
  // Helper: Run a single test (calls your existing engine)
  // ----------------------------------------------------
  async runSingleTest(testId: string) {
    const testsController = require('../tests/tests.controller');
    const instance = new testsController.TestsController();
    return instance.runTest(testId);
  }

  // ----------------------------------------------------
  // Create Suite
  // ----------------------------------------------------
  @Post()
  async createSuite(@Body() body: { suiteId: string; name: string }) {
    const { suiteId, name } = body;

    const suiteDir = path.join(process.cwd(), 'qlitz-output', 'suites', suiteId);
    fs.mkdirSync(suiteDir, { recursive: true });

    const metadata = {
      suiteId,
      name,
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(path.join(suiteDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
    fs.writeFileSync(path.join(suiteDir, 'tests.json'), JSON.stringify([], null, 2));

    return { created: true, suiteId };
  }

  // ----------------------------------------------------
  // Add Test to Suite
  // ----------------------------------------------------
  @Post(':suiteId/tests/add')
  async addTestToSuite(@Param('suiteId') suiteId: string, @Body() body: { testId: string }) {
    const suiteDir = path.join(process.cwd(), 'qlitz-output', 'suites', suiteId);
    const testsPath = path.join(suiteDir, 'tests.json');

    if (!fs.existsSync(testsPath)) return { error: 'Suite not found' };

    const tests = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
    if (!tests.includes(body.testId)) tests.push(body.testId);

    fs.writeFileSync(testsPath, JSON.stringify(tests, null, 2));

    return { added: true, suiteId, testId: body.testId };
  }

  // ----------------------------------------------------
  // Remove Test from Suite
  // ----------------------------------------------------
  @Post(':suiteId/tests/remove')
  async removeTestFromSuite(@Param('suiteId') suiteId: string, @Body() body: { testId: string }) {
    const suiteDir = path.join(process.cwd(), 'qlitz-output', 'suites', suiteId);
    const testsPath = path.join(suiteDir, 'tests.json');

    if (!fs.existsSync(testsPath)) return { error: 'Suite not found' };

    let tests = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
    tests = tests.filter((t: string) => t !== body.testId);

    fs.writeFileSync(testsPath, JSON.stringify(tests, null, 2));

    return { removed: true, suiteId, testId: body.testId };
  }

  // ----------------------------------------------------
  // Run Suite
  // ----------------------------------------------------
  @Post(':suiteId/run')
  async runSuite(@Param('suiteId') suiteId: string) {
    const suiteDir = path.join(process.cwd(), 'qlitz-output', 'suites', suiteId);
    const testsPath = path.join(suiteDir, 'tests.json');

    if (!fs.existsSync(testsPath)) return { error: 'Suite not found' };

    const tests: string[] = JSON.parse(fs.readFileSync(testsPath, 'utf8'));

    const runId = new Date().toISOString().replace(/[:.]/g, '-');
    const runDir = path.join(suiteDir, 'runs', runId);
    fs.mkdirSync(runDir, { recursive: true });

    const suiteMeta = {
      suiteId,
      runId,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      status: 'running',
      tests: []
    };

    fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(suiteMeta, null, 2));

    for (const testId of tests) {
      const result = await this.runSingleTest(testId);
      suiteMeta.tests.push({ testId, result });
    }

    suiteMeta.status = 'completed';
    suiteMeta.finishedAt = new Date().toISOString();

    fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(suiteMeta, null, 2));

    return { suiteId, runId, status: 'completed' };
  }

  // ----------------------------------------------------
  // List Suite Runs
  // ----------------------------------------------------
  @Get(':suiteId/runs')
  async listSuiteRuns(@Param('suiteId') suiteId: string) {
    const runsDir = path.join(process.cwd(), 'qlitz-output', 'suites', suiteId, 'runs');

    if (!fs.existsSync(runsDir)) return { suiteId, runs: [] };

    const runIds = fs.readdirSync(runsDir).filter(id =>
      fs.statSync(path.join(runsDir, id)).isDirectory()
    );

    const runs = runIds.map(runId => {
      const metaPath = path.join(runsDir, runId, 'run.json');
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    });

    return { suiteId, runs };
  }

  // ----------------------------------------------------
  // Suite Run Results
  // ----------------------------------------------------
  @Get(':suiteId/runs/:runId/results')
  async getSuiteRunResults(@Param('suiteId') suiteId: string, @Param('runId') runId: string) {
    const runDir = path.join(process.cwd(), 'qlitz-output', 'suites', suiteId, 'runs', runId);
    const metaPath = path.join(runDir, 'run.json');

    if (!fs.existsSync(metaPath)) return { error: 'Run not found' };

    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    return { suiteId, runId, metadata };
  }

  // ----------------------------------------------------
  // Retry Suite
  // ----------------------------------------------------
  @Post(':suiteId/runs/:runId/retry')
  async retrySuite(@Param('suiteId') suiteId: string) {
    return this.runSuite(suiteId);
  }

  // ----------------------------------------------------
  // Export Suite (ZIP)
  // ----------------------------------------------------
  @Get(':suiteId/export')
  async exportSuite(@Param('suiteId') suiteId: string, @Res() res: Response) {
    const suiteDir = path.join(process.cwd(), 'qlitz-output', 'suites', suiteId);

    if (!fs.existsSync(suiteDir)) return res.status(404).json({ error: 'Suite not found' });

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${suiteId}-suite.zip"`);

    archive.pipe(res);

    const addFolder = (src: string, dest: string) => {
      const items = fs.readdirSync(src);
      for (const item of items) {
        const full = path.join(src, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) addFolder(full, path.join(dest, item));
        else archive.file(full, { name: path.join(dest, item) });
      }
    };

    addFolder(suiteDir, suiteId);
    archive.finalize();
  }

  // ----------------------------------------------------
  // Suite Dashboard
  // ----------------------------------------------------
  @Get('/dashboard/:suiteId')
  async getSuiteDashboard(@Param('suiteId') suiteId: string) {
    const suiteDir = path.join(process.cwd(), 'qlitz-output', 'suites', suiteId);
    const runsDir = path.join(suiteDir, 'runs');

    if (!fs.existsSync(runsDir)) return { suiteId, runs: [] };

    const runIds = fs.readdirSync(runsDir).filter(id =>
      fs.statSync(path.join(runsDir, id)).isDirectory()
    );

    const runs = runIds.map(runId => {
      const metaPath = path.join(runsDir, runId, 'run.json');
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    });

    return {
      suiteId,
      totalRuns: runs.length,
      lastRuns: runs.slice(-10),
      successRate:
        runs.filter(r => r.status === 'completed').length / Math.max(1, runs.length),
      failureRate:
        runs.filter(r => r.status === 'failed').length / Math.max(1, runs.length)
    };
  }

  @Get(':suiteId/analytics')
    async getSuiteAnalytics(@Param('suiteId') suiteId: string) {
    const suiteDir = path.join(process.cwd(), 'qlitz-output', 'suites', suiteId);
    const runsDir = path.join(suiteDir, 'runs');

    if (!fs.existsSync(runsDir)) {
        return {
        suiteId,
        totalRuns: 0,
        successRate: 0,
        failureRate: 0,
        averageDurationMs: 0,
        flaky: false,
        flakinessScore: 0,
        slowestRuns: [],
        fastestRuns: [],
        mostFailedTests: [],
        mostPassedTests: [],
        trends: {
            daily: []
        }
        };
    }

    const runIds = fs.readdirSync(runsDir).filter(id =>
        fs.statSync(path.join(runsDir, id)).isDirectory()
    );

    let runs: any[] = [];

    for (const runId of runIds) {
        const metaPath = path.join(runsDir, runId, 'run.json');
        if (!fs.existsSync(metaPath)) continue;

        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

        const started = meta.startedAt ? new Date(meta.startedAt).getTime() : null;
        const finished = meta.finishedAt ? new Date(meta.finishedAt).getTime() : null;
        const duration = started && finished ? finished - started : null;

        runs.push({
        runId,
        status: meta.status,
        startedAt: meta.startedAt,
        finishedAt: meta.finishedAt,
        duration,
        tests: meta.tests || []
        });
    }

    if (runs.length === 0) {
        return {
        suiteId,
        totalRuns: 0,
        successRate: 0,
        failureRate: 0,
        averageDurationMs: 0,
        flaky: false,
        flakinessScore: 0,
        slowestRuns: [],
        fastestRuns: [],
        mostFailedTests: [],
        mostPassedTests: [],
        trends: {
            daily: []
        }
        };
    }

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    const totalRuns = runs.length;
    const successes = runs.filter(r => r.status === 'completed').length;
    const failures = runs.filter(r => r.status === 'failed').length;

    const durations = runs.map(r => r.duration).filter(d => d !== null) as number[];
    const averageDurationMs =
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // ----------------------------------------------------
    // FLAKINESS
    // ----------------------------------------------------
    const statuses = runs
        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
        .map(r => r.status);

    let flips = 0;
    for (let i = 1; i < statuses.length; i++) {
        if (statuses[i] !== statuses[i - 1]) flips++;
    }

    const flakinessScore = statuses.length > 1 ? flips / (statuses.length - 1) : 0;
    const flaky = successes > 0 && failures > 0;

    // ----------------------------------------------------
    // FASTEST / SLOWEST RUNS
    // ----------------------------------------------------
    const fastestRuns = runs
        .filter(r => r.duration !== null)
        .sort((a, b) => a.duration! - b.duration!)
        .slice(0, 10);

    const slowestRuns = runs
        .filter(r => r.duration !== null)
        .sort((a, b) => b.duration! - a.duration!)
        .slice(0, 10);

    // ----------------------------------------------------
    // PER-TEST ANALYTICS INSIDE SUITE
    // ----------------------------------------------------
    const testStats: Record<string, { passes: number; fails: number }> = {};

    for (const run of runs) {
        for (const t of run.tests) {
        if (!testStats[t.testId]) testStats[t.testId] = { passes: 0, fails: 0 };
        if (t.result?.status === 'completed') testStats[t.testId].passes++;
        if (t.result?.status === 'failed') testStats[t.testId].fails++;
        }
    }

    const mostFailedTests = Object.entries(testStats)
        .sort((a, b) => b[1].fails - a[1].fails)
        .slice(0, 10)
        .map(([testId, stats]) => ({ testId, ...stats }));

    const mostPassedTests = Object.entries(testStats)
        .sort((a, b) => b[1].passes - a[1].passes)
        .slice(0, 10)
        .map(([testId, stats]) => ({ testId, ...stats }));

    // ----------------------------------------------------
    // DAILY TRENDS
    // ----------------------------------------------------
    const groupBy = (items: any[], keyFn: (item: any) => string) => {
        const map: Record<string, any[]> = {};
        for (const item of items) {
        const key = keyFn(item);
        if (!map[key]) map[key] = [];
        map[key].push(item);
        }
        return map;
    };

    const formatDate = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
        ).padStart(2, '0')}`;

    const dailyGroups = groupBy(runs, r => formatDate(new Date(r.startedAt)));

    const daily = Object.entries(dailyGroups).map(([day, dayRuns]) => {
        const total = dayRuns.length;
        const successes = dayRuns.filter(r => r.status === 'completed').length;
        const failures = dayRuns.filter(r => r.status === 'failed').length;

        const durations = dayRuns.map(r => r.duration).filter(d => d !== null) as number[];
        const avgDuration =
        durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        let flips = 0;
        for (let i = 1; i < dayRuns.length; i++) {
        if (dayRuns[i].status !== dayRuns[i - 1].status) flips++;
        }

        return {
        day,
        totalRuns: total,
        successRate: successes / total,
        failureRate: failures / total,
        averageDurationMs: avgDuration,
        flakiness: flips / Math.max(1, total - 1)
        };
    });

    return {
        suiteId,
        totalRuns,
        successRate: successes / totalRuns,
        failureRate: failures / totalRuns,
        averageDurationMs,
        flaky,
        flakinessScore,
        fastestRuns,
        slowestRuns,
        mostFailedTests,
        mostPassedTests,
        trends: {
        daily
        }
    };
  }

  @Get('/leaderboard')
    async getSuiteLeaderboard() {
    const suitesDir = path.join(process.cwd(), 'qlitz-output', 'suites');

    if (!fs.existsSync(suitesDir)) {
        return {
        fastestSuites: [],
        slowestSuites: [],
        mostExecutedSuites: [],
        mostFlakySuites: [],
        mostStableSuites: [],
        highestSuccessRate: [],
        lowestSuccessRate: []
        };
    }

    const suiteIds = fs.readdirSync(suitesDir).filter(id =>
        fs.statSync(path.join(suitesDir, id)).isDirectory()
    );

    let suiteStats: Record<
        string,
        {
        runs: number;
        successes: number;
        failures: number;
        durations: number[];
        flips: number;
        }
    > = {};

    for (const suiteId of suiteIds) {
        const runsDir = path.join(suitesDir, suiteId, 'runs');
        if (!fs.existsSync(runsDir)) continue;

        const runIds = fs.readdirSync(runsDir).filter(id =>
        fs.statSync(path.join(runsDir, id)).isDirectory()
        );

        suiteStats[suiteId] = {
        runs: 0,
        successes: 0,
        failures: 0,
        durations: [],
        flips: 0
        };

        let lastStatus: string | null = null;

        for (const runId of runIds) {
        const metaPath = path.join(runsDir, runId, 'run.json');
        if (!fs.existsSync(metaPath)) continue;

        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

        const started = meta.startedAt ? new Date(meta.startedAt).getTime() : null;
        const finished = meta.finishedAt ? new Date(meta.finishedAt).getTime() : null;
        const duration = started && finished ? finished - started : null;

        suiteStats[suiteId].runs++;

        if (meta.status === 'completed') suiteStats[suiteId].successes++;
        if (meta.status === 'failed') suiteStats[suiteId].failures++;
        if (duration !== null) suiteStats[suiteId].durations.push(duration);

        if (lastStatus && lastStatus !== meta.status) {
            suiteStats[suiteId].flips++;
        }

        lastStatus = meta.status;
        }
    }

    const toArray = Object.entries(suiteStats).map(([suiteId, s]) => ({
        suiteId,
        runs: s.runs,
        successes: s.successes,
        failures: s.failures,
        durations: s.durations,
        flips: s.flips,
        avgDuration:
        s.durations.length > 0
            ? s.durations.reduce((a, b) => a + b, 0) / s.durations.length
            : null,
        successRate: s.runs > 0 ? s.successes / s.runs : 0,
        flakinessScore: s.runs > 1 ? s.flips / (s.runs - 1) : 0
    }));

    const fastestSuites = toArray
        .filter(s => s.avgDuration !== null)
        .sort((a, b) => a.avgDuration! - b.avgDuration!)
        .slice(0, 10);

    const slowestSuites = toArray
        .filter(s => s.avgDuration !== null)
        .sort((a, b) => b.avgDuration! - a.avgDuration!)
        .slice(0, 10);

    const mostExecutedSuites = toArray
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 10);

    const mostFlakySuites = toArray
        .filter(s => s.runs > 1)
        .sort((a, b) => b.flakinessScore - a.flakinessScore)
        .slice(0, 10);

    const mostStableSuites = toArray
        .filter(s => s.runs > 1)
        .sort((a, b) => a.flakinessScore - b.flakinessScore)
        .slice(0, 10);

    const highestSuccessRate = toArray
        .filter(s => s.runs > 0)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 10);

    const lowestSuccessRate = toArray
        .filter(s => s.runs > 0)
        .sort((a, b) => a.successRate - b.successRate)
        .slice(0, 10);

    return {
        fastestSuites,
        slowestSuites,
        mostExecutedSuites,
        mostFlakySuites,
        mostStableSuites,
        highestSuccessRate,
        lowestSuccessRate
    };
  }

  @Get('/dashboard/:suiteId')
    async getUnifiedSuiteDashboard(@Param('suiteId') suiteId: string) {
    const suiteDir = path.join(process.cwd(), 'qlitz-output', 'suites', suiteId);
    const runsDir = path.join(suiteDir, 'runs');

    if (!fs.existsSync(runsDir)) {
        return {
        suiteId,
        summary: {
            totalRuns: 0,
            successRate: 0,
            failureRate: 0,
            averageDurationMs: 0
        },
        leaderboards: {
            fastestRuns: [],
            slowestRuns: [],
            mostFailedTests: [],
            mostPassedTests: []
        },
        flaky: {
            isFlaky: false,
            flakinessScore: 0,
            flips: 0,
            failureClusters: 0,
            longestPassStreak: 0
        },
        trends: {
            daily: []
        },
        latestRuns: []
        };
    }

    const runIds = fs.readdirSync(runsDir).filter(id =>
        fs.statSync(path.join(runsDir, id)).isDirectory()
    );

    let runs: any[] = [];

    for (const runId of runIds) {
        const metaPath = path.join(runsDir, runId, 'run.json');
        if (!fs.existsSync(metaPath)) continue;

        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

        const started = meta.startedAt ? new Date(meta.startedAt).getTime() : null;
        const finished = meta.finishedAt ? new Date(meta.finishedAt).getTime() : null;
        const duration = started && finished ? finished - started : null;

        runs.push({
        runId,
        status: meta.status,
        startedAt: meta.startedAt,
        finishedAt: meta.finishedAt,
        duration,
        tests: meta.tests || []
        });
    }

    if (runs.length === 0) {
        return {
        suiteId,
        summary: {
            totalRuns: 0,
            successRate: 0,
            failureRate: 0,
            averageDurationMs: 0
        },
        leaderboards: {
            fastestRuns: [],
            slowestRuns: [],
            mostFailedTests: [],
            mostPassedTests: []
        },
        flaky: {
            isFlaky: false,
            flakinessScore: 0,
            flips: 0,
            failureClusters: 0,
            longestPassStreak: 0
        },
        trends: {
            daily: []
        },
        latestRuns: []
        };
    }

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    const totalRuns = runs.length;
    const successes = runs.filter(r => r.status === 'completed').length;
    const failures = runs.filter(r => r.status === 'failed').length;

    const durations = runs.map(r => r.duration).filter(d => d !== null) as number[];
    const averageDurationMs =
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    const summary = {
        totalRuns,
        successRate: successes / totalRuns,
        failureRate: failures / totalRuns,
        averageDurationMs
    };

    // ----------------------------------------------------
    // LEADERBOARDS
    // ----------------------------------------------------
    const fastestRuns = runs
        .filter(r => r.duration !== null)
        .sort((a, b) => a.duration! - b.duration!)
        .slice(0, 10);

    const slowestRuns = runs
        .filter(r => r.duration !== null)
        .sort((a, b) => b.duration! - a.duration!)
        .slice(0, 10);

    const testStats: Record<string, { passes: number; fails: number }> = {};

    for (const run of runs) {
        for (const t of run.tests) {
        if (!testStats[t.testId]) testStats[t.testId] = { passes: 0, fails: 0 };
        if (t.result?.status === 'completed') testStats[t.testId].passes++;
        if (t.result?.status === 'failed') testStats[t.testId].fails++;
        }
    }

    const mostFailedTests = Object.entries(testStats)
        .sort((a, b) => b[1].fails - a[1].fails)
        .slice(0, 10)
        .map(([testId, stats]) => ({ testId, ...stats }));

    const mostPassedTests = Object.entries(testStats)
        .sort((a, b) => b[1].passes - a[1].passes)
        .slice(0, 10)
        .map(([testId, stats]) => ({ testId, ...stats }));

    const leaderboards = {
        fastestRuns,
        slowestRuns,
        mostFailedTests,
        mostPassedTests
    };

    // ----------------------------------------------------
    // FLAKY ANALYSIS
    // ----------------------------------------------------
    const statuses = runs
        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
        .map(r => r.status);

    let flips = 0;
    for (let i = 1; i < statuses.length; i++) {
        if (statuses[i] !== statuses[i - 1]) flips++;
    }

    const flakinessScore = statuses.length > 1 ? flips / (statuses.length - 1) : 0;

    let longestPassStreak = 0;
    let currentPassStreak = 0;

    for (const s of statuses) {
        if (s === 'completed') {
        currentPassStreak++;
        longestPassStreak = Math.max(longestPassStreak, currentPassStreak);
        } else {
        currentPassStreak = 0;
        }
    }

    let failureClusters = 0;
    for (let i = 1; i < statuses.length; i++) {
        if (statuses[i] === 'failed' && statuses[i - 1] === 'failed') {
        failureClusters++;
        }
    }

    const flaky = {
        isFlaky: successes > 0 && failures > 0,
        flakinessScore,
        flips,
        failureClusters,
        longestPassStreak
    };

    // ----------------------------------------------------
    // DAILY TRENDS
    // ----------------------------------------------------
    const groupBy = (items: any[], keyFn: (item: any) => string) => {
        const map: Record<string, any[]> = {};
        for (const item of items) {
        const key = keyFn(item);
        if (!map[key]) map[key] = [];
        map[key].push(item);
        }
        return map;
    };

    const formatDate = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
        ).padStart(2, '0')}`;

    const dailyGroups = groupBy(runs, r => formatDate(new Date(r.startedAt)));

    const daily = Object.entries(dailyGroups).map(([day, dayRuns]) => {
        const total = dayRuns.length;
        const successes = dayRuns.filter(r => r.status === 'completed').length;
        const failures = dayRuns.filter(r => r.status === 'failed').length;

        const durations = dayRuns.map(r => r.duration).filter(d => d !== null) as number[];
        const avgDuration =
        durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        let flips = 0;
        for (let i = 1; i < dayRuns.length; i++) {
        if (dayRuns[i].status !== dayRuns[i - 1].status) flips++;
        }

        return {
        day,
        totalRuns: total,
        successRate: successes / total,
        failureRate: failures / total,
        averageDurationMs: avgDuration,
        flakiness: flips / Math.max(1, total - 1)
        };
    });

    // ----------------------------------------------------
    // LATEST RUNS
    // ----------------------------------------------------
    const latestRuns = runs
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 20);

    return {
        suiteId,
        summary,
        leaderboards,
        flaky,
        trends: {
        daily
        },
        latestRuns
    };
   }
}
