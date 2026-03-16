import { HistoryRun } from './history.model';

export interface TrendPoint {
  timestamp: string;
  value: number;
}

export interface TrendAnalytics {
  coverageTrend: TrendPoint[];
  executionTrend: TrendPoint[];
  riskTrend: TrendPoint[];
  rrsTrend: TrendPoint[];
  aiEnrichmentTrend: TrendPoint[];
}

export class TrendAnalyticsEngine {
  compute(runs: HistoryRun[]): TrendAnalytics {
    return {
      coverageTrend: runs.map(r => ({
        timestamp: r.timestamp,
        value: r.analytics?.coverage?.coveragePercent || 0
      })),

      executionTrend: runs.map(r => ({
        timestamp: r.timestamp,
        value: r.analytics?.execution?.executionPercent || 0
      })),

      riskTrend: runs.map(r => ({
        timestamp: r.timestamp,
        value: r.analytics?.highRiskAreas?.length || 0
      })),

      rrsTrend: runs.map(r => ({
        timestamp: r.timestamp,
        value: r.releaseReadinessScore
      })),

      aiEnrichmentTrend: runs.map(r => ({
        timestamp: r.timestamp,
        value: r.analytics?.coverage?.aiEnrichedCount || 0
      }))
    };
  }
}
