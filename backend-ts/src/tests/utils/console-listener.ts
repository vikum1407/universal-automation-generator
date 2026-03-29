import { Page } from "@playwright/test";
import { v4 as uuid } from "uuid";

export async function attachConsoleListener(page: Page) {
  const store = (global as any).__QLITZ_CONSOLE__;
  const runId = (global as any).__QLITZ_RUN_ID__;

  page.on("console", (msg) => {
    store.push({
      id: uuid(),
      runId,
      type: msg.type(),
      message: msg.text(),
      timestamp: new Date().toISOString()
    });
  });

  page.on("pageerror", (err) => {
    store.push({
      id: uuid(),
      runId,
      type: "pageerror",
      message: err.message,
      timestamp: new Date().toISOString()
    });
  });
}
