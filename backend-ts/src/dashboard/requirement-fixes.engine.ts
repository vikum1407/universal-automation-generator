// backend-ts/src/dashboard/requirement-fixes.engine.ts
import { Injectable } from '@nestjs/common';
import { Requirement } from './requirement-risk.engine';
import { RequirementPattern } from './requirement-patterns.engine';

export interface RequirementFixSuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

@Injectable()
export class RequirementFixesEngine {
  generateSuggestions(
    requirement: Requirement,
    patterns: RequirementPattern,
  ): RequirementFixSuggestion[] {
    const suggestions: RequirementFixSuggestion[] = [];

    const hasCoverage =
      Array.isArray(requirement.coveredBy) && requirement.coveredBy.length > 0;

    if (!hasCoverage) {
      suggestions.push({
        title: 'Add test coverage for this requirement',
        description:
          'This requirement has no associated test cases. Add at least one automated test to cover its core behavior.',
        priority: 'high',
      });
    }

    if (patterns.recurringFailures) {
      suggestions.push({
        title: 'Investigate recurring failures',
        description:
          'This requirement has failed multiple times across runs. Review logs, assertions, and dependencies to identify root causes.',
        priority: 'high',
      });
    }

    if (patterns.longUncovered && hasCoverage) {
      suggestions.push({
        title: 'Ensure tests are executed regularly',
        description:
          'This requirement has test coverage but is often not executed. Integrate its tests into your main CI pipeline.',
        priority: 'medium',
      });
    }

    if (requirement.type === 'api') {
      suggestions.push({
        title: 'Harden API validation and error handling',
        description:
          'For API requirements, ensure input validation, clear error responses, and retry logic where appropriate.',
        priority: 'medium',
      });
    }

    if (requirement.type === 'ui') {
      suggestions.push({
        title: 'Stabilize UI selectors and flows',
        description:
          'For UI requirements, use robust selectors, avoid brittle timing assumptions, and cover critical user paths.',
        priority: 'medium',
      });
    }

    if (
      requirement.aiLogic &&
      ((requirement.aiLogic.steps?.length ?? 0) > 0 ||
        (requirement.aiLogic.assertions?.length ?? 0) > 0)
    ) {
      suggestions.push({
        title: 'Review AI‑generated logic',
        description:
          'This requirement includes AI‑generated steps or assertions. Review and refine them to match real user behavior and system constraints.',
        priority: 'low',
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Monitor this requirement',
        description:
          'This requirement appears stable. Continue monitoring its history and risk trends over time.',
        priority: 'low',
      });
    }

    return suggestions;
  }
}
