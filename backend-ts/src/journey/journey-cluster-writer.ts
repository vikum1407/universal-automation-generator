import * as fs from 'fs';
import * as path from 'path';
import { JourneyCluster } from './journey-cluster-engine';

export class JourneyClusterWriter {
  write(clusters: JourneyCluster[], outputDir: string) {
    const jsonPath = path.join(outputDir, 'journey-clusters.json');
    const mdPath = path.join(outputDir, 'journey-clusters.md');

    fs.writeFileSync(jsonPath, JSON.stringify(clusters, null, 2));

    const md = clusters
      .map(c => {
        const list = c.journeys.map(j => `- ${j.id}: ${j.title}`).join('\n');
        return `## ${c.label}\n${list}\n`;
      })
      .join('\n');

    fs.writeFileSync(mdPath, md);

    return { jsonPath, mdPath };
  }
}
