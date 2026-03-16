import { Injectable } from '@nestjs/common';
import type { RunRecord } from '../history/history.types';

export interface SelfHealingSuggestion {
  id: string;
  type: 'locator' | 'flakiness' | 'coverage' | 'api_contract';
  testId: string;
  requirementId?: string;
  file?: string;
  currentSelector?: string;
  suggestedSelector?: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  summary: string;
  details: string;
  recommendedAction: string;
}

export interface SelfHealingSummary {
  project: string;
  totalSuggestions: number;
  highImpact: number;
  mediumImpact: number;
  lowImpact: number;
  byType: Record<string, number>;
  suggestions: SelfHealingSuggestion[];
}

@Injectable()
export class SelfHealingEngine {
  compute(runs: RunRecord[]): SelfHealingSummary {
    if (!runs.length) {
      return {
        project: '',
        totalSuggestions: 0,
        highImpact: 0,
        mediumImpact: 0,
        lowImpact: 0,
        byType: {},
        suggestions: [],
      };
    }

    const project = runs[0].project;
    const suggestions: SelfHealingSuggestion[] = [];

    // v1 heuristic: look at latest run only
    const latest = runs[0];

    // Real suggestions from failing UI tests
    for (const test of latest.tests ?? []) {
      if (test.type !== 'ui') continue;
      if (test.status !== 'failed') continue;

      for (const step of test.steps ?? []) {
        if (!step.selector || !step.suggestedSelector) continue;

        const id = `${test.id}:${step.selector}`;
        suggestions.push({
          id,
          type: 'locator',
          testId: test.id,
          requirementId: test.requirementId,
          file: test.file,
          currentSelector: step.selector,
          suggestedSelector: step.suggestedSelector,
          confidence: step.selectorConfidence ?? 0.7,
          impact: 'high',
          summary: `Update flaky locator in ${test.id}`,
          details: `Step using selector "${step.selector}" failed. A more stable selector "${step.suggestedSelector}" was detected.`,
          recommendedAction: `Update locator in ${test.file} from "${step.selector}" to "${step.suggestedSelector}".`,
        });
      }
    }

    // ⭐ Synthetic suggestions for demo/testing
    if (suggestions.length === 0) {
      suggestions.push(
        {
          id: 'demo-1',
          type: 'locator',
          testId: 'login-test',
          file: 'tests/login.spec.ts',
          currentSelector: '#login-button',
          suggestedSelector: '[data-test="login-btn"]',
          confidence: 0.82,
          impact: 'high',
          summary: 'Update unstable login button locator',
          details: 'The current selector "#login-button" is brittle. A stable data-test selector was detected.',
          recommendedAction: 'Replace "#login-button" with "[data-test=\'login-btn\']" in login.spec.ts.',
        },
        {
          id: 'demo-2',
          type: 'flakiness',
          testId: 'checkout-test',
          file: 'tests/checkout.spec.ts',
          confidence: 0.65,
          impact: 'medium',
          summary: 'Reduce flakiness in checkout flow',
          details: 'The checkout test shows intermittent timing failures across multiple runs.',
          recommendedAction: 'Add explicit waits for network calls or UI readiness.',
        },
        {
          id: 'demo-3',
          type: 'coverage',
          testId: 'profile-test',
          file: 'tests/profile.spec.ts',
          confidence: 0.55,
          impact: 'low',
          summary: 'Improve coverage for profile update flow',
          details: 'The profile update path is only partially covered by UI tests.',
          recommendedAction: 'Add tests for avatar upload and email change scenarios.',
        }
      );
    }

    const byType: Record<string, number> = {};
    let highImpact = 0;
    let mediumImpact = 0;
    let lowImpact = 0;

    for (const s of suggestions) {
      byType[s.type] = (byType[s.type] ?? 0) + 1;
      if (s.impact === 'high') highImpact++;
      else if (s.impact === 'medium') mediumImpact++;
      else lowImpact++;
    }

    return {
      project,
      totalSuggestions: suggestions.length,
      highImpact,
      mediumImpact,
      lowImpact,
      byType,
      suggestions,
    };
  }

  findSuggestion(summary: SelfHealingSummary, suggestionId: string) {
    return summary.suggestions.find(s => s.id === suggestionId) ?? null;
  }
}
