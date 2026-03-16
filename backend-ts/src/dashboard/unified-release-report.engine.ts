import { Injectable } from '@nestjs/common';
import { HistoryRun } from '../history/history.model';
import { ReleaseIntelligenceEngine } from './release-intelligence.engine';
import { ReleaseNotesEngine } from './release-notes.engine';
import { QualityGatesEngine } from './quality-gates.engine';
import { ReleaseTimelineEngine } from './release-timeline.engine';

@Injectable()
export class UnifiedReleaseReportEngine {
  constructor(
    private readonly intel: ReleaseIntelligenceEngine,
    private readonly notes: ReleaseNotesEngine,
    private readonly gates: QualityGatesEngine,
    private readonly timeline: ReleaseTimelineEngine
  ) {}

  generate(latest: HistoryRun, previous: HistoryRun | undefined, allRuns: HistoryRun[]) {
    return {
      project: latest.project,
      timestamp: latest.timestamp,

      intelligence: this.intel.compute(latest, previous),
      notes: this.notes.generate(latest, previous),
      qualityGate: this.gates.evaluate(latest),
      timeline: this.timeline.buildTimeline(allRuns),

      latestRun: {
        coverage: latest.analytics.coverage.coveragePercent,
        execution: latest.analytics.execution.executionPercent,
        risks: latest.analytics.highRiskAreas.length,
        rrs: latest.releaseReadinessScore
      }
    };
  }
}
