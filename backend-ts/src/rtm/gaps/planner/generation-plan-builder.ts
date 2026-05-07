import type { RequirementGap } from '../entities/requirement-gap.entity';
import type { EndpointGap }    from '../entities/endpoint-gap.entity';
import type { JourneyGap }     from '../entities/journey-gap.entity';

export interface GenerationTask {
  type:           'ui' | 'api' | 'hybrid';
  target:         'requirement' | 'endpoint' | 'journey';
  targetId:       string;
  targetKey:      string;
  suggestedCount: number;
  reason:         string;
  priority:       'must' | 'should' | 'optional';
}

export interface GenerationPlan {
  projectId:    string;
  rtmVersionId: string;
  generatedAt:  string;
  tasks:        GenerationTask[];
  summary: {
    must:     number;
    should:   number;
    optional: number;
    total:    number;
  };
}

export function buildGenerationPlan(
  projectId:    string,
  rtmVersionId: string,
  reqGaps:      RequirementGap[],
  epGaps:       EndpointGap[],
  jGaps:        JourneyGap[],
): GenerationPlan {
  const tasks: GenerationTask[] = [];

  // ── Requirements ─────────────────────────────────────────────────────────────
  for (const gap of reqGaps) {
    const key  = gap.requirementKey  ?? gap.requirementId;
    const isHighRisk = gap.risk === 'high' || gap.risk === 'critical';
    const planPriority = gap.hasNoTests ? 'must'
      : isHighRisk       ? 'must'
      : gap.risk === 'medium' ? 'should' : 'optional';

    if (gap.missingUITests && gap.suggestedUITests > 0) {
      tasks.push({
        type:           'ui',
        target:         'requirement',
        targetId:       gap.requirementId,
        targetKey:      key,
        suggestedCount: gap.suggestedUITests,
        reason:         gap.hasNoTests ? 'noTests' : 'missingUITests',
        priority:       planPriority,
      });
    }

    if (gap.missingAPITests && gap.suggestedAPITests > 0) {
      tasks.push({
        type:           'api',
        target:         'requirement',
        targetId:       gap.requirementId,
        targetKey:      key,
        suggestedCount: gap.suggestedAPITests,
        reason:         gap.hasNoTests ? 'noTests' : 'missingAPITests',
        priority:       planPriority,
      });
    }

    if (gap.missingHybridTests && gap.suggestedHybridTests > 0) {
      tasks.push({
        type:           'hybrid',
        target:         'requirement',
        targetId:       gap.requirementId,
        targetKey:      key,
        suggestedCount: gap.suggestedHybridTests,
        reason:         gap.hasNoTests ? 'noTests' : 'missingHybridTests',
        priority:       planPriority,
      });
    }

    // Depth gaps — add extra tasks if no dimension gap was already planned
    if (!gap.missingUITests && !gap.missingAPITests && gap.hasInsufficientTests) {
      if (gap.missingNegativeTests) {
        tasks.push({
          type: 'api', target: 'requirement',
          targetId: gap.requirementId, targetKey: key,
          suggestedCount: 1,
          reason: 'missingNegativeTests',
          priority: isHighRisk ? 'must' : 'should',
        });
      }
      if (gap.missingBoundaryTests) {
        tasks.push({
          type: 'ui', target: 'requirement',
          targetId: gap.requirementId, targetKey: key,
          suggestedCount: 1,
          reason: 'missingBoundaryTests',
          priority: isHighRisk ? 'should' : 'optional',
        });
      }
    }
  }

  // ── Endpoints ─────────────────────────────────────────────────────────────────
  for (const gap of epGaps) {
    const key = gap.endpointKey ?? `${gap.method ?? 'API'}-${gap.endpointId.slice(0, 8)}`;

    if (gap.hasNoTests) {
      tasks.push({
        type: 'api', target: 'endpoint',
        targetId: gap.endpointId, targetKey: key,
        suggestedCount: 2,
        reason: 'noTests',
        priority: 'must',
      });
      continue;
    }
    if (gap.missingPositiveTests) {
      tasks.push({ type: 'api', target: 'endpoint', targetId: gap.endpointId, targetKey: key, suggestedCount: 1, reason: 'missingPositiveTests', priority: 'must' });
    }
    if (gap.missingNegativeTests) {
      tasks.push({ type: 'api', target: 'endpoint', targetId: gap.endpointId, targetKey: key, suggestedCount: 1, reason: 'missingNegativeTests', priority: 'should' });
    }
    if (gap.missingBoundaryTests) {
      tasks.push({ type: 'api', target: 'endpoint', targetId: gap.endpointId, targetKey: key, suggestedCount: 1, reason: 'missingBoundaryTests', priority: 'optional' });
    }
  }

  // ── Journeys ──────────────────────────────────────────────────────────────────
  for (const gap of jGaps) {
    const key = gap.journeyKey ?? gap.journeyId.slice(0, 8);

    if (gap.hasNoTests) {
      tasks.push({ type: 'hybrid', target: 'journey', targetId: gap.journeyId, targetKey: key, suggestedCount: 2, reason: 'noTests', priority: 'must' });
      continue;
    }
    if (gap.missingEndToEndFlow) {
      tasks.push({ type: 'hybrid', target: 'journey', targetId: gap.journeyId, targetKey: key, suggestedCount: 1, reason: 'missingEndToEndFlow', priority: 'should' });
    }
    if (gap.missingAlternativePaths) {
      tasks.push({ type: 'ui', target: 'journey', targetId: gap.journeyId, targetKey: key, suggestedCount: 1, reason: 'missingAlternativePaths', priority: 'optional' });
    }
  }

  const summary = {
    must:     tasks.filter(t => t.priority === 'must').length,
    should:   tasks.filter(t => t.priority === 'should').length,
    optional: tasks.filter(t => t.priority === 'optional').length,
    total:    tasks.length,
  };

  return { projectId, rtmVersionId, generatedAt: new Date().toISOString(), tasks, summary };
}
