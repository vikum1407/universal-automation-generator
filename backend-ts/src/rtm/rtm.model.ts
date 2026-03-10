export interface Requirement {
  id: string;
  page: string;
  description: string;
  selector?: string;

  // UI or API requirement
  type: 'ui' | 'api';

  // NEW: semantic UI action (click, login, add-to-cart, etc.)
  action?: string;

  // Traceability
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

  // API fields
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
