import * as path from 'path';
import * as fs from 'fs';
import { APIProjectWriter } from './api-project-writer';
import { APITestGenerator } from './api-test-generator';
import { APIZipGenerator } from './api-zip-generator';
import { Requirement } from '../rtm/rtm.model';

export class APIFrameworkGenerator {
  async generateFramework(requirements: Requirement[]) {
    const basePath = path.join(process.cwd(), 'generated-api-project');

    if (fs.existsSync(basePath)) fs.rmSync(basePath, { recursive: true });
    fs.mkdirSync(basePath);

    const writer = new APIProjectWriter(basePath);
    const testGen = new APITestGenerator();

    writer.ensureDir('tests');
    writer.ensureDir('helpers');
    writer.ensureDir('config');

    for (const req of requirements) {
      const testName = req.description.replace(/[^a-zA-Z0-9]/g, '_');
      const testContent = testGen.generate(req);
      writer.writeFile(`tests/${testName}.spec.ts`, testContent);
    }

    writer.writeFile(
      'helpers/api-client.ts',
      `
import { request } from '@playwright/test';

export async function api() {
  return await request.newContext({
    baseURL: process.env.API_BASE_URL
  });
}
`
    );

    writer.writeFile(
      'config/api.config.ts',
      `
export const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL
};
`
    );

    writer.writeFile(
      'package.json',
      `{
  "name": "qlitz-api-project",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test"
  }
}`
    );

    const zipPath = path.join(process.cwd(), 'api-project.zip');
    const zipper = new APIZipGenerator();
    await zipper.zipFolder(basePath, zipPath);

    return zipPath;
  }
}
