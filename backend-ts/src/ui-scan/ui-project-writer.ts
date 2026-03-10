import * as fs from 'fs';
import * as path from 'path';

export class UIProjectWriter {
  constructor(private basePath: string) {}

  ensureDir(dir: string) {
    const full = path.join(this.basePath, dir);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
  }

  writeFile(relativePath: string, content: string) {
    const full = path.join(this.basePath, relativePath);
    fs.writeFileSync(full, content, 'utf8');
  }
}
