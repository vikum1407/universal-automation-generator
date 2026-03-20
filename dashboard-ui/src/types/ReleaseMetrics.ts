export type ReleaseMetrics = {
  name: string;                 // e.g., "1.0.4"
  version?: string;             // semantic version if different from name
  branch?: string;              // e.g., "main", "develop"
  environment?: string;         // e.g., "staging", "production"

  createdAt?: string;           // ISO timestamp
  frozenAt?: string;            // ISO timestamp
  deployedAt?: string;          // ISO timestamp
  completedAt?: string;         // ISO timestamp

  owner?: string;               // release manager or team
  status?: "in_progress" | "frozen" | "ready" | "blocked" | "failed";

  readinessScore?: number;      // 0–1
  riskLevel?: "low" | "medium" | "high";

  totalRuns?: number;
  lastRunId?: string;
  stabilityTrend?: "improving" | "declining" | "steady";

  notes?: string;               // optional release notes
};
