import * as fs from 'fs';
import { Injectable } from '@nestjs/common';

// archiver is a CJS module — require() is the only safe interop without esModuleInterop
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiverFactory: (...args: any[]) => any = require('archiver');

@Injectable()
export class ZipGenerator {
  async zip(sourceDir: string, outPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const output  = fs.createWriteStream(outPath);
      const archive = archiverFactory('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve(outPath));
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }
}
