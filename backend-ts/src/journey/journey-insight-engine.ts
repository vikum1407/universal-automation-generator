import { Journey } from './journey-model';
import { JourneyCoverageMap } from './journey-coverage-map';

export class JourneyInsightEngine {
  generateInsights(journeys: Journey[], coverage: JourneyCoverageMap) {
    const insights: string[] = [];

    // High-risk journeys
    const highRisk = journeys.filter(j => j.risk?.priority === 'P0');
    if (highRisk.length > 0) {
      insights.push(
        `There are ${highRisk.length} high‑risk (P0) journeys. These should be prioritized in regression cycles.`
      );
    }

    // Under-tested pages
    const lowCoveragePages = Object.entries(coverage.pages)
      .filter(([_, count]) => count <= 1)
      .map(([page]) => page);

    if (lowCoveragePages.length > 0) {
      insights.push(
        `The following pages have low coverage and may require additional flows: ${lowCoveragePages.join(', ')}.`
      );
    }

    // Over-tested pages
    const highCoveragePages = Object.entries(coverage.pages)
      .filter(([_, count]) => count >= 10)
      .map(([page]) => page);

    if (highCoveragePages.length > 0) {
      insights.push(
        `The following pages have disproportionately high coverage: ${highCoveragePages.join(', ')}. Consider reducing redundancy.`
      );
    }

    // Redundant journeys
    const redundant = journeys.filter(j => j.steps.length <= 2);
    if (redundant.length > 0) {
      insights.push(
        `${redundant.length} journeys appear structurally redundant (2 steps or fewer). These may be candidates for consolidation.`
      );
    }

    return insights;
  }
}
