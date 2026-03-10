import { exec } from 'child_process';
import { promisify } from 'util';
import { Requirement } from '../rtm/rtm.model';
import { RTMExecutionDocument, TestExecutionResult } from '../rtm/rtm.execution.model';

const execAsync = promisify(exec);

export class TestRunnerService {
  async runTests(projectPath: string, requirements: Requirement[]): Promise<RTMExecutionDocument> {
    const { stdout } = await execAsync(`npx playwright test`, { cwd: projectPath });

    const results: TestExecutionResult[] = [];

    for (const req of requirements) {
      const testId = req.coveredBy?.[0];
      if (!testId) continue;

      const passed = stdout.includes(`${testId}:`);

      results.push({
        testId,
        requirementId: req.id,
        status: passed ? 'passed' : 'failed'
      });
    }

    return {
      executedAt: new Date().toISOString(),
      results
    };
  }
}
