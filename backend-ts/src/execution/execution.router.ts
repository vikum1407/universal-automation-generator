import { Injectable } from '@nestjs/common';
import { ExecutionEngine } from './execution.engine';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExecutionRouter {
  constructor(private readonly engine: ExecutionEngine) {}

  async auto(project: string, frameworkPath: string) {
    const isUI = this.hasPlaywright(frameworkPath);
    const isAPI = this.hasPostman(frameworkPath);

    if (isUI && !isAPI) {
      return this.engine.runFramework(project, frameworkPath);
    }

    if (isAPI && !isUI) {
      return this.engine.runAPI(project, this.findPostmanCollection(frameworkPath));
    }

    if (isUI && isAPI) {
      return this.engine.runFramework(project, frameworkPath);
    }

    throw new Error('No supported test framework detected in project.');
  }

  private hasPlaywright(dir: string): boolean {
    return fs.existsSync(path.join(dir, 'playwright.config.ts')) ||
           fs.existsSync(path.join(dir, 'playwright.config.js'));
  }

  private hasPostman(dir: string): boolean {
    return fs.readdirSync(dir).some(f => f.endsWith('.postman_collection.json'));
  }

  private findPostmanCollection(dir: string): string {
    const file = fs.readdirSync(dir).find(f => f.endsWith('.postman_collection.json'));
    if (!file) throw new Error('No Postman collection found.');
    return path.join(dir, file);
  }
}
