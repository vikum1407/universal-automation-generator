import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

export class OrchestratorRunner {
  async runPlaywright(outputDir: string): Promise<any | null> {
    return new Promise((resolve) => {
      const proc = spawn('npx', ['playwright', 'test'], {
        cwd: outputDir,
        shell: true
      });

      proc.stdout.on('data', (d) => console.log(d.toString()));
      proc.stderr.on('data', (d) => console.error(d.toString()));

      proc.on('close', async () => {
        const reportPath = path.join(outputDir, 'playwright-report.json');
        if (!fs.existsSync(reportPath)) return resolve(null);

        try {
          const raw = await fs.promises.readFile(reportPath, 'utf-8');
          resolve(JSON.parse(raw));
        } catch {
          resolve(null);
        }
      });
    });
  }

  extractFailures(report: any) {
    const failures: any[] = [];

    const walk = (suite: any) => {
      if (!suite) return;

      if (suite.tests) {
        for (const t of suite.tests) {
          if (t.outcome === 'failed') {
            const msg = (t.errors || [])
              .map((e: any) => e.message || '')
              .join('\n');

            failures.push({
              title: t.title,
              file: t.location?.file,
              error: msg
            });
          }
        }
      }

      if (suite.suites) {
        for (const s of suite.suites) walk(s);
      }
    };

    if (report?.suites) {
      for (const s of report.suites) walk(s);
    }

    return failures;
  }
}
