import type { DomSnapshotEvent } from "@/engine/flow/FlowCaptureEvent";
import type { LearningState } from "@/engine/LearningEngine";

export interface SelectorCandidate {
  selector: string;
  score: number;
  reasons: string[];
}

export interface SelectorAnalysis {
  best: SelectorCandidate | null;
  candidates: SelectorCandidate[];
}

/**
 * Extracts and ranks selector candidates from a DOM snapshot.
 */
export function analyzeSelectors(
  snapshot: DomSnapshotEvent,
  learning: LearningState
): SelectorAnalysis {
  const candidates = extractCandidates(snapshot);
  const scored = scoreCandidates(candidates, snapshot, learning);

  scored.sort((a, b) => b.score - a.score);

  return {
    best: scored[0] ?? null,
    candidates: scored,
  };
}

function extractCandidates(snapshot: DomSnapshotEvent): string[] {
  const { attributes, text, selector } = snapshot;
  const candidates: string[] = [];

  if (attributes["data-testid"]) {
    candidates.push(`[data-testid="${attributes["data-testid"]}"]`);
  }

  if (attributes.id) {
    candidates.push(`#${attributes.id}`);
  }

  if (attributes.class) {
    const classList = attributes.class.split(" ").filter(Boolean);
    if (classList.length > 0) {
      candidates.push("." + classList.join("."));
    }
  }

  if (text && text.length < 50) {
    candidates.push(`text="${text.trim()}"`);
  }

  candidates.push(selector);

  return [...new Set(candidates)];
}

function scoreCandidates(
  selectors: string[],
  snapshot: DomSnapshotEvent,
  learning: LearningState
): SelectorCandidate[] {
  return selectors.map((sel) => {
    let score = 0;
    const reasons: string[] = [];

    if (sel.includes("data-testid")) {
      score += 50;
      reasons.push("Stable data-testid attribute");
    }

    if (sel.startsWith("#")) {
      score += 40;
      reasons.push("ID selector");
    }

    if (sel.includes(".")) {
      score += 20;
      reasons.push("Class-based selector");
    }

    if (sel.includes("text=")) {
      score += 15;
      reasons.push("Text-based selector");
    }

    const volatility = snapshot.selector.split(">").length;
    score -= volatility * 2;
    reasons.push(`DOM depth penalty: ${volatility}`);

    const flakyScore = learning.flakyCounts[snapshot.selector] ?? 0;
    score -= flakyScore * 5;
    if (flakyScore > 0) {
      reasons.push("Selector appears in flaky tests");
    }

    return { selector: sel, score, reasons };
  });
}
