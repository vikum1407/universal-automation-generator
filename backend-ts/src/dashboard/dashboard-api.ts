import * as fs from 'fs';
import * as path from 'path';

import { Journey } from '../journey/journey-model';
import { JourneyCluster } from '../journey/journey-cluster-engine';
import { JourneyCoverageMap } from '../journey/journey-coverage-map';

export class DashboardApi {
  constructor(private readonly outputDir: string) {}

  private readJson<T = any>(fileName: string): T | null {
    const fullPath = path.join(this.outputDir, fileName);
    if (!fs.existsSync(fullPath)) return null;
    const raw = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(raw) as T;
  }

  getJourneys(): Journey[] {
    return this.readJson<Journey[]>('journeys.json') ?? [];
  }

  getJourneyClusters(): JourneyCluster[] {
    return this.readJson<JourneyCluster[]>('journey-clusters.json') ?? [];
  }

  getJourneyCoverage(): JourneyCoverageMap | null {
    return this.readJson<JourneyCoverageMap>('journey-coverage.json');
  }

  getHybridCoverage(): any | null {
    return this.readJson('coverage.json');
  }

  getFlowGraph(): any | null {
    return this.readJson('flow-graph.json');
  }

  getRTM(): any | null {
    return this.readJson('rtm.json');
  }

  getRiskSummary() {
    const journeys = this.getJourneys();
    const summary = { P0: 0, P1: 0, P2: 0, total: journeys.length };

    journeys.forEach(j => {
      const priority = j.risk?.priority ?? 'P2';
      if (priority === 'P0') summary.P0++;
      else if (priority === 'P1') summary.P1++;
      else summary.P2++;
    });

    return summary;
  }

  getArtifacts() {
    const files = [
      'journeys.json',
      'journeys.dot',
      'journeys.svg',
      'journey-coverage.json',
      'journey-clusters.json',
      'journey-clusters.md',
      'coverage.json',
      'coverage.svg',
      'flow-graph.json',
      'rtm.json'
    ];

    const artifacts: Record<string, { path: string; exists: boolean }> = {};

    files.forEach(f => {
      const fullPath = path.join(this.outputDir, f);
      artifacts[f] = {
        path: fullPath,
        exists: fs.existsSync(fullPath)
      };
    });

    return artifacts;
  }

  // ⭐ NEW — Serve journeys.svg content
  getJourneyGraphSvg(): string | null {
    const svgPath = path.join(this.outputDir, 'journeys.svg');
    if (!fs.existsSync(svgPath)) return null;
    return fs.readFileSync(svgPath, 'utf-8');
  }
}
