import { Injectable } from "@nestjs/common";
import { IngestionService } from "./services/ingestion.service";
import { TimelineService } from "./services/timeline.service";
import { DistributedService } from "./services/distributed.service";

import { AIClassifierService } from "./ai-classifier.service";
import { AISuggestionService } from "./ai-suggestion.service";
import { AIInsightsService } from "./ai-insights.service";
import { AICrossRunService } from "./ai-cross-run.service";
import { TestAggregationService } from "./test-aggregation.service";

@Injectable()
export class PlaywrightService {
  constructor(
    private readonly ingest: IngestionService,
    private readonly timeline: TimelineService,
    private readonly distributed: DistributedService,
    private readonly classifier: AIClassifierService,
    private readonly suggest: AISuggestionService,
    private readonly insights: AIInsightsService,
    private readonly cross: AICrossRunService,
    private readonly aggregation: TestAggregationService
  ) {}

  async record(payload: any) {
    const {
      runId,
      testId,
      status,
      error,
      logs,
      console: consoleLogs
    } = payload;

    const distributed = this.distributed.normalize(payload.distributed);
    const timeline = this.timeline.build(runId, payload);

    this.timeline.emit(runId, timeline);

    await this.ingest.storeRun(payload, timeline, distributed);

    if (status === "failed") {
      const ai = await this.classifier.classify(error, logs, consoleLogs);
      await this.ingest.storeAIClassification(runId, ai);

      const fix = await this.suggest.generate(error, logs, consoleLogs);
      await this.ingest.storeAISuggestion(runId, fix);
    }

    const insight = await this.insights.generate({
      status,
      durationMs: payload.durationMs,
      metadata: payload.metadata,
      error,
      logs,
      console: consoleLogs,
      network: payload.network,
      artifacts: payload.artifacts
    });
    await this.ingest.storeInsights(runId, insight);

    const cross = await this.cross.analyze(testId);
    await this.ingest.storeCrossRun(testId, cross);

    await this.aggregation.recomputeForTest(testId);

    return { ok: true };
  }

  async recordAssertion(payload: any) {
    const { runId, passed, message } = payload;

    this.timeline.emitAssertion(runId, { passed, message });
    await this.ingest.storeAssertion(payload);

    return { ok: true };
  }
}
