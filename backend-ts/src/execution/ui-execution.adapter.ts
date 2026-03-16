import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { ExecutionResult, TestResult } from './execution.model';

@Injectable()
export class UIExecutionAdapter {
  async runPlaywright(project: string, frameworkPath: string): Promise<ExecutionResult> {
    const start = Date.now();

    let stdout = '';
    let stderr = '';

    const npxPath = 'C:\\Users\\Pavithra Herath\\AppData\\Roaming\\npm\\npx.cmd';
    const command = `"${npxPath}" playwright test --reporter=line`;

    await new Promise<void>((resolve) => {
      const proc = spawn('powershell.exe', ['-Command', command], {
        cwd: frameworkPath,
        shell: true
      });

      proc.stdout.on('data', (d) => (stdout += d.toString()));
      proc.stderr.on('data', (d) => (stderr += d.toString()));

      proc.on('close', () => resolve());
    });

    const results: TestResult[] = this.parse(stdout);

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
    const lines = output.split('\n');
    const results: TestResult[] = [];

    for (const line of lines) {
      const passMatch = line.match(/✓ (.+?) \((\d+)ms\)/);
      const failMatch = line.match(/✘ (.+?) \((\d+)ms\)/);

      if (passMatch) {
        results.push({
          name: passMatch[1],
          status: 'pass',
          durationMs: Number(passMatch[2]),
          error: null
        });
      }

      if (failMatch) {
        results.push({
          name: failMatch[1],
          status: 'fail',
          durationMs: Number(failMatch[2]),
          error: 'Test failed'
        });
      }
    }

    return results;
  }
}
