import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

import { HistoryRun, SaveHistoryRequest } from './history.model';
import { TrendAnalyticsEngine } from './trend-analytics.engine';

@Injectable()
export class HistoryService {
  private baseDir = path.join(process.cwd(), 'history-data');

  constructor() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir);
    }
  }

  saveRun(data: SaveHistoryRequest): HistoryRun {
    const id = `run_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const rrs = this.computeRRS(data.analytics);

    const run: HistoryRun = {
      id,
      project: data.project,
      timestamp,
      rtm: data.rtm,
      execution: data.execution,
      analytics: data.analytics,
      insights: data.insights,
      releaseReadinessScore: rrs
    };

    const filePath = path.join(this.baseDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(run, null, 2));

    return run;
  }

  listRuns(project: string): HistoryRun[] {
    const files = fs.readdirSync(this.baseDir);
    const runs: HistoryRun[] = [];

    for (const file of files) {
      const full = path.join(this.baseDir, file);
      const json = JSON.parse(fs.readFileSync(full, 'utf8'));

      if (json.project === project) {
        runs.push(json);
      }
    }

    return runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  getRun(id: string): HistoryRun | null {
    const filePath = path.join(this.baseDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  computeRRS(analytics: any): number {
    if (!analytics) return 0;

    const coverage = analytics.coverage?.coveragePercent || 0;
    const execution = analytics.execution?.executionPercent || 0;
    const risks = analytics.highRiskAreas?.length || 0;

    const score =
      coverage * 0.4 +
      execution * 0.4 -
      risks * 10 * 0.2;

    return Math.max(0, Math.min(100, score));
  }

  computeTrends(project: string) {
    const runs = this.listRuns(project);
    const engine = new TrendAnalyticsEngine();
    return engine.compute(runs);
  }
}
