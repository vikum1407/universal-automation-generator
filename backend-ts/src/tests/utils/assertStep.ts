import { expect } from "@playwright/test";
import axios from "axios";
import { v4 as uuid } from "uuid";

export async function assertStep(message: string, fn: () => Promise<void>, runId: string) {
  const assertionId = uuid();

  try {
    await fn();

    await axios.post("http://localhost:3000/api/ingest/playwright/assertion", {
      id: assertionId,
      runId,
      passed: true,
      message
    });
  } catch (err: any) {
    await axios.post("http://localhost:3000/api/ingest/playwright/assertion", {
      id: assertionId,
      runId,
      passed: false,
      message,
      error: {
        message: err.message,
        stack: err.stack
      }
    });

    throw err;
  }
}
