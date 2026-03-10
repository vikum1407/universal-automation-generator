import * as fs from 'fs';
import * as path from 'path';

export class OrchestratorLoader {
  async loadAll(context: any) {
    context.pipelineMemory = await this.loadJSON(context.outputDir, 'evolution.json');
    context.existingReinforcement = await this.loadJSON(context.outputDir, 'reinforcement.json');
    context.existingRegression = await this.loadJSON(context.outputDir, 'regression.json');
    context.existingRootCause = await this.loadJSON(context.outputDir, 'rootcause.json');
  }

  private async loadJSON(dir: string, file: string) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) return undefined;

    try {
      const raw = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
}
