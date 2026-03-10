import * as fs from 'fs';
import * as path from 'path';

interface RequirementLike {
  id: string;
  page: string;
  description: string;
  method: string;
  spec: any;
  tags?: string[];
}

export class APITestWriter {
  writeTests(requirements: any, outputDir: string) {
    if (!Array.isArray(requirements) || requirements.length === 0) return;

    const testsRoot = path.join(outputDir, 'tests');
    if (!fs.existsSync(testsRoot)) fs.mkdirSync(testsRoot, { recursive: true });

    const byTag: Record<string, RequirementLike[]> = {};

    for (const req of requirements) {
      const tags = req.tags && req.tags.length ? req.tags : ['untagged'];
      for (const tag of tags) {
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push(req);
      }
    }

    for (const tag of Object.keys(byTag)) {
      const dir = path.join(testsRoot, tag);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      for (const req of byTag[tag]) {
        const fileName = `${req.id}.spec.ts`;
        const filePath = path.join(dir, fileName);
        const content = this.buildTestFile(req);
        fs.writeFileSync(filePath, content.trim() + '\n');
      }
    }
  }

  private buildTestFile(req: RequirementLike): string {
    const method = req.method.toLowerCase();
    const pathLiteral = req.page;

    const responses = req.spec?.responses || {};
    const statusCodes = Object.keys(responses);
    const primaryStatus = statusCodes.find((c) => c.startsWith('2')) || statusCodes[0] || '200';

    const hasJsonResponse =
      responses[primaryStatus]?.schema ||
      responses[primaryStatus]?.content?.['application/json'];

    const bodyAssertion = hasJsonResponse
      ? `
  const body = await response.json();
  expect(body).toBeDefined();
`
      : '';

    return `
import { test, expect } from '@playwright/test';

test('${this.escape(req.description)}', async ({ request }) => {
  const response = await request.${method}('${this.escape(pathLiteral)}');
  expect(response.status()).toBe(${primaryStatus});
  ${bodyAssertion.trim()}
});
`;
  }

  private escape(value: string): string {
    return value.replace(/'/g, "\\'");
  }
}
