import * as fs from 'fs';
import * as path from 'path';

export class OrchestratorSaver {
  async saveAll(
    outputDir: string,
    reinforcement: any,
    regression: any,
    rootCause: any,
    pipeline: any,
    optimization: any
  ) {
    await this.save(outputDir, 'reinforcement.json', reinforcement);
    await this.save(outputDir, 'regression.json', regression);
    await this.save(outputDir, 'rootcause.json', rootCause);
    await this.save(outputDir, 'evolution.json', pipeline);
    await this.save(outputDir, 'optimization.json', optimization);
  }

  private async save(dir: string, file: string, data: any) {
    const filePath = path.join(dir, file);
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
