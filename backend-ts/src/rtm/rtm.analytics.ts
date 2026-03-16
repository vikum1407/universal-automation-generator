import { RTMDocument, Requirement } from './rtm.model';
import { RTMExecutionDocument } from './rtm.execution.model';

export interface CoverageMetrics {
  totalRequirements: number;
  covered: number;
  uncovered: number;
  coveragePercent: number;

  uiTotal: number;
  uiCovered: number;
  uiCoveragePercent: number;

  apiTotal: number;
  apiCovered: number;
  apiCoveragePercent: number;

  aiEnrichedCount: number;
}

export interface ExecutionMetrics {
  hasExecution: boolean;

  totalExecuted: number;
  passed: number;
  failed: number;
  notExecuted: number;
  executionPercent: number;

  flakyCandidates: string[];
}

export interface RiskArea {
  id: string;
  label: string;
  type: 'ui' | 'api';
  uncoveredCount: number;
  failingCount: number;
}

export interface RTMAnalytics {
  coverage: CoverageMetrics;
  execution: ExecutionMetrics;
  highRiskAreas: RiskArea[];
}

export class RTMAnalyticsEngine {
  compute(rtm: RTMDocument, exec?: RTMExecutionDocument): RTMAnalytics {
    // Ensure rtm.requirements always exists
    rtm.requirements = rtm.requirements || [];

    const coverage = this.computeCoverage(rtm);
    const execution = this.computeExecution(rtm, exec);
    const highRiskAreas = this.computeRiskAreas(rtm, exec);

    return {
      coverage,
      execution,
      highRiskAreas
    };
  }

  private computeCoverage(rtm: RTMDocument): CoverageMetrics {
    const requirements = rtm.requirements || [];
    const totalRequirements = requirements.length;

    let covered = 0;
    let uiTotal = 0;
    let uiCovered = 0;
    let apiTotal = 0;
    let apiCovered = 0;
    let aiEnrichedCount = 0;

    for (const req of requirements) {
      const isCovered = !!(req.coveredBy && req.coveredBy.length > 0);
      if (isCovered) covered++;

      if (req.type === 'ui') {
        uiTotal++;
        if (isCovered) uiCovered++;
      } else if (req.type === 'api') {
        apiTotal++;
        if (isCovered) apiCovered++;
      }

      if (req.aiLogic && ((req.aiLogic.steps?.length || 0) > 0 || (req.aiLogic.assertions?.length || 0) > 0)) {
        aiEnrichedCount++;
      }
    }

    return {
      totalRequirements,
      covered,
      uncovered: totalRequirements - covered,
      coveragePercent: totalRequirements ? (covered / totalRequirements) * 100 : 0,

      uiTotal,
      uiCovered,
      uiCoveragePercent: uiTotal ? (uiCovered / uiTotal) * 100 : 0,

      apiTotal,
      apiCovered,
      apiCoveragePercent: apiTotal ? (apiCovered / apiTotal) * 100 : 0,

      aiEnrichedCount
    };
  }

  private computeExecution(
    rtm: RTMDocument,
    exec?: RTMExecutionDocument
  ): ExecutionMetrics {
    const requirements = rtm.requirements || [];

    if (!exec || !exec.results) {
      return {
        hasExecution: false,
        totalExecuted: 0,
        passed: 0,
        failed: 0,
        notExecuted: requirements.length,
        executionPercent: 0,
        flakyCandidates: []
      };
    }

    const statusByReq = new Map<string, Set<'passed' | 'failed'>>();

    for (const result of exec.results) {
      if (!statusByReq.has(result.requirementId)) {
        statusByReq.set(result.requirementId, new Set());
      }
      statusByReq.get(result.requirementId)!.add(result.status);
    }

    let passed = 0;
    let failed = 0;
    let notExecuted = 0;
    const flakyCandidates: string[] = [];

    for (const req of requirements) {
      const statuses = statusByReq.get(req.id);

      if (!statuses || statuses.size === 0) {
        notExecuted++;
        continue;
      }

      if (statuses.has('passed') && statuses.has('failed')) {
        flakyCandidates.push(req.id);
      }

      if (statuses.has('failed')) {
        failed++;
      } else if (statuses.has('passed')) {
        passed++;
      }
    }

    const totalExecuted = passed + failed;

    return {
      hasExecution: true,
      totalExecuted,
      passed,
      failed,
      notExecuted,
      executionPercent: requirements.length
        ? (totalExecuted / requirements.length) * 100
        : 0,
      flakyCandidates
    };
  }

  private computeRiskAreas(
    rtm: RTMDocument,
    exec?: RTMExecutionDocument
  ): RiskArea[] {
    const requirements = rtm.requirements || [];
    const failingByReq = new Set<string>();

    if (exec && exec.results) {
      for (const r of exec.results) {
        if (r.status === 'failed') {
          failingByReq.add(r.requirementId);
        }
      }
    }

    const areaMap = new Map<string, RiskArea>();

    const keyFor = (req: Requirement) =>
      req.type === 'ui' ? `ui:${req.page}` : `api:${req.url || req.page}`;

    const labelFor = (req: Requirement) =>
      req.type === 'ui' ? req.page : req.url || req.page;

    for (const req of requirements) {
      const key = keyFor(req);
      if (!areaMap.has(key)) {
        areaMap.set(key, {
          id: key,
          label: labelFor(req),
          type: req.type,
          uncoveredCount: 0,
          failingCount: 0
        });
      }

      const area = areaMap.get(key)!;

      const isCovered = !!(req.coveredBy && req.coveredBy.length > 0);
      if (!isCovered) {
        area.uncoveredCount++;
      }

      if (failingByReq.has(req.id)) {
        area.failingCount++;
      }
    }

    return Array.from(areaMap.values())
      .filter(a => a.uncoveredCount > 0 || a.failingCount > 0)
      .sort((a, b) => (b.uncoveredCount + b.failingCount) - (a.uncoveredCount + a.failingCount));
  }
}
