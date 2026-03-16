export interface Requirement {
  // Unique ID for the requirement
  id: string;

  // UI: page name | API: endpoint path
  page: string;

  // Human-readable description
  description: string;

  // Optional CSS selector (UI only)
  selector?: string;

  // Requirement type
  type: 'ui' | 'api';

  // Optional semantic UI action (click, login, add-to-cart, etc.)
  action?: string;

  // Test cases that cover this requirement
  coveredBy?: string[];

  // Source of requirement
  source?: 'UI' | 'API';

  // Optional AI logic block
  aiLogic?: {
    steps: string[];
    assertions: string[];
    negativeTests: {
      case: string;
      steps: string[];
      assertions: string[];
    }[];
  };

  // API-specific fields
  method?: string;
  url?: string;
  requestBody?: any;
  expectedStatus?: number;
  expectedResponse?: any;
}

export interface RTMDocument {
  generatedAt: string;
  requirements: Requirement[];
}
