import { UIFlowGraph } from './ui-flow-detector';
import { UIScanNode } from './ui-selector-extractor';
import { UISelectorEvolutionEngine, SelectorEvolutionResult } from './ui-selector-evolution';

export interface UIRequirement {
  id: string;
  description: string;

  selector: string;               // REQUIRED
  evolvedSelector?: string;

  stabilityScore?: number;
  improvedScore?: number;
  driftProbability?: number;
  evolutionConfidence?: number;
  evolutionReason?: string;

  pageUrl: string;
  page: string;                   // REQUIRED
  type: string;                   // REQUIRED

  action?: string;
}

export class UIRequirementGenerator {
  private evolution = new UISelectorEvolutionEngine();

  generate(nodes: UIScanNode[]): UIRequirement[] {
    const evolutionResults = this.evolution.evolve(nodes);

    return nodes.map((n, i) => {
      const evo: SelectorEvolutionResult = evolutionResults[i];
      const actionDesc = this.describeAction(n);

      return {
        id: `UI-${i + 1}`,
        description: actionDesc,

        selector: n.selector,                 // REQUIRED
        evolvedSelector: evo.evolvedSelector,

        stabilityScore: evo.stabilityScore,
        improvedScore: evo.improvedScore,
        driftProbability: evo.driftProbability,
        evolutionConfidence: evo.confidence,
        evolutionReason: evo.reason,

        pageUrl: n.pageUrl,
        page: n.pageUrl,                      // REQUIRED
        type: 'ui',                           // REQUIRED

        action: n.action
      };
    });
  }

  private describeAction(n: UIScanNode): string {
    const text = n.text?.trim() || '';
    const action = n.action || 'interact';

    switch (action) {
      case 'login': return `User can log in by interacting with "${text || n.selector}"`;
      case 'submit': return `User can submit a form using "${text || n.selector}"`;
      case 'add-to-cart': return `User can add an item to cart using "${text || n.selector}"`;
      case 'checkout': return `User can proceed to checkout using "${text || n.selector}"`;
      case 'open-product': return `User can open product details via "${text || n.selector}"`;
      case 'open-cart': return `User can navigate to cart via "${text || n.selector}"`;
      case 'open-inventory': return `User can navigate to inventory via "${text || n.selector}"`;
      case 'input-password': return `User can enter a password into "${text || n.selector}"`;
      case 'input-email': return `User can enter an email into "${text || n.selector}"`;
      case 'input-search': return `User can search using "${text || n.selector}"`;
      case 'input': return `User can type into "${text || n.selector}"`;
      case 'select': return `User can select an option using "${text || n.selector}"`;
      case 'navigate': return `User can navigate using link "${text || n.selector}"`;
      case 'click': return `User can click "${text || n.selector}"`;
      default: return `User can interact with "${text || n.selector}"`;
    }
  }

  generateFromFlows(flowGraph: UIFlowGraph): UIRequirement[] {
    const reqs: UIRequirement[] = [];

    flowGraph.edges.forEach((edge, i) => {
      reqs.push({
        id: `FLOW-${i + 1}`,
        description: `Navigate from ${edge.from} to ${edge.to} using "${edge.selector}"`,

        selector: edge.selector || '',        // REQUIRED
        evolvedSelector: edge.selector,

        stabilityScore: 70,
        improvedScore: 70,
        driftProbability: 0.2,
        evolutionConfidence: 0.5,
        evolutionReason: 'Flow-based selectors evolve in Phase 12.',

        pageUrl: edge.from,
        page: edge.from,                      // REQUIRED
        type: 'ui',                           // REQUIRED

        action: 'navigate'
      });
    });

    return reqs;
  }
}
