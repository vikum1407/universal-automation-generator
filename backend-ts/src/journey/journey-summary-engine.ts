import { Journey } from './journey-model';
import { JourneyCluster } from './journey-cluster-engine';

export class JourneySummaryEngine {
  summarizeJourney(journey: Journey): string {
    const steps = journey.steps.length;
    const pages = new Set(journey.steps.map(s => s.to)).size;
    const risk = journey.risk?.priority ?? 'P2';
    const score = journey.risk?.score ?? 0;

    return `
Journey Summary:
This journey represents a ${journey.type.replace('-', ' ')} flow consisting of ${steps} steps
and covering ${pages} unique pages. It is classified as ${risk} priority with a risk score
of ${score.toFixed(2)}. The flow begins at "${journey.steps[0].from}" and concludes at
"${journey.steps[journey.steps.length - 1].to}". This journey contributes to validating
critical user navigation and ensuring functional stability across the covered transitions.
`.trim();
  }

  summarizeCluster(cluster: JourneyCluster): string {
    return `
Cluster Summary:
The "${cluster.label}" contains ${cluster.journeys.length} journeys. These flows share
structural or semantic similarities, indicating a common user intent or functional area.
This cluster helps identify concentrated risk zones, redundant coverage, and opportunities
for optimization within the application’s workflow.
`.trim();
  }

  summarizeAll(journeys: Journey[]): string {
    const total = journeys.length;
    const p0 = journeys.filter(j => j.risk?.priority === 'P0').length;
    const p1 = journeys.filter(j => j.risk?.priority === 'P1').length;
    const p2 = journeys.filter(j => j.risk?.priority === 'P2').length;

    return `
Hybrid Run Summary:
A total of ${total} journeys were generated. Of these, ${p0} are classified as P0 (high risk),
${p1} as P1 (medium risk), and ${p2} as P2 (low risk). This distribution provides a clear
overview of the system’s functional exposure and highlights areas requiring focused testing
effort during regression cycles.
`.trim();
  }
}
