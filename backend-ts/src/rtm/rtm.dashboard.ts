import { Injectable } from "@nestjs/common";

import type { RTMDocument } from "./rtm.model";
import type { RTMAnalyticsResult } from "./rtm.analytics";
import type { RTMInsight } from "./rtm.insights";

export interface RTMDashboardBlock {
  label: string;
  value: number | string;
  type?: "success" | "warning" | "danger" | "info";
}

export interface RTMDashboardResponse {
  summaryBlocks: RTMDashboardBlock[];
  riskBlocks: RTMDashboardBlock[];
  priorityBlocks: RTMDashboardBlock[];
  insights: RTMInsight[];
}

@Injectable()
export class RTMDashboardService {
  buildDashboard(
    rtm: RTMDocument,
    analytics: RTMAnalyticsResult,
    insights: RTMInsight[]
  ): RTMDashboardResponse {
    const summaryBlocks: RTMDashboardBlock[] = [
      {
        label: "Total Requirements",
        value: analytics.totalRequirements,
        type: "info"
      },
      {
        label: "Covered Requirements",
        value: analytics.coveredRequirements,
        type: "success"
      },
      {
        label: "Uncovered Requirements",
        value: analytics.uncoveredRequirements,
        type: "danger"
      },
      {
        label: "Coverage %",
        value: `${analytics.coveragePercent}%`,
        type:
          analytics.coveragePercent >= 80
            ? "success"
            : analytics.coveragePercent >= 50
            ? "warning"
            : "danger"
      }
    ];

    const riskBlocks: RTMDashboardBlock[] = [
      {
        label: "High Risk",
        value: analytics.highRiskCount,
        type: "danger"
      },
      {
        label: "Medium Risk",
        value: analytics.mediumRiskCount,
        type: "warning"
      },
      {
        label: "Low Risk",
        value: analytics.lowRiskCount,
        type: "info"
      }
    ];

    const priorityBlocks: RTMDashboardBlock[] = [
      {
        label: "Critical Priority",
        value: analytics.criticalPriorityCount,
        type: "danger"
      },
      {
        label: "High Priority",
        value: analytics.highPriorityCount,
        type: "warning"
      },
      {
        label: "Medium Priority",
        value: analytics.mediumPriorityCount,
        type: "info"
      },
      {
        label: "Low Priority",
        value: analytics.lowPriorityCount,
        type: "info"
      }
    ];

    return {
      summaryBlocks,
      riskBlocks,
      priorityBlocks,
      insights
    };
  }
}
