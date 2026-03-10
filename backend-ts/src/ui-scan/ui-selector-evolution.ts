import { UIScanNode } from './ui-selector-extractor';

export interface SelectorEvolutionResult {
  originalSelector: string;
  evolvedSelector: string;
  stabilityScore: number;
  improvedScore: number;
  driftProbability: number;
  confidence: number;
  reason: string;
}

export class UISelectorEvolutionEngine {
  evolve(nodes: UIScanNode[]): SelectorEvolutionResult[] {
    return nodes.map(node => this.evaluateAndEvolve(node));
  }

  private evaluateAndEvolve(node: UIScanNode): SelectorEvolutionResult {
    const original = node.selector;

    const stabilityScore = this.scoreSelector(node);
    const evolvedSelector = this.generateEvolvedSelector(node);
    const improvedScore = this.scoreSelector({ ...node, selector: evolvedSelector });

    const driftProbability = this.predictDrift(node, stabilityScore, improvedScore);

    return {
      originalSelector: original,
      evolvedSelector,
      stabilityScore,
      improvedScore,
      driftProbability,
      confidence: this.computeConfidence(stabilityScore, improvedScore),
      reason: this.explainEvolution(node, stabilityScore, improvedScore)
    };
  }

  // ------------------------------------------------------------
  // 1. Selector Stability Scoring
  // ------------------------------------------------------------
  private scoreSelector(node: UIScanNode): number {
    let score = 0;

    const sel = node.selector;

    // Strong selectors
    if (sel.startsWith('#')) score += 40;
    if (sel.startsWith('[data-testid')) score += 45;
    if (sel.startsWith('[data-test')) score += 45;
    if (sel.startsWith('[data-qa')) score += 45;

    // Semantic selectors
    if (node.semanticRole === 'primary-action') score += 20;
    if (node.componentType === 'button') score += 10;

    // Weak selectors
    if (sel.includes(':nth-child')) score -= 30;
    if (sel.includes('has-text')) score -= 10;

    // Text-based selectors are fragile
    if (node.text && node.text.length > 0) score -= 5;

    // Cap between 0–100
    return Math.max(0, Math.min(100, score));
  }

  // ------------------------------------------------------------
  // 2. Selector Evolution Logic
  // ------------------------------------------------------------
  private generateEvolvedSelector(node: UIScanNode): string {
    const attrs = node.attributes || {};

    // Prefer data-test attributes
    if (attrs['data-testid']) return `[data-testid="${attrs['data-testid']}"]`;
    if (attrs['data-test']) return `[data-test="${attrs['data-test']}"]`;
    if (attrs['data-qa']) return `[data-qa="${attrs['data-qa']}"]`;

    // If element has an ID, use it
    if (attrs['id']) return `#${attrs['id']}`;

    // Prefer role-based selectors
    if (node.role) return `${node.role}[name="${node.text || ''}"]`;

    // Prefer semantic roles
    if (node.semanticRole === 'primary-action') return `button:has-text("${node.text}")`;

    // Fallback: stable tag + attribute
    if (node.componentType === 'button') return `button:has-text("${node.text}")`;
    if (node.componentType === 'input-field') return `input[type="${attrs['type'] || 'text'}"]`;

    // Last resort: original selector
    return node.selector;
  }

  // ------------------------------------------------------------
  // 3. Drift Prediction
  // ------------------------------------------------------------
  private predictDrift(node: UIScanNode, score: number, improved: number): number {
    let drift = 1 - score / 100;

    // Text-based selectors drift more
    if (node.selector.includes('has-text')) drift += 0.15;

    // nth-child selectors drift heavily
    if (node.selector.includes('nth-child')) drift += 0.25;

    // Data-test selectors drift very little
    if (node.selector.includes('data-test')) drift -= 0.3;

    return Math.max(0, Math.min(1, drift));
  }

  // ------------------------------------------------------------
  // 4. Confidence Score
  // ------------------------------------------------------------
  private computeConfidence(score: number, improved: number): number {
    const delta = improved - score;
    if (delta <= 0) return 0.4;
    if (delta < 20) return 0.6;
    if (delta < 40) return 0.8;
    return 0.95;
  }

  // ------------------------------------------------------------
  // 5. Explanation
  // ------------------------------------------------------------
  private explainEvolution(node: UIScanNode, score: number, improved: number): string {
    if (improved > score) {
      return `Selector improved from ${score} → ${improved} due to more stable attributes or semantic meaning.`;
    }
    return `Selector kept original form; no more stable alternative found.`;
  }
}
