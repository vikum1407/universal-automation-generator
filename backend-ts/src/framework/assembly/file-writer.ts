import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import type { GeneratedFile } from '../templates/template-engine';

@Injectable()
export class FileWriter {
  writeAll(projectRoot: string, files: GeneratedFile[]): void {
    for (const file of files) {
      const abs = path.join(projectRoot, file.path);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, file.content, 'utf-8');
    }
  }
}
