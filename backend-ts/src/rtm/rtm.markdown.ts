import { Injectable } from "@nestjs/common";
import type { RTMDocument } from "./rtm.model";
import type { RTMAnalyticsResult } from "./rtm.analytics";
import type { RTMInsight } from "./rtm.insights";

@Injectable()
export class RTMMarkdownService {
  generateMarkdown(
    rtm: RTMDocument,
    analytics: RTMAnalyticsResult,
    insights: RTMInsight[]
  ): string {
    const lines: string[] = [];

    // Header
    lines.push(`# Requirements Traceability Matrix`);
    lines.push(`Generated: **${rtm.generatedAt}**`);
    if (rtm.project) lines.push(`Project: **${rtm.project}**`);
    if (rtm.version) lines.push(`Version: **${rtm.version}**`);
    lines.push("");

    // Summary
    lines.push(`## Summary`);
    lines.push(`- Total Requirements: **${analytics.totalRequirements}**`);
    lines.push(`- Covered Requirements: **${analytics.coveredRequirements}**`);
    lines.push(`- Uncovered Requirements: **${analytics.uncoveredRequirements}**`);
    lines.push(`- Coverage: **${analytics.coveragePercent}%**`);
    lines.push("");

    // Risk Summary
    lines.push(`## Risk Overview`);
    lines.push(`- High Risk: **${analytics.highRiskCount}**`);
    lines.push(`- Medium Risk: **${analytics.mediumRiskCount}**`);
    lines.push(`- Low Risk: **${analytics.lowRiskCount}**`);
    lines.push("");

    // Priority Summary
    lines.push(`## Priority Overview`);
    lines.push(`- Critical: **${analytics.criticalPriorityCount}**`);
    lines.push(`- High: **${analytics.highPriorityCount}**`);
    lines.push(`- Medium: **${analytics.mediumPriorityCount}**`);
    lines.push(`- Low: **${analytics.lowPriorityCount}**`);
    lines.push("");

    // Requirements Table
    lines.push(`## Requirements`);
    lines.push(
      `| ID | Title | Type | Source | Priority | Risk | Covered By |`
    );
    lines.push(
      `|----|--------|------|--------|----------|------|------------|`
    );

    for (const r of rtm.requirements) {
      const source =
        r.type === "ui"
          ? r.source.pageName || "-"
          : `${r.source.method || ""} ${r.source.endpointPath || ""}`.trim();

      const covered = r.coveredBy?.length
        ? r.coveredBy.join(", ")
        : "_None_";

      lines.push(
        `| ${r.id} | ${r.title} | ${r.type.toUpperCase()} | ${source} | ${
          r.businessPriority || "-"
        } | ${r.riskLevel || "-"} | ${covered} |`
      );
    }

    lines.push("");

    // Insights
    lines.push(`## Insights`);
    if (insights.length === 0) {
      lines.push(`No insights available.`);
    } else {
      for (const i of insights) {
        lines.push(
          `- **[${i.type}]** Requirement **${i.requirementId}** – ${i.message}`
        );
      }
    }

    lines.push("");

    return lines.join("\n");
  }
}
