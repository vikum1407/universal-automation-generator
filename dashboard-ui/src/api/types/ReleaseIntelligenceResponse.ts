export interface ReleaseIntelligenceResponse {
  readiness: {
    score: number;
    guardrails: {
      name: string;
      status: "pass" | "fail" | "warn";
      details: string;
    }[];
  };
  story: {
    title: string;
    items: {
      type: string;
      message: string;
      timestamp: string;
    }[];
  };
  timeline: {
    timestamp: string;
    event: string;
    metadata: Record<string, any>;
  }[];
  summary: {
    totalTests: number;
    changedTests: number;
    drift: number;
    stability: number;
    generatedAt: string;
  };
}
