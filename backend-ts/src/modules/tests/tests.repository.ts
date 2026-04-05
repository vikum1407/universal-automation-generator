import { db } from "../../core/db";
import { SQL } from "./tests.sql";

export const TestsRepository = {
  async loadRuns(testId: string) {
    return db.any(SQL.LOAD_RUNS, [testId]);
  },

  async loadAssertions(runId: string) {
    return db.any(SQL.LOAD_ASSERTIONS, [runId]);
  },

  async loadLogs(runId: string) {
    return db.any(SQL.LOAD_LOGS, [runId]);
  },

  async loadArtifacts(runId: string) {
    return db.any(SQL.LOAD_ARTIFACTS, [runId]);
  },

  async loadError(runId: string) {
    return db.oneOrNone(SQL.LOAD_ERROR, [runId]);
  },

  async loadTrends(testId: string) {
    return db.any(SQL.LOAD_TRENDS, [testId]);
  },

  async loadAiInsights(testId: string) {
    return db.oneOrNone(SQL.LOAD_AI_INSIGHTS, [testId]);
  }
};
