import { Injectable } from "@nestjs/common";
import type { RTMDocument, Requirement } from "./rtm.model";

export interface RTMAnalyticsResult {
  totalRequirements: number;
  coveredRequirements: number;
  uncoveredRequirements: number;
  coveragePercent: number;

  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;

  uiCount: number;
  apiCount: number;

  criticalPriorityCount: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
}

@Injectable()
export class RTMAnalyticsService {
  compute(rtm: RTMDocument): RTMAnalyticsResult {
    const reqs = rtm.requirements || [];

    const total = reqs.length;
    const covered = reqs.filter(r => (r.coveredBy?.length || 0) > 0).length;
    const uncovered = total - covered;

    const coveragePercent =
      total === 0 ? 0 : Math.round((covered / total) * 100);

    const highRisk = reqs.filter(r => r.riskLevel === "high").length;
    const mediumRisk = reqs.filter(r => r.riskLevel === "medium").length;
    const lowRisk = reqs.filter(r => r.riskLevel === "low").length;

    const uiCount = reqs.filter(r => r.type === "ui").length;
    const apiCount = reqs.filter(r => r.type === "api").length;

    const criticalPriority = reqs.filter(
      r => r.businessPriority === "critical"
    ).length;

    const highPriority = reqs.filter(
      r => r.businessPriority === "high"
    ).length;

    const mediumPriority = reqs.filter(
      r => r.businessPriority === "medium"
    ).length;

    const lowPriority = reqs.filter(
      r => r.businessPriority === "low"
    ).length;

    return {
      totalRequirements: total,
      coveredRequirements: covered,
      uncoveredRequirements: uncovered,
      coveragePercent,

      highRiskCount: highRisk,
      mediumRiskCount: mediumRisk,
      lowRiskCount: lowRisk,

      uiCount,
      apiCount,

      criticalPriorityCount: criticalPriority,
      highPriorityCount: highPriority,
      mediumPriorityCount: mediumPriority,
      lowPriorityCount: lowPriority
    };
  }
}
