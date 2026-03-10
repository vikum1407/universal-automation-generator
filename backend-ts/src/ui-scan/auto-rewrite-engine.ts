import { UIRequirement } from './ui-requirement-generator';

export interface SelectorHistoryEntry {
  value: string;
  reason?: string;
  confidence?: number;
  timestamp: string;
}

export interface UIRequirementWithHistory extends UIRequirement {
  selectorHistory?: SelectorHistoryEntry[];
}

export interface SelectorRewriteRecord {
  requirementId: string;
  oldSelector: string;
  newSelector: string;
  reason: string;
  confidence: number;
  timestamp: string;
}

export class AutoRewriteEngine {
  rewrite(requirements: UIRequirement[]): {
    updatedRequirements: UIRequirementWithHistory[];
    rewrites: SelectorRewriteRecord[];
  } {
    const updated: UIRequirementWithHistory[] = [];
    const rewrites: SelectorRewriteRecord[] = [];
    const now = new Date().toISOString();

    for (const req of requirements) {
      const shouldRewrite =
        !!req.evolvedSelector &&
        req.evolvedSelector !== req.selector &&
        (req.evolutionConfidence ?? 0) >= 0.7 &&
        (req.improvedScore ?? 0) > (req.stabilityScore ?? 0);

      if (!shouldRewrite) {
        updated.push({ ...req });
        continue;
      }

      const oldSelector = req.selector;
      const newSelector = req.evolvedSelector!;

      const historyEntry: SelectorHistoryEntry = {
        value: oldSelector,
        reason: req.evolutionReason ?? 'Auto-rewrite based on selector evolution.',
        confidence: req.evolutionConfidence ?? 0,
        timestamp: now
      };

      const existingHistory = (req as UIRequirementWithHistory).selectorHistory ?? [];

      const rewritten: UIRequirementWithHistory = {
        ...req,
        selector: newSelector,
        selectorHistory: [...existingHistory, historyEntry]
      };

      rewrites.push({
        requirementId: req.id,
        oldSelector,
        newSelector,
        reason: historyEntry.reason!,
        confidence: historyEntry.confidence!,
        timestamp: now
      });

      updated.push(rewritten);
    }

    return { updatedRequirements: updated, rewrites };
  }
}
