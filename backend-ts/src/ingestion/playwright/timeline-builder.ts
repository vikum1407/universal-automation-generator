import { v4 as uuid } from "uuid";

export function buildTimeline(runId: string, data: any) {
  const timeline: any[] = [];

  const push = (type: string, payload: any, ts: string | Date) => {
    timeline.push({
      id: uuid(),
      run_id: runId,
      event_type: type,
      payload,
      timestamp: new Date(ts)
    });
  };

  push("run_started", {}, data.startedAt);
  push("metadata", data.metadata, data.startedAt);

  for (const log of data.logs) {
    push("stdout", { message: log.message }, log.timestamp);
  }

  for (const c of data.console) {
    push("console", { type: c.type, message: c.message }, c.timestamp);
  }

  for (const n of data.network) {
    push(
      "network",
      {
        url: n.url,
        method: n.method,
        status: n.status,
        request_body: n.request_body,
        response_body: n.response_body,
        duration_ms: n.duration_ms
      },
      n.started_at
    );
  }

  if (data.error) {
    push(
      "error",
      {
        message: data.error.message,
        stack: data.error.stack
      },
      data.finishedAt
    );
  }

  for (const art of data.artifacts) {
    push(
      "artifact",
      {
        type: art.type,
        url: art.url
      },
      data.finishedAt
    );
  }

  push("run_finished", {}, data.finishedAt);

  return timeline;
}
