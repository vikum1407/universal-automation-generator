import { Injectable } from '@nestjs/common';
import { UiIngestionService } from '../ui-scan/ui-ingestion.service';
import { ApiIngestionService } from '../api-scan/api-ingestion.service';
import { IngestedData } from '../metadata/ingested-data.model';

@Injectable()
export class IngestionOrchestrator {
  constructor(
    private readonly uiIngestionService: UiIngestionService,
    private readonly apiIngestionService: ApiIngestionService
  ) {}

  async ingestFromUrl(url: string): Promise<IngestedData> {
    return this.uiIngestionService.ingestFromUrl(url);
  }

  async ingestFromSwagger(swaggerUrl: string): Promise<IngestedData> {
    return this.apiIngestionService.ingestFromSwagger(swaggerUrl);
  }
}
