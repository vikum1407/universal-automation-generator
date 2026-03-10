import * as fs from 'fs';
import * as path from 'path';
import { RTMDocument } from './rtm.model';

export class RTMWriter {
  write(requirements: any[], outputDir: string): void {
    if (!Array.isArray(requirements)) return;

    const normalized = this.normalize(requirements);

    const rtm: RTMDocument = {
      generatedAt: new Date().toISOString(),
      requirements: normalized as any
    };

    const filePath = path.join(outputDir, 'rtm.json');
    fs.writeFileSync(filePath, JSON.stringify(rtm, null, 2));
  }

  private normalize(requirements: any[]): any[] {
    return requirements
      .map((req: any) => ({
        id: req.id,
        page: req.page || '',
        description: req.description || '',
        selector: req.selector || '',
        type: req.type || 'unknown',
        source: req.source || 'unknown',
        tags: Array.isArray(req.tags) ? req.tags : [],
        meta: req.meta || {}
      }))
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }
}
