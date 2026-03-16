import { ActionModel } from './action.model';
import { ApiEndpointModel } from './api-endpoint.model';

export interface UiTestCaseModel {
  id: string;
  pageName: string;
  description: string;
  actions: ActionModel[];
}

export interface ApiTestCaseModel {
  id: string;
  endpointId: string;
  description: string;
  method: string;
  path: string;
  positive: boolean;
}

export interface TestCaseBundleModel {
  uiTestCases: UiTestCaseModel[];
  apiTestCases: ApiTestCaseModel[];
  apiEndpoints?: ApiEndpointModel[];
  metadata?: {
    source: 'url' | 'swagger';
    url?: string;
    swaggerUrl?: string;
    timestamp: number;
  };
}
