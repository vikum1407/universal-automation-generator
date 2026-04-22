import type { GeneratedTestLogic } from '../ai/ai-test-logic.service';

export type RequirementType = 'ui' | 'api';

export interface RequirementSource {
  // UI: human-readable page or screen name
  pageName?: string;

  // API: endpoint path (e.g. /users/{id})
  endpointPath?: string;

  // API: HTTP method (e.g. GET, POST)
  method?: string;
}

export interface Requirement {
  // Unique business-level requirement ID
  id: string;

  // Short, human-readable title
  title: string;

  // Business-readable description of the requirement
  description: string;

  // Requirement type (UI or API)
  type: RequirementType;

  // Where this requirement comes from (page or endpoint)
  source: RequirementSource;

  // Optional tags (e.g. "auth", "checkout", "critical")
  tags?: string[];

  // Optional business priority
  businessPriority?: 'low' | 'medium' | 'high' | 'critical';

  // Optional risk level (used by analytics/insights)
  riskLevel?: 'low' | 'medium' | 'high';

  // Test case identifiers that cover this requirement
  coveredBy?: string[];

  // AI-enriched logic (matches AITestLogicService output)
  aiLogic?: GeneratedTestLogic;
}

export interface RTMDocument {
  // When this RTM snapshot was generated
  generatedAt: string;

  // Optional project identifier
  project?: string;

  // Optional RTM version
  version?: string;

  // Business-readable requirements
  requirements: Requirement[];
}
