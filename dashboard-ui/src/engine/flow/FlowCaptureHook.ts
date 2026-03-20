import type { FlowCaptureEvent } from "./FlowCaptureEvent";

// Minimal Page type so we don't depend on @playwright/test types
export interface MinimalPage {
  addInitScript: (options: { path: string }) => Promise<void>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  evaluate: <T>(fn: (...args: any[]) => T, arg?: any) => Promise<T>;
  mainFrame: () => { url: () => string };
}

// Extend window type to include our capture agent
declare global {
  interface Window {
    __qlitzCapture: {
      recordNavigation: (url: string) => void;
      recordAction: (action: string, selector: string, value?: string) => void;
      recordDomSnapshot: (selector: string) => void;
      recordAssertion: (
        selector: string,
        assertion: string,
        expected: string
      ) => void;
      recordError: (message: string, selector?: string) => void;
      flush: () => FlowCaptureEvent[];
    };
  }
}

/**
 * Attaches the Qlitz flow capture agent to a Playwright page.
 */
export async function attachFlowCapture(page: MinimalPage) {
  await page.addInitScript({ path: "public/qlitz/FlowCaptureAgent.js" });

  page.on("framenavigated", (frame: any) => {
    const main = page.mainFrame();
    if (frame === main) {
      const url = main.url();
      page.evaluate((u: string) => {
        window.__qlitzCapture.recordNavigation(u);
      }, url);
    }
  });

  return {
    recordAction: async (
      action: string,
      selector: string,
      value?: string
    ): Promise<void> => {
      await page.evaluate(
        (args: { a: string; s: string; v?: string }) =>
          window.__qlitzCapture.recordAction(args.a, args.s, args.v),
        { a: action, s: selector, v: value }
      );
    },

    recordDomSnapshot: async (selector: string): Promise<void> => {
      await page.evaluate(
        (sel: string) => window.__qlitzCapture.recordDomSnapshot(sel),
        selector
      );
    },

    recordAssertion: async (
      selector: string,
      assertion: string,
      expected: string
    ): Promise<void> => {
      await page.evaluate(
        (args: { s: string; a: string; e: string }) =>
          window.__qlitzCapture.recordAssertion(args.s, args.a, args.e),
        { s: selector, a: assertion, e: expected }
      );
    },

    flush: async (): Promise<FlowCaptureEvent[]> => {
      return await page.evaluate(() => window.__qlitzCapture.flush());
    },
  };
}
