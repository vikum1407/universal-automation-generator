import { Injectable } from "@nestjs/common";
import { PlaywrightGateway } from "../playwright.gateway";
import { buildTimeline } from "../timeline-builder";

@Injectable()
export class TimelineService {
  constructor(private readonly gateway: PlaywrightGateway) {}

  build(runId: string, payload: any) {
    const {
      startedAt,
      finishedAt,
      logs,
      console: consoleLogs,
      network,
      error,
      artifacts,
      metadata
    } = payload;

    return buildTimeline(runId, {
      startedAt,
      finishedAt,
      logs,
      console: consoleLogs,
      network,
      error,
      artifacts,
      metadata
    });
  }

  emit(runId: string, timeline: any[]) {
    for (const e of timeline) {
      this.gateway.emitEvent(runId, e);
    }
  }

  emitAssertion(runId: string, data: { passed: boolean; message: string }) {
    const event = {
      id: `${runId}-assertion-${Date.now()}`,
      run_id: runId,
      event_type: "assertion",
      payload: {
        passed: data.passed,
        message: data.message
      },
      timestamp: new Date()
    };

    this.gateway.emitEvent(runId, event);
  }
}
