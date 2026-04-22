// -----------------------------
// RTM Requirement Source
// -----------------------------
export interface RTMRequirementSource {
  pageName: string;
}

// -----------------------------
// RTM Requirement View
// -----------------------------
export interface RTMRequirementView {
  id: string;
  title: string;
  description: string;
  type: "ui" | "api";

  source: RTMRequirementSource;

  tags: string[];
  businessPriority: string;
  riskLevel: string;

  coveredBy: string[];

  aiLogic: {
    steps: string[];
    assertions: string[];
    negativeTests: string[];
  };
}

// -----------------------------
// RTM Response (backend shape)
// -----------------------------
export interface RTMResponse {
  rtm: {
    generatedAt: string;
    project: string;
    version: string;
    requirements: RTMRequirementView[];
  };
  analytics: any;
  insights: any[];
}

// -----------------------------
// Fetch RTM
// -----------------------------
export async function fetchRTM(projectId: string): Promise<RTMResponse> {
  const res = await fetch(`/projects/${projectId}/rtm`);
  return res.json();
}
