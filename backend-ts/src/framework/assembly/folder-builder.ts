import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FolderBuilder {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'tmp', 'qlitz-frameworks');
  }

  createProjectRoot(jobId: string): string {
    const projectPath = path.join(this.baseDir, jobId);
    fs.mkdirSync(projectPath, { recursive: true });
    return projectPath;
  }

  getZipPath(jobId: string): string {
    return path.join(this.baseDir, `${jobId}.zip`);
  }

  getProjectPath(jobId: string): string {
    return path.join(this.baseDir, jobId);
  }

  exists(jobId: string): boolean {
    return fs.existsSync(this.getZipPath(jobId));
  }
}
