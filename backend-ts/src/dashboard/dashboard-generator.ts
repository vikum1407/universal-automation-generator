import * as fs from 'fs';
import * as path from 'path';
import { DashboardApi } from './dashboard-api';

export function createDashboardApi(outputDir: string) {
  const api = new DashboardApi(outputDir);

  return {
    journeys: () => api.getJourneys(),
    journeyClusters: () => api.getJourneyClusters(),
    journeyCoverage: () => api.getJourneyCoverage(),
    hybridCoverage: () => api.getHybridCoverage(),
    flowGraph: () => api.getFlowGraph(),
    rtm: () => api.getRTM(),
    riskSummary: () => api.getRiskSummary(),
    artifacts: () => api.getArtifacts(),

    // ⭐ NEW — Journey Graph SVG
    journeyGraph: () => api.getJourneyGraphSvg()
  };
}
