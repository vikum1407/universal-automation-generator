import { Injectable } from '@nestjs/common';
import { UiUrlIngestor } from './ui-url-ingestor';
import { UiActionDetector } from './ui-action-detector';
import { IngestedData } from '../metadata/ingested-data.model';

@Injectable()
export class UiIngestionService {
  private urlIngestor = new UiUrlIngestor();
  private actionDetector = new UiActionDetector();

  async ingestFromUrl(url: string): Promise<IngestedData> {
    const data = await this.urlIngestor.ingest(url);

    // refine actions
    const refinedActions = this.actionDetector.refine(data.actions || []);

    return {
      ...data,
      actions: refinedActions,
      pages: data.pages?.map(p => ({
        ...p,
        actions: refinedActions.filter(a => a.pageName === p.name)
      }))
    };
  }
}
