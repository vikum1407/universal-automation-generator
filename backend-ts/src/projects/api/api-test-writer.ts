import * as fs from 'fs';
import * as path from 'path';

export class APITestWriter {
  writeTests(projectPath: string, tests: { name: string; content: string }[]) {
    const testsRoot = path.join(projectPath, 'tests');

    if (!fs.existsSync(testsRoot)) {
      fs.mkdirSync(testsRoot, { recursive: true });
    }

    for (const t of tests) {
      const filePath = path.join(testsRoot, `${t.name}.spec.ts`);
      fs.writeFileSync(filePath, t.content.trim() + '\n', 'utf8');
    }
  }
}
