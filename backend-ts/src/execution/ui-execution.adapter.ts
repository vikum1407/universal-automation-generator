import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { ExecutionResult, TestResult } from './execution.model';

@Injectable()
export class UIExecutionAdapter {
  async runPlaywright(project: string, frameworkPath: string): Promise<ExecutionResult> {
    let stdout = '';
    let stderr = '';

    const proc = spawn('npx', ['playwright', 'test', '--reporter=line'], {
      cwd: frameworkPath,
      shell: true
    });

    proc.stdout.on('data', (d) => {
      const text = d.toString();
      stdout += text;
      console.log(text);
    });

    proc.stderr.on('data', (d) => {
      const text = d.toString();
      stderr += text;
      console.log(text);
    });

    await new Promise<void>((resolve) => {
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
    const results: TestResult[] = [];

    // Remove ANSI escape codes WITHOUT regex
    const clean = output
      .split('\u001b')
      .map(part => {
        const idx = part.indexOf('m');
        return idx !== -1 ? part.substring(idx + 1) : part;
      })
      .join('');

    const lines = clean.split('\n');

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      // PASS: [1/69] ... › Test name (532ms)
      if (line.includes('›') && line.includes('(') && line.includes(')')) {
        const parts = line.split('›');
        if (parts.length < 2) continue;

        const right = parts[1].trim();
        const name = right.substring(0, right.lastIndexOf('(')).trim();
        const durationText = right.substring(
          right.lastIndexOf('(') + 1,
          right.lastIndexOf(')')
        );

        let durationMs = 0;
        if (durationText.endsWith('ms')) {
          durationMs = Number(durationText.replace('ms', ''));
        } else if (durationText.endsWith('s')) {
          durationMs = Number(durationText.replace('s', '')) * 1000;
        }

        results.push({
          name,
          status: 'pass',
          durationMs,
          error: null
        });

        continue;
      }

      // FAIL: "1) ... › Test name"
      if (line.startsWith('1)') || this.startsWithNumberParen(line)) {
        const parts = line.split('›');
        if (parts.length < 2) continue;

        const name = parts[1].trim();

        results.push({
          name,
          status: 'fail',
          durationMs: 0,
          error: 'Test failed'
        });

        continue;
      }

      // FAIL: "✘ Test name"
      if (line.startsWith('✘')) {
        const name = line.replace('✘', '').trim();

        results.push({
          name,
          status: 'fail',
          durationMs: 0,
          error: 'Test failed'
        });

        continue;
      }
    }

    return results;
  }

  private startsWithNumberParen(line: string): boolean {
    if (line.length < 2) return false;
    const first = line[0];
    const second = line[1];
    return !isNaN(Number(first)) && second === ')';
  }
}
