import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

import type { RTMDocument } from "./rtm.model";
import type { RTMAnalyticsResult } from "./rtm.analytics";
import type { RTMInsight } from "./rtm.insights";

import { RTMMarkdownService } from "./rtm.markdown";

@Injectable()
export class RTMWriter {
  constructor(private readonly md: RTMMarkdownService) {}

  private ensureDir(filePath: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  private write(filePath: string, content: string | Buffer) {
    this.ensureDir(filePath);
    fs.writeFileSync(filePath, content);
  }

  // ---------------------------------------------------------
  // JSON
  // ---------------------------------------------------------
  writeJSON(base: string, rtm: RTMDocument) {
    const file = path.join(base, "rtm.json");
    this.write(file, JSON.stringify(rtm, null, 2));
  }

  // ---------------------------------------------------------
  // MARKDOWN
  // ---------------------------------------------------------
  writeMarkdown(
    base: string,
    rtm: RTMDocument,
    analytics: RTMAnalyticsResult,
    insights: RTMInsight[]
  ) {
    const file = path.join(base, "rtm.md");
    const md = this.md.generateMarkdown(rtm, analytics, insights);
    this.write(file, md);
  }

  // ---------------------------------------------------------
  // CSV
  // ---------------------------------------------------------
  writeCSV(base: string, rtm: RTMDocument) {
    const file = path.join(base, "rtm.csv");

    const rows: string[] = [];

    rows.push(
      [
        "ID",
        "Title",
        "Description",
        "Type",
        "Source",
        "Priority",
        "Risk",
        "Tags",
        "CoveredBy"
      ].join(",")
    );

    for (const r of rtm.requirements) {
      const source =
        r.type === "ui"
          ? r.source.pageName || "-"
          : `${r.source.method || ""} ${r.source.endpointPath || ""}`.trim();

      const tags = r.tags?.length ? r.tags.join("|") : "";
      const covered = r.coveredBy?.length ? r.coveredBy.join("|") : "";

      rows.push(
        [
          escape(r.id),
          escape(r.title),
          escape(r.description),
          escape(r.type),
          escape(source),
          escape(r.businessPriority || ""),
          escape(r.riskLevel || ""),
          escape(tags),
          escape(covered)
        ].join(",")
      );
    }

    this.write(file, rows.join("\n"));
  }

  // ---------------------------------------------------------
  // TEXT (used for DOCX/PDF generators)
  // ---------------------------------------------------------
  writeText(base: string, rtm: RTMDocument) {
    const file = path.join(base, "rtm.txt");

    const lines: string[] = [];
    lines.push(`Requirements Traceability Matrix`);
    lines.push(`Generated: ${rtm.generatedAt}`);
    if (rtm.project) lines.push(`Project: ${rtm.project}`);
    if (rtm.version) lines.push(`Version: ${rtm.version}`);
    lines.push("");

    for (const r of rtm.requirements) {
      const source =
        r.type === "ui"
          ? r.source.pageName || "-"
          : `${r.source.method || ""} ${r.source.endpointPath || ""}`.trim();

      lines.push(`ID: ${r.id}`);
      lines.push(`Title: ${r.title}`);
      lines.push(`Description: ${r.description}`);
      lines.push(`Type: ${r.type}`);
      lines.push(`Source: ${source}`);
      lines.push(`Priority: ${r.businessPriority || "-"}`);
      lines.push(`Risk: ${r.riskLevel || "-"}`);
      lines.push(`Tags: ${(r.tags || []).join(", ") || "-"}`);
      lines.push(`Covered By: ${(r.coveredBy || []).join(", ") || "-"}`);
      lines.push("");
    }

    this.write(file, lines.join("\n"));
  }
}

// CSV escaping
function escape(value: string): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
