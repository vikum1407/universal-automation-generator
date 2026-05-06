import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

export interface TemplateFile {
  path: string;
  content: string;
}

@Injectable()
export class TemplateLoader {
  private readonly templatesRoot: string;

  constructor() {
    const fromCwd      = path.join(process.cwd(), 'templates');
    const fromDist     = path.join(__dirname, '..', '..', '..', '..', 'templates');
    this.templatesRoot = fs.existsSync(fromCwd) ? fromCwd : fromDist;
  }

  loadDirectory(templateDir: string): TemplateFile[] {
    const absDir = path.join(this.templatesRoot, templateDir);
    if (!fs.existsSync(absDir)) return [];
    return this.walk(absDir, absDir);
  }

  private walk(root: string, dir: string): TemplateFile[] {
    const files: TemplateFile[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.walk(root, full));
      } else {
        files.push({
          path:    path.relative(root, full).replace(/\\/g, '/'),
          content: fs.readFileSync(full, 'utf-8'),
        });
      }
    }
    return files;
  }
}
