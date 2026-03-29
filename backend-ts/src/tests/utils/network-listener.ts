import { Page } from "@playwright/test";
import { v4 as uuid } from "uuid";

export async function attachNetworkListener(page: Page) {
  const store = (global as any).__QLITZ_NETWORK__;

  page.on("request", (req) => {
    const id = uuid();
    (req as any).__qlitz_id = id;

    store.push({
      id,
      url: req.url(),
      method: req.method(),
      request_body: req.postData() || null,
      started_at: new Date().toISOString(),
      finished_at: null,
      status: null,
      response_body: null,
      duration_ms: null
    });
  });

  page.on("response", async (res) => {
    const req = res.request();
    const id = (req as any).__qlitz_id;
    if (!id) return;

    const entry = store.find((n: any) => n.id === id);
    if (!entry) return;

    entry.status = res.status();
    entry.finished_at = new Date().toISOString();

    try {
      entry.response_body = await res.text();
    } catch {
      entry.response_body = null;
    }

    entry.duration_ms =
      new Date(entry.finished_at).getTime() -
      new Date(entry.started_at).getTime();
  });
}
