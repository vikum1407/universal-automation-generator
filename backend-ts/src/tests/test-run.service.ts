import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TestRunService {
  private baseDir = path.join(process.cwd(), 'qlitz-output');

  ensureTestRunFolder(testId: string, framework: string, language: string) {
    const testDir = path.join(this.baseDir, testId);
    const frameworkDir = path.join(testDir, 'frameworks', framework, language);

    fs.mkdirSync(frameworkDir, { recursive: true });

    return testDir;
  }

  writeMetadata(testId: string, metadata: any) {
    const metadataPath = path.join(this.baseDir, testId, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify({
      ...metadata,
      createdAt: new Date().toISOString()
    }, null, 2));
  }

  loadMetadata(testId: string) {
    const metadataPath = path.join(this.baseDir, testId, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      throw new Error(`No metadata found for testId: ${testId}`);
    }
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }
}
