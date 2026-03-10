import { FlowGraph } from './ui-flow-graph';
import { Requirement } from '../rtm/rtm.model';

export class FlowRequirementGenerator {
  generate(flow: FlowGraph): Requirement[] {
    const requirements: Requirement[] = [];

    // 1. Navigation edge requirements
    flow.edges.forEach((edge, index) => {
      const descParts = [
        `User can navigate from "${edge.from}" to "${edge.to}"`
      ];

      if (edge.selector) {
        descParts.push(`by interacting with element "${edge.selector}"`);
      }

      const description = descParts.join(' ');

      requirements.push({
        id: `FLOW-NAV-${index + 1}`,
        page: edge.from,
        description,
        type: 'ui',
        source: 'UI'
      });
    });

    // 2. Entry points / dead ends
    const incomingCount: Record<string, number> = {};
    const outgoingCount: Record<string, number> = {};

    flow.pages.forEach(p => {
      incomingCount[p.url] = 0;
      outgoingCount[p.url] = 0;
    });

    flow.edges.forEach(e => {
      outgoingCount[e.from] = (outgoingCount[e.from] ?? 0) + 1;
      incomingCount[e.to] = (incomingCount[e.to] ?? 0) + 1;
    });

    const entryPoints = flow.pages.filter(p => (incomingCount[p.url] ?? 0) === 0);
    const deadEnds = flow.pages.filter(p => (outgoingCount[p.url] ?? 0) === 0);

    entryPoints.forEach((p, index) => {
      requirements.push({
        id: `FLOW-ENTRY-${index + 1}`,
        page: p.url,
        description: `Page "${p.url}" is an entry point in the application flow (no incoming navigation).`,
        type: 'ui',
        source: 'UI'
      });
    });

    deadEnds.forEach((p, index) => {
      requirements.push({
        id: `FLOW-DEAD-${index + 1}`,
        page: p.url,
        description: `Page "${p.url}" is a terminal page in the application flow (no outgoing navigation).`,
        type: 'ui',
        source: 'UI'
      });
    });

    return requirements;
  }
}
