import { UIFlowGraph } from "./ui-flow-detector";
import { UIScanNode } from "./ui-selector-extractor";
import {
  UISelectorEvolutionEngine,
  SelectorEvolutionResult
} from "./ui-selector-evolution";

import { UIPageClassifier } from "./ui-page-classifier";
import { UIComponentSemanticEngine } from "./ui-component-semantic-engine";
import { UIFlowSemanticEngine } from "./ui-flow-semantic-engine";
import { UIRequirementSynthesizer } from "./ui-requirement-synthesizer";

import type { Requirement } from "../rtm/rtm.model";

export interface UIRequirement {
  id: string;
  description: string;

  selector: string;
  evolvedSelector?: string;

  stabilityScore?: number;
  improvedScore?: number;
  driftProbability?: number;
  evolutionConfidence?: number;
  evolutionReason?: string;

  pageUrl: string;
  page: string;
  type: string;

  action?: string;

  tags?: string[];
}

export class UIRequirementGenerator {
  private evolution = new UISelectorEvolutionEngine();

  private pageClassifier = new UIPageClassifier();
  private componentSemantic = new UIComponentSemanticEngine();
  private flowSemantic = new UIFlowSemanticEngine();
  private synthesizer = new UIRequirementSynthesizer();

  // ---------------------------------------------------------
  // RAW → UI REQUIREMENTS (technical)
  // ---------------------------------------------------------
  generate(nodes: UIScanNode[]): UIRequirement[] {
    const evolutionResults = this.evolution.evolve(nodes);
    const grouped = this.groupByPage(nodes);

    const finalReqs: UIRequirement[] = [];
    let counter = 1;

    for (const pageUrl of Object.keys(grouped)) {
      const pageNodes = grouped[pageUrl];

      const combinedText = pageNodes.map(n => n.text || "").join(" ");
      const pageType = this.pageClassifier.classify(pageUrl, combinedText);

      pageNodes.forEach((n, idx) => {
        const evo: SelectorEvolutionResult = evolutionResults[counter - 1];

        const component = this.componentSemantic.interpret(
          n.componentType,
          n.semanticRole,
          n.action,
          n.text
        );

        const semantic = this.synthesizer.synthesizeFromComponent(pageType, component, {
          selector: n.selector,
          action: n.action,
          componentType: n.componentType,
          semanticRole: n.semanticRole
        });

        finalReqs.push({
          id: `UI-${counter}`,
          description: semantic.description,

          selector: n.selector,
          evolvedSelector: evo.evolvedSelector,

          stabilityScore: evo.stabilityScore,
          improvedScore: evo.improvedScore,
          driftProbability: evo.driftProbability,
          evolutionConfidence: evo.confidence,
          evolutionReason: evo.reason,

          pageUrl: n.pageUrl,
          page: n.pageUrl,
          type: "ui",

          action: n.action,

          tags: semantic.tags
        });

        counter++;
      });
    }

    return finalReqs;
  }

  // ---------------------------------------------------------
  // RAW FLOW GRAPH → UI REQUIREMENTS (technical)
  // ---------------------------------------------------------
  generateFromFlows(flowGraph: UIFlowGraph): UIRequirement[] {
    const flowSemantics = this.flowSemantic.interpret(flowGraph);

    return flowSemantics.map((flow, i) => {
      const semantic = this.synthesizer.synthesizeFromFlow(flow);

      return {
        id: `FLOW-${i + 1}`,
        description: semantic.description,

        selector: "",
        evolvedSelector: "",

        stabilityScore: 70,
        improvedScore: 70,
        driftProbability: 0.2,
        evolutionConfidence: 0.5,
        evolutionReason: "Flow-based selectors evolve in Phase 12.",

        pageUrl: "",
        page: "",
        type: "ui",

        action: "navigate",

        tags: semantic.tags
      };
    });
  }

  // ---------------------------------------------------------
  // UI REQUIREMENTS → SEMANTIC RTM REQUIREMENTS
  // ---------------------------------------------------------
  toSemanticRequirements(uiReqs: UIRequirement[]): Requirement[] {
    return uiReqs.map(r => {
      const pageName = this.extractPageName(r.pageUrl);

      return {
        id: r.id,

        title: this.buildTitle(r, pageName),
        description: r.description,

        type: "ui",

        source: {
          pageName
        },

        tags: r.tags || [],
        businessPriority: "medium",
        riskLevel: "medium",

        coveredBy: [],

        aiLogic: {
          steps: [],
          assertions: [],
          negativeTests: []
        }
      };
    });
  }

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------
  private extractPageName(url: string): string {
    if (!url) return "Unknown Page";
    try {
      const u = new URL(url.split("#")[0]);
      if (u.pathname === "/" || u.pathname === "") return "Home";
      return u.pathname.replace("/", "") || "Page";
    } catch {
      return url;
    }
  }

  private buildTitle(r: UIRequirement, pageName: string): string {
    if (!r.action || r.action.toLowerCase() === "navigate") {
      return `User can navigate on ${pageName}`;
    }
    return `User can ${r.action} on ${pageName}`;
  }

  private groupByPage(nodes: UIScanNode[]): Record<string, UIScanNode[]> {
    const map: Record<string, UIScanNode[]> = {};
    nodes.forEach(n => {
      if (!map[n.pageUrl]) map[n.pageUrl] = [];
      map[n.pageUrl].push(n);
    });
    return map;
  }
}
