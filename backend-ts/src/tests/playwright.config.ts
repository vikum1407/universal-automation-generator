import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [["./tests/utils/qlitz-reporter.ts"]],
});
