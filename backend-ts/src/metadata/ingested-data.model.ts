import { PageModel } from './page.model';
import { ActionModel } from './action.model';
import { ApiEndpointModel } from './api-endpoint.model';

export type IngestionSource = 'url' | 'swagger';

export interface IngestedMetadata {
  source: IngestionSource;
  url?: string;
  swaggerUrl?: string;
  timestamp: number;
}

export interface IngestedData {
  pages?: PageModel[];
  actions?: ActionModel[];
  apiEndpoints?: ApiEndpointModel[];
  metadata: IngestedMetadata;
}
