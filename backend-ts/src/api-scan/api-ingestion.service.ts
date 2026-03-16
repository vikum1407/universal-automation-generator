import { Injectable } from '@nestjs/common';
import { ApiSwaggerIngestor } from './api-swagger-ingestor';
import { ApiSwaggerNormalizer } from './api-swagger-normalizer';
import { IngestedData } from '../metadata/ingested-data.model';

@Injectable()
export class ApiIngestionService {
  private swaggerIngestor = new ApiSwaggerIngestor();
  private swaggerNormalizer = new ApiSwaggerNormalizer();

  async ingestFromSwagger(swaggerUrl: string): Promise<IngestedData> {
    const raw = await this.swaggerIngestor.fetch(swaggerUrl);
    const apiEndpoints = this.swaggerNormalizer.normalize(raw);

    return {
      apiEndpoints,
      metadata: {
        source: 'swagger',
        swaggerUrl,
        timestamp: Date.now()
      }
    };
  }
}
