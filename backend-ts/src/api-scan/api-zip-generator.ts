import * as archiver from 'archiver';
import * as fs from 'fs';

export class APIZipGenerator {
  async zipFolder(sourceFolder: string, zipPath: string): Promise<void> {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(sourceFolder, false);
    await archive.finalize();
  }
}
