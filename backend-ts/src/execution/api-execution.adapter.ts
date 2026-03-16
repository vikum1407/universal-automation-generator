import { Injectable } from '@nestjs/common';
import { ExecutionResult, TestResult } from './execution.model';
import { spawn } from 'child_process';

@Injectable()
export class APIExecutionAdapter {
  async runPostman(project: string, collectionPath: string): Promise<ExecutionResult> {
    const start = Date.now();

    let stdout = '';
    let stderr = '';

    await new Promise<void>((resolve) => {
      const proc = spawn('npx', ['newman', 'run', collectionPath, '--reporter-json'], {
        cwd: project
      });

      proc.stdout.on('data', (d) => (stdout += d.toString()));
      proc.stderr.on('data', (d) => (stderr += d.toString()));

      proc.on('close', () => resolve());
    });

    const results = this.parse(stdout);

    return {
      project,
      timestamp: Date.now(),
      results,
      summary: {
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        total: results.length
      },
      raw: { stdout, stderr }
    };
  }

  private parse(output: string): TestResult[] {
    const results: TestResult[] = [];

    try {
      const json = JSON.parse(output);

      for (const run of json.run.executions) {
        results.push({
          name: run.item.name,
          status: run.assertions?.some(a => a.error) ? 'fail' : 'pass',
          durationMs: run.response?.responseTime ?? 0,
          error: run.assertions?.find(a => a.error)?.error?.message || null
        });
      }
    } catch {
      // fallback if JSON parsing fails
      results.push({
        name: 'API Test Suite',
        status: 'fail',
        durationMs: 0,
        error: 'Failed to parse Postman output'
      });
    }

    return results;
  }
}
