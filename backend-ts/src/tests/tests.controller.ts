import { Controller, Post, Body, Get, Param, Res, Query, Delete } from '@nestjs/common';
import { FrameworkGenerationOrchestrator } from '../generator/framework-generation-orchestrator';
import { TestRunService } from './test-run.service';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import { Response } from 'express';

@Controller('api/tests')
export class TestsController {
  constructor(
    private readonly frameworkOrchestrator: FrameworkGenerationOrchestrator,
    private readonly testRunService: TestRunService
  ) {}

  @Get()
  async listTests() {
    const baseDir = path.join(process.cwd(), 'qlitz-output');

    if (!fs.existsSync(baseDir)) {
      return [];
    }

    const testIds = fs.readdirSync(baseDir).filter(id => {
      const stat = fs.statSync(path.join(baseDir, id));
      return stat.isDirectory();
    });

    const results = testIds.map(testId => {
      const metadataPath = path.join(baseDir, testId, 'metadata.json');
      let metadata = null;

      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      }

      return {
        testId,
        metadata
      };
    });

    return results;
  }

  @Get(':testId/runs/:runId')
  async getRun(@Param('testId') testId: string, @Param('runId') runId: string) {
    const runDir = path.join(process.cwd(), 'qlitz-output', testId, 'runs', runId);
    const metaPath = path.join(runDir, 'run.json');

    if (!fs.existsSync(metaPath)) {
      return { error: 'Run not found' };
    }

    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    return { testId, runId, metadata };
  }

  @Get(':testId/runs/:runId/results')
    async getRunResults(
      @Param('testId') testId: string,
      @Param('runId') runId: string
    ) {
      const runDir = path.join(process.cwd(), 'qlitz-output', testId, 'runs', runId);

      const metaPath = path.join(runDir, 'run.json');
      const logPath = path.join(runDir, 'run.log');
      const errPath = path.join(runDir, 'run.err');
      const artifactsDir = path.join(runDir, 'artifacts');

      if (!fs.existsSync(metaPath)) {
        return { error: 'Run not found' };
      }

      // Load run metadata
      const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

      // Load logs
      const stdout = fs.existsSync(logPath)
        ? fs.readFileSync(logPath, 'utf8')
        : '';

      const stderr = fs.existsSync(errPath)
        ? fs.readFileSync(errPath, 'utf8')
        : '';

      // Load artifacts summary
      let artifacts: any[] = [];

      if (fs.existsSync(artifactsDir)) {
        const walk = (dir: string, root: string): string[] => {
          let results: string[] = [];
          const list = fs.readdirSync(dir);

          for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
              results = results.concat(walk(filePath, root));
            } else {
              const relative = filePath.replace(root + path.sep, '');
              results.push(relative);
            }
          }

          return results;
        };

        const files = walk(artifactsDir, artifactsDir);

        const classify = (file: string) => {
          const ext = file.toLowerCase();

          if (ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg'))
            return 'screenshot';

          if (ext.endsWith('.mp4') || ext.endsWith('.webm'))
            return 'video';

          if (ext.endsWith('.html') || ext.endsWith('.xml') || ext.endsWith('.json'))
            return 'report';

          if (ext.endsWith('.zip') || ext.includes('trace'))
            return 'trace';

          if (ext.endsWith('.log') || ext.endsWith('.err') || ext.endsWith('.txt'))
            return 'log';

          return 'other';
        };

        artifacts = files.map(file => {
          const fullPath = path.join(artifactsDir, file);
          const stat = fs.statSync(fullPath);

          return {
            file,
            type: classify(file),
            size: stat.size,
            modifiedAt: stat.mtime.toISOString()
          };
        });
      }

      return {
        testId,
        runId,
        metadata,
        stdout,
        stderr,
        artifacts
      };
  }

  @Post(':testId/runs/:runId/retry')
    async retryRun(
      @Param('testId') testId: string,
      @Param('runId') runId: string
    ) {
      const baseDir = path.join(process.cwd(), 'qlitz-output', testId);
      const originalRunDir = path.join(baseDir, 'runs', runId);
      const originalMetaPath = path.join(originalRunDir, 'run.json');

      if (!fs.existsSync(originalMetaPath)) {
        return { error: 'Original run not found' };
      }

      const originalMeta = JSON.parse(fs.readFileSync(originalMetaPath, 'utf8'));

      const framework = originalMeta.framework?.toLowerCase();
      const language = originalMeta.language?.toLowerCase();

      const frameworksDir = path.join(baseDir, 'frameworks');

      if (!fs.existsSync(frameworksDir)) {
        return { testId, run: false, message: 'Framework folder missing' };
      }

      // ----------------------------------------------------
      // CREATE NEW RUN FOLDER
      // ----------------------------------------------------
      const newRunId = new Date().toISOString().replace(/[:.]/g, '-');
      const newRunDir = path.join(baseDir, 'runs', newRunId);
      fs.mkdirSync(newRunDir, { recursive: true });

      const runMeta: {
        runId: string;
        testId: string;
        framework: string;
        language: string;
        startedAt: string;
        finishedAt: string | null;
        status: 'running' | 'completed' | 'failed';
        retriedFrom: string;
      } = {
        runId: newRunId,
        testId,
        framework,
        language,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        status: 'running',
        retriedFrom: runId
      };

      fs.writeFileSync(path.join(newRunDir, 'run.json'), JSON.stringify(runMeta, null, 2));

      // ----------------------------------------------------
      // LOG FILES
      // ----------------------------------------------------
      const logPath = path.join(newRunDir, 'run.log');
      const errPath = path.join(newRunDir, 'run.err');
      const pidPath = path.join(newRunDir, 'run.pid');

      fs.writeFileSync(logPath, '');
      fs.writeFileSync(errPath, '');

      // ----------------------------------------------------
      // SELECT RUN COMMAND
      // ----------------------------------------------------
      const spawn = require('child_process').spawn;

      const runCommand = () => {
        if (framework === 'playwright') return ['npx', ['playwright', 'test']];
        if (framework === 'cypress') return ['npx', ['cypress', 'run']];
        if (framework === 'postman' || framework === 'newman')
          return ['npx', ['newman', 'run', 'collection.json']];
        return null;
      };

      const cmd = runCommand();

      if (!cmd) {
        return { testId, run: false, message: 'Unsupported framework' };
      }

      // ----------------------------------------------------
      // START PROCESS
      // ----------------------------------------------------
      const child = spawn(cmd[0], cmd[1], { cwd: frameworksDir });

      fs.writeFileSync(pidPath, child.pid.toString());

      child.stdout.on('data', (data: Buffer) => {
        fs.appendFileSync(logPath, data.toString());
      });

      child.stderr.on('data', (data: Buffer) => {
        fs.appendFileSync(errPath, data.toString());
      });

      child.on('close', (code: number) => {
        if (fs.existsSync(pidPath)) fs.unlinkSync(pidPath);

        runMeta.status = code === 0 ? 'completed' : 'failed';
        runMeta.finishedAt = new Date().toISOString();

        fs.writeFileSync(path.join(newRunDir, 'run.json'), JSON.stringify(runMeta, null, 2));
      });

      return {
        testId,
        originalRunId: runId,
        newRunId,
        running: true,
        message: 'Retry started'
      };
  }

  @Post(':testId/runs/:runId/clone')
    async cloneRun(
      @Param('testId') testId: string,
      @Param('runId') runId: string
    ) {
      const baseDir = path.join(process.cwd(), 'qlitz-output', testId);
      const sourceRunDir = path.join(baseDir, 'runs', runId);

      if (!fs.existsSync(sourceRunDir)) {
        return { error: 'Run not found' };
      }

      // ----------------------------------------------------
      // CREATE NEW RUN FOLDER
      // ----------------------------------------------------
      const newRunId = new Date().toISOString().replace(/[:.]/g, '-');
      const newRunDir = path.join(baseDir, 'runs', newRunId);
      fs.mkdirSync(newRunDir, { recursive: true });

      // ----------------------------------------------------
      // COPY RECURSIVELY
      // ----------------------------------------------------
      const copyRecursive = (src: string, dest: string) => {
        const stat = fs.statSync(src);

        if (stat.isDirectory()) {
          fs.mkdirSync(dest, { recursive: true });
          const entries = fs.readdirSync(src);
          for (const entry of entries) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
          }
        } else {
          fs.copyFileSync(src, dest);
        }
      };

      copyRecursive(sourceRunDir, newRunDir);

      // ----------------------------------------------------
      // UPDATE run.json
      // ----------------------------------------------------
      const metaPath = path.join(newRunDir, 'run.json');

      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

        meta.runId = newRunId;
        meta.clonedFrom = runId;
        meta.startedAt = new Date().toISOString();
        meta.finishedAt = new Date().toISOString();
        meta.status = 'cloned';

        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
      }

      return {
        testId,
        originalRunId: runId,
        newRunId,
        cloned: true,
        message: 'Run successfully cloned'
      };
  }

  @Delete(':testId/runs/:runId')
    async deleteRun(@Param('testId') testId: string, @Param('runId') runId: string) {
      const runDir = path.join(process.cwd(), 'qlitz-output', testId, 'runs', runId);

      if (!fs.existsSync(runDir)) {
        return { deleted: false, message: 'Run not found' };
      }

      fs.rmSync(runDir, { recursive: true, force: true });

      return { deleted: true, testId, runId };
  }

  @Post('generate')
  async generate(
    @Body() body: { 
      testId: string; 
      automationType: 'ui' | 'api';
      framework: string;
      language: string;
    }
  ) {
    const { testId, automationType, framework, language } = body;

    const url = process.env.QLITZ_TEST_URL ?? 'https://www.saucedemo.com';
    const swaggerUrl = process.env.QLITZ_SWAGGER_URL ?? 'https://petstore.swagger.io/v2/swagger.json';

    const outputDir = this.testRunService.ensureTestRunFolder(testId, framework, language);

    if (automationType === 'ui') {
      await this.frameworkOrchestrator.generateUiFrameworkFromUrl(url);
    }

    if (automationType === 'api') {
      await this.frameworkOrchestrator.generateApiFrameworkFromSwagger(swaggerUrl);
    }

    this.testRunService.writeMetadata(testId, {
      automationType,
      framework,
      language,
      url,
      swaggerUrl,
      outputDir
    });

    return {
      testId,
      automationType,
      framework,
      language,
      metadata: this.testRunService.loadMetadata(testId),
      outputDir
    };
  }

  @Get(':testId/files')
  async getFiles(@Param('testId') testId: string) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId, 'frameworks');

    if (!fs.existsSync(baseDir)) {
      return { testId, files: [] };
    }

    const walk = (dir: string, root: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);

      list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          results = results.concat(walk(filePath, root));
        } else {
          const relative = filePath.replace(root + path.sep, '');
          results.push(relative);
        }
      });

      return results;
    };

    const files = walk(baseDir, baseDir);

    return {
      testId,
      files
    };
  }

  @Get(':testId/metadata')
  async getMetadata(@Param('testId') testId: string) {
    const metadataPath = path.join(process.cwd(), 'qlitz-output', testId, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return { testId, metadata: null };
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    return {
      testId,
      metadata
    };
  }

  @Get(':testId/structure')
  async getStructure(@Param('testId') testId: string) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId, 'frameworks');

    if (!fs.existsSync(baseDir)) {
      return { testId, structure: {} };
    }

    const buildTree = (dir: string): any => {
      const entries = fs.readdirSync(dir);
      const tree: any = {};

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          tree[entry] = buildTree(fullPath);
        } else {
          tree[entry] = 'file';
        }
      }

      return tree;
    };

    const structure = buildTree(baseDir);

    return {
      testId,
      structure
    };
  }

  @Get(':testId/runs')
    async listRuns(@Param('testId') testId: string) {
    const runsDir = path.join(process.cwd(), 'qlitz-output', testId, 'runs');

    if (!fs.existsSync(runsDir)) {
      return { testId, runs: [] };
    }

    const runIds = fs.readdirSync(runsDir).filter(id => {
      const stat = fs.statSync(path.join(runsDir, id));
      return stat.isDirectory();
    });

    const runs = runIds.map(runId => {
      const metaPath = path.join(runsDir, runId, 'run.json');
      if (fs.existsSync(metaPath)) {
        return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      }
      return { runId, status: 'unknown' };
    });

    return { testId, runs };
  }

  @Get(':testId/analytics')
    async getTestAnalytics(@Param('testId') testId: string) {
      const runsDir = path.join(process.cwd(), 'qlitz-output', testId, 'runs');

      if (!fs.existsSync(runsDir)) {
        return {
          testId,
          totalRuns: 0,
          successRate: 0,
          failureRate: 0,
          averageDurationMs: 0,
          flaky: false,
          lastRuns: []
        };
      }

      const runIds = fs.readdirSync(runsDir).filter(id => {
        const stat = fs.statSync(path.join(runsDir, id));
        return stat.isDirectory();
      });

      const runs = runIds
        .map(runId => {
          const metaPath = path.join(runsDir, runId, 'run.json');
          if (!fs.existsSync(metaPath)) return null;

          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

          const started = meta.startedAt ? new Date(meta.startedAt).getTime() : null;
          const finished = meta.finishedAt ? new Date(meta.finishedAt).getTime() : null;

          const duration = started && finished ? finished - started : null;

          return {
            runId,
            status: meta.status,
            startedAt: meta.startedAt,
            finishedAt: meta.finishedAt,
            duration
          };
        })
        .filter(Boolean);

      if (runs.length === 0) {
        return {
          testId,
          totalRuns: 0,
          successRate: 0,
          failureRate: 0,
          averageDurationMs: 0,
          flaky: false,
          lastRuns: []
        };
      }

      // ----------------------------------------------------
      // CALCULATE METRICS
      // ----------------------------------------------------
      const totalRuns = runs.length;
      const successes = runs.filter(r => r.status === 'completed').length;
      const failures = runs.filter(r => r.status === 'failed').length;

      const successRate = successes / totalRuns;
      const failureRate = failures / totalRuns;

      const durations = runs
        .map(r => r.duration)
        .filter(d => d !== null) as number[];

      const averageDurationMs =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0;

      // Flaky = both success and failure exist
      const flaky = successes > 0 && failures > 0;

      // Last 10 runs (sorted newest first)
      const lastRuns = runs
        .sort((a, b) => {
          const t1 = new Date(a.startedAt).getTime();
          const t2 = new Date(b.startedAt).getTime();
          return t2 - t1;
        })
        .slice(0, 10);

      return {
        testId,
        totalRuns,
        successRate,
        failureRate,
        averageDurationMs,
        flaky,
        lastRuns
      };
    }

  @Get(':testId/download')
  async download(@Param('testId') testId: string, @Res() res: Response) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId);

    if (!fs.existsSync(baseDir)) {
      return res.status(404).send('Test not found');
    }

    const zipName = `${testId}.zip`;
    res.setHeader('Content-Disposition', `attachment; filename=${zipName}`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip');
    archive.pipe(res);
    archive.directory(baseDir, false);
    archive.finalize();
  }

  @Get(':testId/file')
  async getFileContent(
    @Param('testId') testId: string,
    @Query('path') filePath: string
  ) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId, 'frameworks');

    if (!filePath) {
      return { error: 'Missing ?path=' };
    }

    const fullPath = path.join(baseDir, filePath);

    if (!fs.existsSync(fullPath)) {
      return { error: 'File not found' };
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    return {
      testId,
      path: filePath,
      content
    };
  }

  @Delete(':testId')
  async deleteTest(@Param('testId') testId: string) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId);

    if (!fs.existsSync(baseDir)) {
      return { testId, deleted: false, message: 'Test not found' };
    }

    fs.rmSync(baseDir, { recursive: true, force: true });

    return {
      testId,
      deleted: true
    };
  }

  @Post(':testId/rename')
    async renameTest(
      @Param('testId') testId: string,
      @Body() body: { newTestId: string }
    ) {
    const { newTestId } = body;

    if (!newTestId || newTestId.trim() === '') {
      return { error: 'newTestId is required' };
    }

    const baseDir = path.join(process.cwd(), 'qlitz-output');
    const oldPath = path.join(baseDir, testId);
    const newPath = path.join(baseDir, newTestId);

    if (!fs.existsSync(oldPath)) {
      return { testId, renamed: false, message: 'Test not found' };
    }

    if (fs.existsSync(newPath)) {
      return { testId, renamed: false, message: 'newTestId already exists' };
    }

    fs.renameSync(oldPath, newPath);

    return {
      oldTestId: testId,
      newTestId,
      renamed: true
    };
  }

  @Post(':testId/duplicate')
    async duplicateTest(
      @Param('testId') testId: string,
      @Body() body: { newTestId: string }
    ) {
    const { newTestId } = body;

    if (!newTestId || newTestId.trim() === '') {
      return { error: 'newTestId is required' };
    }

    const baseDir = path.join(process.cwd(), 'qlitz-output');
    const source = path.join(baseDir, testId);
    const target = path.join(baseDir, newTestId);

    if (!fs.existsSync(source)) {
      return { testId, duplicated: false, message: 'Source test not found' };
    }

    if (fs.existsSync(target)) {
      return { testId, duplicated: false, message: 'newTestId already exists' };
    }

    const copyRecursive = (src: string, dest: string) => {
      const stat = fs.statSync(src);

      if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
          copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    copyRecursive(source, target);

    return {
      oldTestId: testId,
      newTestId,
      duplicated: true
    };
  }

  @Post(':testId/run')
    async runTest(@Param('testId') testId: string) {
      const baseDir = path.join(process.cwd(), 'qlitz-output', testId);
      const metadataPath = path.join(baseDir, 'metadata.json');

      if (!fs.existsSync(metadataPath)) {
        return { testId, run: false, message: 'Metadata not found' };
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const framework = metadata.framework?.toLowerCase();
      const language = metadata.language?.toLowerCase();

      const frameworksDir = path.join(baseDir, 'frameworks');

      if (!fs.existsSync(frameworksDir)) {
        return { testId, run: false, message: 'Framework folder missing' };
      }

      // ----------------------------------------------------
      // CREATE RUN HISTORY FOLDER
      // ----------------------------------------------------
      const runId = new Date().toISOString().replace(/[:.]/g, '-');
      const runDir = path.join(baseDir, 'runs', runId);
      fs.mkdirSync(runDir, { recursive: true });

      // FULL TYPE-SAFE METADATA OBJECT
      const runMeta: {
        runId: string;
        testId: string;
        framework: string;
        language: string;
        startedAt: string;
        finishedAt: string | null;
        status: 'running' | 'completed' | 'failed';
      } = {
        runId,
        testId,
        framework,
        language,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        status: 'running'
      };

      fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(runMeta, null, 2));

      // ----------------------------------------------------
      // LOG FILES
      // ----------------------------------------------------
      const logPath = path.join(runDir, 'run.log');
      const errPath = path.join(runDir, 'run.err');
      const pidPath = path.join(runDir, 'run.pid');

      fs.writeFileSync(logPath, '');
      fs.writeFileSync(errPath, '');

      // ----------------------------------------------------
      // SELECT RUN COMMAND
      // ----------------------------------------------------
      const spawn = require('child_process').spawn;

      const runCommand = () => {
        if (framework === 'playwright') return ['npx', ['playwright', 'test']];
        if (framework === 'cypress') return ['npx', ['cypress', 'run']];
        if (framework === 'postman' || framework === 'newman')
          return ['npx', ['newman', 'run', 'collection.json']];
        return null;
      };

      const cmd = runCommand();

      if (!cmd) {
        return { testId, run: false, message: 'Unsupported framework' };
      }

      // ----------------------------------------------------
      // START PROCESS
      // ----------------------------------------------------
      const child = spawn(cmd[0], cmd[1], { cwd: frameworksDir });

      fs.writeFileSync(pidPath, child.pid.toString());

      child.stdout.on('data', (data: Buffer) => {
        fs.appendFileSync(logPath, data.toString());
      });

      child.stderr.on('data', (data: Buffer) => {
        fs.appendFileSync(errPath, data.toString());
      });

      child.on('close', (code: number) => {
        if (fs.existsSync(pidPath)) fs.unlinkSync(pidPath);

        runMeta.status = code === 0 ? 'completed' : 'failed';
        runMeta.finishedAt = new Date().toISOString();

        fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(runMeta, null, 2));
      });

      return {
        testId,
        runId,
        running: true,
        message: 'Test execution started'
      };
  }

  @Get(':testId/run/status')
    async getRunStatus(@Param('testId') testId: string) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId);
    const logPath = path.join(baseDir, 'run.log');
    const errPath = path.join(baseDir, 'run.err');
    const pidPath = path.join(baseDir, 'run.pid');

    const running = fs.existsSync(pidPath);

    const stdout = fs.existsSync(logPath)
      ? fs.readFileSync(logPath, 'utf8')
      : '';

    const stderr = fs.existsSync(errPath)
      ? fs.readFileSync(errPath, 'utf8')
      : '';

    return {
      testId,
      running,
      stdout,
      stderr
    };
  }

  @Post(':testId/run/stop')
    async stopRun(@Param('testId') testId: string) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId);
    const pidPath = path.join(baseDir, 'run.pid');
    const logPath = path.join(baseDir, 'run.log');

    if (!fs.existsSync(pidPath)) {
      return {
        testId,
        stopped: false,
        message: 'No running process found'
      };
    }

    const pid = parseInt(fs.readFileSync(pidPath, 'utf8'), 10);

    try {
      process.kill(pid, 'SIGTERM');
    } catch (err) {
      return {
        testId,
        stopped: false,
        message: 'Failed to stop process'
      };
    }

    fs.unlinkSync(pidPath);
    fs.appendFileSync(logPath, '\n--- PROCESS STOPPED BY USER ---\n');

    return {
      testId,
      stopped: true
    };
  }

  @Get(':testId/logs')
    async getLogs(@Param('testId') testId: string) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId);
    const logPath = path.join(baseDir, 'run.log');
    const errPath = path.join(baseDir, 'run.err');

    const stdout = fs.existsSync(logPath)
      ? fs.readFileSync(logPath, 'utf8')
      : '';

    const stderr = fs.existsSync(errPath)
      ? fs.readFileSync(errPath, 'utf8')
      : '';

    return {
      testId,
      stdout,
      stderr
    };
  }

  @Get(':testId/artifacts')
    async getArtifacts(@Param('testId') testId: string) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId, 'artifacts');

    if (!fs.existsSync(baseDir)) {
      return { testId, artifacts: [] };
    }

    const walk = (dir: string, root: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);

      for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          results = results.concat(walk(filePath, root));
        } else {
          const relative = filePath.replace(root + path.sep, '');
          results.push(relative);
        }
      }

      return results;
    };

    const artifacts = walk(baseDir, baseDir);

    return {
      testId,
      artifacts
    };
  }

  @Get(':testId/artifacts/summary')
    async getArtifactSummary(@Param('testId') testId: string) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId, 'artifacts');

    if (!fs.existsSync(baseDir)) {
      return { testId, artifacts: [] };
    }

    const walk = (dir: string, root: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);

      for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          results = results.concat(walk(filePath, root));
        } else {
          const relative = filePath.replace(root + path.sep, '');
          results.push(relative);
        }
      }

      return results;
    };

    const files = walk(baseDir, baseDir);

    const classify = (file: string) => {
      const ext = file.toLowerCase();

      if (ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg')) {
        return 'screenshot';
      }

      if (ext.endsWith('.mp4') || ext.endsWith('.webm')) {
        return 'video';
      }

      if (ext.endsWith('.html') || ext.endsWith('.xml') || ext.endsWith('.json')) {
        return 'report';
      }

      if (ext.endsWith('.zip') || ext.includes('trace')) {
        return 'trace';
      }

      if (ext.endsWith('.log') || ext.endsWith('.err') || ext.endsWith('.txt')) {
        return 'log';
      }

      return 'other';
    };

    const artifacts = files.map(file => {
      const fullPath = path.join(baseDir, file);
      const stat = fs.statSync(fullPath);

      return {
        file,
        type: classify(file),
        size: stat.size,
        modifiedAt: stat.mtime.toISOString()
      };
    });

    return {
      testId,
      artifacts
    };
  }

  @Get(':testId/artifact')
    async getArtifactFile(
      @Param('testId') testId: string,
      @Query('path') filePath: string,
      @Res() res: Response
    ) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId, 'artifacts');

    if (!filePath) {
      return res.status(400).send('Missing ?path=');
    }

    const fullPath = path.join(baseDir, filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('Artifact not found');
    }

    res.download(fullPath);
  }

  @Post(':testId/metadata')
    async updateMetadata(
      @Param('testId') testId: string,
      @Body() updates: Record<string, any>
    ) {
    const baseDir = path.join(process.cwd(), 'qlitz-output', testId);
    const metadataPath = path.join(baseDir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return { testId, updated: false, message: 'Metadata not found' };
    }

    const current = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };

    fs.writeFileSync(metadataPath, JSON.stringify(merged, null, 2));

    return {
      testId,
      updated: true,
      metadata: merged
    };
  }

  @Get('/analytics')
    async getGlobalAnalytics() {
      const outputDir = path.join(process.cwd(), 'qlitz-output');

      if (!fs.existsSync(outputDir)) {
        return {
          totalTests: 0,
          totalRuns: 0,
          successRate: 0,
          failureRate: 0,
          averageDurationMs: 0,
          flakyTests: [],
          slowestTests: [],
          mostExecutedTests: [],
          latestRuns: []
        };
      }

      const testIds = fs.readdirSync(outputDir).filter(id => {
        const stat = fs.statSync(path.join(outputDir, id));
        return stat.isDirectory();
      });

      let allRuns: any[] = [];
      let testStats: Record<string, { runs: number; successes: number; failures: number; durations: number[] }> = {};

      for (const testId of testIds) {
        const runsDir = path.join(outputDir, testId, 'runs');

        if (!fs.existsSync(runsDir)) continue;

        const runIds = fs.readdirSync(runsDir).filter(id => {
          const stat = fs.statSync(path.join(runsDir, id));
          return stat.isDirectory();
        });

        testStats[testId] = { runs: 0, successes: 0, failures: 0, durations: [] };

        for (const runId of runIds) {
          const metaPath = path.join(runsDir, runId, 'run.json');
          if (!fs.existsSync(metaPath)) continue;

          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

          const started = meta.startedAt ? new Date(meta.startedAt).getTime() : null;
          const finished = meta.finishedAt ? new Date(meta.finishedAt).getTime() : null;
          const duration = started && finished ? finished - started : null;

          allRuns.push({
            testId,
            runId,
            status: meta.status,
            startedAt: meta.startedAt,
            finishedAt: meta.finishedAt,
            duration
          });

          testStats[testId].runs++;

          if (meta.status === 'completed') testStats[testId].successes++;
          if (meta.status === 'failed') testStats[testId].failures++;
          if (duration !== null) testStats[testId].durations.push(duration);
        }
      }

      const totalRuns = allRuns.length;
      const totalTests = testIds.length;

      const successes = allRuns.filter(r => r.status === 'completed').length;
      const failures = allRuns.filter(r => r.status === 'failed').length;

      const successRate = totalRuns > 0 ? successes / totalRuns : 0;
      const failureRate = totalRuns > 0 ? failures / totalRuns : 0;

      const durations = allRuns.map(r => r.duration).filter(d => d !== null) as number[];
      const averageDurationMs =
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

      // Flaky tests = both success and failure
      const flakyTests = Object.entries(testStats)
        .filter(([_, s]) => s.successes > 0 && s.failures > 0)
        .map(([testId]) => testId);

      // Slowest tests = highest average duration
      const slowestTests = Object.entries(testStats)
        .map(([testId, s]) => ({
          testId,
          averageDuration: s.durations.length
            ? s.durations.reduce((a, b) => a + b, 0) / s.durations.length
            : 0
        }))
        .sort((a, b) => b.averageDuration - a.averageDuration)
        .slice(0, 5);

      // Most executed tests
      const mostExecutedTests = Object.entries(testStats)
        .map(([testId, s]) => ({ testId, runs: s.runs }))
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 5);

      // Latest 20 runs across all tests
      const latestRuns = allRuns
        .sort((a, b) => {
          const t1 = new Date(a.startedAt).getTime();
          const t2 = new Date(b.startedAt).getTime();
          return t2 - t1;
        })
        .slice(0, 20);

      return {
        totalTests,
        totalRuns,
        successRate,
        failureRate,
        averageDurationMs,
        flakyTests,
        slowestTests,
        mostExecutedTests,
        latestRuns
      };
  }
  
  @Get('/analytics/flaky')
    async getFlakyAnalytics() {
      const outputDir = path.join(process.cwd(), 'qlitz-output');

      if (!fs.existsSync(outputDir)) {
        return {
          totalTests: 0,
          flakyTests: [],
          worstOffenders: []
        };
      }

      const testIds = fs.readdirSync(outputDir).filter(id => {
        const stat = fs.statSync(path.join(outputDir, id));
        return stat.isDirectory();
      });

      let flakyTests: any[] = [];

      for (const testId of testIds) {
        const runsDir = path.join(outputDir, testId, 'runs');
        if (!fs.existsSync(runsDir)) continue;

        const runIds = fs.readdirSync(runsDir).filter(id => {
          const stat = fs.statSync(path.join(runsDir, id));
          return stat.isDirectory();
        });

        const runs = runIds
          .map(runId => {
            const metaPath = path.join(runsDir, runId, 'run.json');
            if (!fs.existsSync(metaPath)) return null;

            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

            return {
              runId,
              status: meta.status,
              startedAt: meta.startedAt
            };
          })
          .filter(Boolean)
          .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

        if (runs.length < 2) continue;

        const statuses = runs.map(r => r.status);

        const hasPass = statuses.includes('completed');
        const hasFail = statuses.includes('failed');

        if (!hasPass || !hasFail) continue;

        // ----------------------------------------------------
        // CALCULATE FLAKINESS METRICS
        // ----------------------------------------------------

        // Count flips between pass/fail
        let flips = 0;
        for (let i = 1; i < statuses.length; i++) {
          if (statuses[i] !== statuses[i - 1]) flips++;
        }

        const flakinessScore = flips / (statuses.length - 1);

        // Longest pass streak
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

        // Failure clusters
        let failureClusters = 0;
        for (let i = 1; i < statuses.length; i++) {
          if (statuses[i] === 'failed' && statuses[i - 1] === 'failed') {
            failureClusters++;
          }
        }

        flakyTests.push({
          testId,
          totalRuns: runs.length,
          flakinessScore,
          flips,
          longestPassStreak,
          failureClusters,
          recentRuns: runs.slice(-10)
        });
      }

      // Sort by worst flakiness
      const worstOffenders = flakyTests
        .sort((a, b) => b.flakinessScore - a.flakinessScore)
        .slice(0, 10);

      return {
        totalTests: testIds.length,
        flakyTests,
        worstOffenders
      };
  }

  @Get('/analytics/trends')
    async getAnalyticsTrends() {
      const outputDir = path.join(process.cwd(), 'qlitz-output');

      if (!fs.existsSync(outputDir)) {
        return {
          daily: [],
          weekly: [],
          monthly: []
        };
      }

      const testIds = fs.readdirSync(outputDir).filter(id => {
        const stat = fs.statSync(path.join(outputDir, id));
        return stat.isDirectory();
      });

      let allRuns: any[] = [];

      for (const testId of testIds) {
        const runsDir = path.join(outputDir, testId, 'runs');
        if (!fs.existsSync(runsDir)) continue;

        const runIds = fs.readdirSync(runsDir).filter(id => {
          const stat = fs.statSync(path.join(runsDir, id));
          return stat.isDirectory();
        });

        for (const runId of runIds) {
          const metaPath = path.join(runsDir, runId, 'run.json');
          if (!fs.existsSync(metaPath)) continue;

          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

          const started = meta.startedAt ? new Date(meta.startedAt) : null;
          const finished = meta.finishedAt ? new Date(meta.finishedAt) : null;

          const duration =
            started && finished ? finished.getTime() - started.getTime() : null;

          allRuns.push({
            testId,
            runId,
            status: meta.status,
            startedAt: meta.startedAt,
            duration
          });
        }
      }

      if (allRuns.length === 0) {
        return {
          daily: [],
          weekly: [],
          monthly: []
        };
      }

      // ----------------------------------------------------
      // GROUPING HELPERS
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

      const formatWeek = (d: Date) => {
        const oneJan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
        return `${d.getFullYear()}-W${week}`;
      };

      const formatMonth = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // ----------------------------------------------------
      // DAILY TRENDS
      // ----------------------------------------------------
      const dailyGroups = groupBy(allRuns, r => formatDate(new Date(r.startedAt)));

      const daily = Object.entries(dailyGroups).map(([day, runs]) => {
        const total = runs.length;
        const successes = runs.filter(r => r.status === 'completed').length;
        const failures = runs.filter(r => r.status === 'failed').length;

        const durations = runs.map(r => r.duration).filter(d => d !== null) as number[];
        const avgDuration =
          durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        const flips = runs.reduce((acc, r, i) => {
          if (i === 0) return acc;
          return acc + (runs[i].status !== runs[i - 1].status ? 1 : 0);
        }, 0);

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
      // WEEKLY TRENDS
      // ----------------------------------------------------
      const weeklyGroups = groupBy(allRuns, r => formatWeek(new Date(r.startedAt)));

      const weekly = Object.entries(weeklyGroups).map(([week, runs]) => {
        const total = runs.length;
        const successes = runs.filter(r => r.status === 'completed').length;
        const failures = runs.filter(r => r.status === 'failed').length;

        const durations = runs.map(r => r.duration).filter(d => d !== null) as number[];
        const avgDuration =
          durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        const flips = runs.reduce((acc, r, i) => {
          if (i === 0) return acc;
          return acc + (runs[i].status !== runs[i - 1].status ? 1 : 0);
        }, 0);

        return {
          week,
          totalRuns: total,
          successRate: successes / total,
          failureRate: failures / total,
          averageDurationMs: avgDuration,
          flakiness: flips / Math.max(1, total - 1)
        };
      });

      // ----------------------------------------------------
      // MONTHLY TRENDS
      // ----------------------------------------------------
      const monthlyGroups = groupBy(allRuns, r => formatMonth(new Date(r.startedAt)));

      const monthly = Object.entries(monthlyGroups).map(([month, runs]) => {
        const total = runs.length;
        const successes = runs.filter(r => r.status === 'completed').length;
        const failures = runs.filter(r => r.status === 'failed').length;

        const durations = runs.map(r => r.duration).filter(d => d !== null) as number[];
        const avgDuration =
          durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        const flips = runs.reduce((acc, r, i) => {
          if (i === 0) return acc;
          return acc + (runs[i].status !== runs[i - 1].status ? 1 : 0);
        }, 0);

        return {
          month,
          totalRuns: total,
          successRate: successes / total,
          failureRate: failures / total,
          averageDurationMs: avgDuration,
          flakiness: flips / Math.max(1, total - 1)
        };
      });

      return {
        daily,
        weekly,
        monthly
      };
  }

  @Get('/analytics/leaderboard')
    async getAnalyticsLeaderboard() {
      const outputDir = path.join(process.cwd(), 'qlitz-output');

      if (!fs.existsSync(outputDir)) {
        return {
          fastestTests: [],
          slowestTests: [],
          mostExecutedTests: [],
          mostFlakyTests: [],
          mostStableTests: [],
          highestSuccessRate: [],
          lowestSuccessRate: []
        };
      }

      const testIds = fs.readdirSync(outputDir).filter(id => {
        const stat = fs.statSync(path.join(outputDir, id));
        return stat.isDirectory();
      });

      let testStats: Record<
        string,
        {
          runs: number;
          successes: number;
          failures: number;
          durations: number[];
          flips: number;
        }
      > = {};

      for (const testId of testIds) {
        const runsDir = path.join(outputDir, testId, 'runs');
        if (!fs.existsSync(runsDir)) continue;

        const runIds = fs.readdirSync(runsDir).filter(id => {
          const stat = fs.statSync(path.join(runsDir, id));
          return stat.isDirectory();
        });

        testStats[testId] = {
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

          testStats[testId].runs++;

          if (meta.status === 'completed') testStats[testId].successes++;
          if (meta.status === 'failed') testStats[testId].failures++;
          if (duration !== null) testStats[testId].durations.push(duration);

          if (lastStatus && lastStatus !== meta.status) {
            testStats[testId].flips++;
          }

          lastStatus = meta.status;
        }
      }

      const toArray = Object.entries(testStats).map(([testId, s]) => ({
        testId,
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

      const fastestTests = toArray
        .filter(t => t.avgDuration !== null)
        .sort((a, b) => a.avgDuration! - b.avgDuration!)
        .slice(0, 10);

      const slowestTests = toArray
        .filter(t => t.avgDuration !== null)
        .sort((a, b) => b.avgDuration! - a.avgDuration!)
        .slice(0, 10);

      const mostExecutedTests = toArray
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 10);

      const mostFlakyTests = toArray
        .filter(t => t.runs > 1)
        .sort((a, b) => b.flakinessScore - a.flakinessScore)
        .slice(0, 10);

      const mostStableTests = toArray
        .filter(t => t.runs > 1)
        .sort((a, b) => a.flakinessScore - b.flakinessScore)
        .slice(0, 10);

      const highestSuccessRate = toArray
        .filter(t => t.runs > 0)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 10);

      const lowestSuccessRate = toArray
        .filter(t => t.runs > 0)
        .sort((a, b) => a.successRate - b.successRate)
        .slice(0, 10);

      return {
        fastestTests,
        slowestTests,
        mostExecutedTests,
        mostFlakyTests,
        mostStableTests,
        highestSuccessRate,
        lowestSuccessRate
      };
  }

  @Get('/dashboard')
    async getDashboard() {
      const outputDir = path.join(process.cwd(), 'qlitz-output');

      if (!fs.existsSync(outputDir)) {
        return {
          summary: {
            totalTests: 0,
            totalRuns: 0,
            successRate: 0,
            failureRate: 0,
            averageDurationMs: 0
          },
          leaderboards: {
            fastestTests: [],
            slowestTests: [],
            mostExecutedTests: [],
            mostFlakyTests: [],
            mostStableTests: [],
            highestSuccessRate: [],
            lowestSuccessRate: []
          },
          trends: {
            daily: [],
            weekly: [],
            monthly: []
          },
          flaky: {
            flakyTests: [],
            worstOffenders: []
          },
          latestRuns: []
        };
      }

      const testIds = fs.readdirSync(outputDir).filter(id => {
        const stat = fs.statSync(path.join(outputDir, id));
        return stat.isDirectory();
      });

      let allRuns: any[] = [];
      let testStats: Record<
        string,
        {
          runs: number;
          successes: number;
          failures: number;
          durations: number[];
          flips: number;
        }
      > = {};

      // ----------------------------------------------------
      // LOAD ALL RUNS
      // ----------------------------------------------------
      for (const testId of testIds) {
        const runsDir = path.join(outputDir, testId, 'runs');
        if (!fs.existsSync(runsDir)) continue;

        const runIds = fs.readdirSync(runsDir).filter(id => {
          const stat = fs.statSync(path.join(runsDir, id));
          return stat.isDirectory();
        });

        testStats[testId] = {
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

          allRuns.push({
            testId,
            runId,
            status: meta.status,
            startedAt: meta.startedAt,
            finishedAt: meta.finishedAt,
            duration
          });

          testStats[testId].runs++;
          if (meta.status === 'completed') testStats[testId].successes++;
          if (meta.status === 'failed') testStats[testId].failures++;
          if (duration !== null) testStats[testId].durations.push(duration);

          if (lastStatus && lastStatus !== meta.status) {
            testStats[testId].flips++;
          }

          lastStatus = meta.status;
        }
      }

      // ----------------------------------------------------
      // SUMMARY
      // ----------------------------------------------------
      const totalRuns = allRuns.length;
      const totalTests = testIds.length;

      const successes = allRuns.filter(r => r.status === 'completed').length;
      const failures = allRuns.filter(r => r.status === 'failed').length;

      const durations = allRuns.map(r => r.duration).filter(d => d !== null) as number[];
      const averageDurationMs =
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

      const summary = {
        totalTests,
        totalRuns,
        successRate: totalRuns > 0 ? successes / totalRuns : 0,
        failureRate: totalRuns > 0 ? failures / totalRuns : 0,
        averageDurationMs
      };

      // ----------------------------------------------------
      // LEADERBOARDS
      // ----------------------------------------------------
      const toArray = Object.entries(testStats).map(([testId, s]) => ({
        testId,
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

      const leaderboards = {
        fastestTests: toArray
          .filter(t => t.avgDuration !== null)
          .sort((a, b) => a.avgDuration! - b.avgDuration!)
          .slice(0, 10),

        slowestTests: toArray
          .filter(t => t.avgDuration !== null)
          .sort((a, b) => b.avgDuration! - a.avgDuration!)
          .slice(0, 10),

        mostExecutedTests: toArray.sort((a, b) => b.runs - a.runs).slice(0, 10),

        mostFlakyTests: toArray
          .filter(t => t.runs > 1)
          .sort((a, b) => b.flakinessScore - a.flakinessScore)
          .slice(0, 10),

        mostStableTests: toArray
          .filter(t => t.runs > 1)
          .sort((a, b) => a.flakinessScore - b.flakinessScore)
          .slice(0, 10),

        highestSuccessRate: toArray
          .filter(t => t.runs > 0)
          .sort((a, b) => b.successRate - a.successRate)
          .slice(0, 10),

        lowestSuccessRate: toArray
          .filter(t => t.runs > 0)
          .sort((a, b) => a.successRate - b.successRate)
          .slice(0, 10)
      };

      // ----------------------------------------------------
      // FLAKY ANALYSIS
      // ----------------------------------------------------
      const flakyTests = toArray.filter(t => t.successes > 0 && t.failures > 0);
      const worstOffenders = flakyTests
        .sort((a, b) => b.flakinessScore - a.flakinessScore)
        .slice(0, 10);

      const flaky = {
        flakyTests,
        worstOffenders
      };

      // ----------------------------------------------------
      // TRENDS (DAILY)
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

      const dailyGroups = groupBy(allRuns, r => formatDate(new Date(r.startedAt)));

      const daily = Object.entries(dailyGroups).map(([day, runs]) => {
        const total = runs.length;
        const successes = runs.filter(r => r.status === 'completed').length;
        const failures = runs.filter(r => r.status === 'failed').length;

        const durations = runs.map(r => r.duration).filter(d => d !== null) as number[];
        const avgDuration =
          durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        const flips = runs.reduce((acc, r, i) => {
          if (i === 0) return acc;
          return acc + (runs[i].status !== runs[i - 1].status ? 1 : 0);
        }, 0);

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
      const latestRuns = allRuns
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 20);

      return {
        summary,
        leaderboards,
        trends: {
          daily
        },
        flaky,
        latestRuns
      };
  }

  @Get('/dashboard/:testId')
    async getTestDashboard(@Param('testId') testId: string) {
      const baseDir = path.join(process.cwd(), 'qlitz-output', testId);
      const runsDir = path.join(baseDir, 'runs');

      if (!fs.existsSync(baseDir) || !fs.existsSync(runsDir)) {
        return {
          testId,
          summary: {
            totalRuns: 0,
            successRate: 0,
            failureRate: 0,
            averageDurationMs: 0
          },
          leaderboards: {
            fastestRuns: [],
            slowestRuns: []
          },
          trends: {
            daily: []
          },
          flaky: {
            isFlaky: false,
            flakinessScore: 0,
            flips: 0,
            longestPassStreak: 0,
            failureClusters: 0
          },
          latestRuns: []
        };
      }

      const runIds = fs.readdirSync(runsDir).filter(id => {
        const stat = fs.statSync(path.join(runsDir, id));
        return stat.isDirectory();
      });

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
          duration
        });
      }

      if (runs.length === 0) {
        return {
          testId,
          summary: {
            totalRuns: 0,
            successRate: 0,
            failureRate: 0,
            averageDurationMs: 0
          },
          leaderboards: {
            fastestRuns: [],
            slowestRuns: []
          },
          trends: {
            daily: []
          },
          flaky: {
            isFlaky: false,
            flakinessScore: 0,
            flips: 0,
            longestPassStreak: 0,
            failureClusters: 0
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
      // LEADERBOARDS (FASTEST / SLOWEST RUNS)
      // ----------------------------------------------------
      const fastestRuns = runs
        .filter(r => r.duration !== null)
        .sort((a, b) => a.duration! - b.duration!)
        .slice(0, 10);

      const slowestRuns = runs
        .filter(r => r.duration !== null)
        .sort((a, b) => b.duration! - a.duration!)
        .slice(0, 10);

      const leaderboards = {
        fastestRuns,
        slowestRuns
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
        longestPassStreak,
        failureClusters
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
        testId,
        summary,
        leaderboards,
        trends: {
          daily
        },
        flaky,
        latestRuns
      };
  }

  @Get(':testId/export')
    async exportTest(@Param('testId') testId: string, @Res() res: Response) {
      const baseDir = path.join(process.cwd(), 'qlitz-output', testId);

      if (!fs.existsSync(baseDir)) {
        return res.status(404).json({ error: 'Test not found' });
      }

      const archive = archiver('zip', { zlib: { level: 9 } });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${testId}-export.zip"`);

      archive.pipe(res);

      const addFolderToZip = (srcDir: string, zipPath: string) => {
        if (!fs.existsSync(srcDir)) return;

        const items = fs.readdirSync(srcDir);

        for (const item of items) {
          const fullPath = path.join(srcDir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            addFolderToZip(fullPath, path.join(zipPath, item));
          } else {
            archive.file(fullPath, { name: path.join(zipPath, item) });
          }
        }
      };

      addFolderToZip(baseDir, testId);

      archive.finalize();
  }

}
