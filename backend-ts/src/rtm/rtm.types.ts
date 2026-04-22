import type { Requirement, RTMDocument } from "./rtm.model";

export type TestStatus = "passed" | "failed" | "flaky" | "not-run";

export interface RTMTestLink {
  name: string;
  file: string;
  status: TestStatus;
  lastRunAt?: string | null;
}

export interface RTMRequirementView {
  id: string;
  title: string;
  description: string;
  type: "ui" | "api";

  source: {
    pageName?: string;
    endpointPath?: string;
    method?: string;
  };

  tags?: string[];
  businessPriority?: "low" | "medium" | "high" | "critical";
  riskLevel?: "low" | "medium" | "high";

  coverageStatus: "covered" | "not-covered";
  tests: RTMTestLink[];
}

export interface RTMSummary {
  totalRequirements: number;
  coveredRequirements: number;
  coveragePercent: number;
}

export interface RTMResponse {
  requirements: RTMRequirementView[];
  summary: RTMSummary;
}

export interface RTMExportRequest {
  project: string;
  rtm: RTMDocument;
  format: "pdf" | "csv" | "docx" | "md" | "json";
}

export interface RTMRegenerationRequest {
  project: string;
  selectedRequirementIds: string[];
  selectedTestFiles: string[];
}
