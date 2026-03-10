import { UIFlowGraph } from './ui-flow-detector';
import { UIRequirement } from './ui-requirement-generator';

export interface JourneyStep {
  from: string;
  to: string;
  selector: string;
  action?: string;
  requirementId?: string;
}

export interface UIJourney {
  id: string;
  title: string;
  steps: JourneyStep[];
}

export class UIJourneyGenerator {
  generate(flowGraph: UIFlowGraph, requirements: UIRequirement[]): UIJourney[] {
    if (!flowGraph || !Array.isArray(flowGraph.edges) || flowGraph.edges.length === 0) {
      return [];
    }

    const journeys: UIJourney[] = [];
    const edgesByFrom: Record<string, typeof flowGraph.edges> = {};

    for (const e of flowGraph.edges) {
      if (!edgesByFrom[e.from]) edgesByFrom[e.from] = [];
      edgesByFrom[e.from].push(e);
    }

    const visited = new Set<string>();
    let journeyIndex = 1;

    for (const start of Object.keys(edgesByFrom)) {
      const stack: JourneyStep[] = [];
      this.dfsBuildJourneys(
        start,
        edgesByFrom,
        requirements,
        stack,
        journeys,
        visited,
        () => `JOURNEY-${journeyIndex++}`,
        4 // max depth
      );
    }

    return journeys;
  }

  private dfsBuildJourneys(
    current: string,
    edgesByFrom: Record<string, any[]>,
    requirements: UIRequirement[],
    stack: JourneyStep[],
    journeys: UIJourney[],
    visited: Set<string>,
    nextId: () => string,
    maxDepth: number
  ) {
    if (stack.length > 0 && stack.length <= maxDepth) {
      const id = nextId();
      const title = this.buildJourneyTitle(stack, requirements);
      journeys.push({
        id,
        title,
        steps: [...stack]
      });
    }

    if (stack.length >= maxDepth) return;

    const edges = edgesByFrom[current] || [];
    for (const edge of edges) {
      const key = `${edge.from}->${edge.to}:${edge.selector ?? ''}`;
      if (visited.has(key)) continue;

      visited.add(key);

      const relatedReq = requirements.find(
        r =>
          r.pageUrl === edge.from &&
          (r.selector === edge.selector || r.evolvedSelector === edge.selector)
      );

      const step: JourneyStep = {
        from: edge.from,
        to: edge.to,
        selector: edge.selector || '',
        action: edge.action ?? 'navigate',
        requirementId: relatedReq?.id
      };

      stack.push(step);
      this.dfsBuildJourneys(edge.to, edgesByFrom, requirements, stack, journeys, visited, nextId, maxDepth);
      stack.pop();
    }
  }

  private buildJourneyTitle(steps: JourneyStep[], requirements: UIRequirement[]): string {
    if (steps.length === 0) return 'Empty journey';

    const first = steps[0];
    const last = steps[steps.length - 1];

    const firstReq = first.requirementId
      ? requirements.find(r => r.id === first.requirementId)
      : undefined;
    const lastReq = last.requirementId
      ? requirements.find(r => r.id === last.requirementId)
      : undefined;

    const fromLabel = firstReq?.description ?? first.from;
    const toLabel = lastReq?.description ?? last.to;

    return `Journey: ${fromLabel} → ${toLabel}`;
  }
}
