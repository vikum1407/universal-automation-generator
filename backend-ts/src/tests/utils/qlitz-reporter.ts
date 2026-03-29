import type {
  Reporter,
  FullConfig,
  TestCase,
  TestResult
} from "@playwright/test/reporter";

import axios from "axios";
import { v4 as uuid } from "uuid";
import fs from "fs";

class QlitzReporter implements Reporter {
  private runId = uuid();
  private testId = "";
  private network: any[] = [];
  private consoleLogs: any[] = [];
  private metadata: any = {};
  private distributed: any = {};

  async onBegin(config: FullConfig) {
    (global as any).__QLITZ_RUN_ID__ = this.runId;
    (global as any).__QLITZ_NETWORK__ = this.network;
    (global as any).__QLITZ_CONSOLE__ = this.consoleLogs;

    const p = config.projects[0];

    this.metadata = {
      browser: p.use.browserName,
      browser_version: null,
      os: process.platform,
      os_version: process.version,
      device: p.use.deviceScaleFactor ? "emulated-device" : null,
      project: p.name,
      worker_index: Number(process.env.TEST_WORKER_INDEX || 0),
      retry: 0,
      parallel_index: 0
    };

    this.distributed = {
      machine_id:
        process.env.MACHINE_ID ||
        process.env.HOSTNAME ||
        process.env.COMPUTERNAME ||
        "local",
      ci_provider:
        process.env.GITHUB_ACTIONS ? "github" :
        process.env.GITLAB_CI ? "gitlab" :
        process.env.CIRCLECI ? "circleci" :
        process.env.BITBUCKET_BUILD_NUMBER ? "bitbucket" :
        process.env.JENKINS_HOME ? "jenkins" :
        process.env.AZURE_HTTP_USER_AGENT ? "azure" :
        process.env.CI ? "generic" :
        null,
      ci_run_id:
        process.env.GITHUB_RUN_ID ||
        process.env.GITLAB_PIPELINE_ID ||
        process.env.CIRCLE_WORKFLOW_ID ||
        process.env.BITBUCKET_BUILD_NUMBER ||
        process.env.JENKINS_HOME ||
        process.env.AZURE_HTTP_USER_AGENT ||
        null,
      ci_job:
        process.env.GITHUB_JOB ||
        process.env.GITLAB_CI_JOB_NAME ||
        process.env.CIRCLE_JOB ||
        process.env.BITBUCKET_STEP_TRIGGERER_UUID ||
        null,
      ci_worker:
        process.env.CIRCLE_NODE_INDEX ||
        process.env.GITHUB_RUN_ATTEMPT ||
        process.env.GITLAB_CI_JOB_STAGE ||
        null,
      shard_index: process.env.PLAYWRIGHT_SHARD_INDEX
        ? Number(process.env.PLAYWRIGHT_SHARD_INDEX)
        : 0,
      shard_total: process.env.PLAYWRIGHT_SHARD_TOTAL
        ? Number(process.env.PLAYWRIGHT_SHARD_TOTAL)
        : 1
    };

    console.log(`Starting test run: ${this.runId}`);
  }

  async onTestBegin(test: TestCase, result: TestResult) {
    this.testId = test.titlePath().join(" > ");
    this.metadata.retry = result.retry;
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    const artifacts: any[] = [];

    for (const attachment of result.attachments) {
      if (!attachment.path) continue;

      const buffer = fs.readFileSync(attachment.path);
      const base64 = buffer.toString("base64");

      const type =
        attachment.name.includes("expected") ||
        attachment.name.includes("actual") ||
        attachment.name.includes("diff")
          ? "diff"
          : attachment.contentType.includes("video")
          ? "video"
          : attachment.contentType.includes("image")
          ? "screenshot"
          : "snapshot";

      artifacts.push({
        id: uuid(),
        type,
        url: `data:${attachment.contentType};base64,${base64}`
      });
    }

    const payload = {
      runId: this.runId,
      testId: this.testId,
      status: result.status,
      startedAt: result.startTime,
      finishedAt: new Date(),
      durationMs: result.duration,
      logs: result.stdout.map((l) => ({
        type: "stdout",
        message: l,
        timestamp: new Date().toISOString()
      })),
      error: result.error
        ? {
            message: result.error.message,
            stack: result.error.stack
          }
        : null,
      artifacts,
      network: this.network,
      console: this.consoleLogs,
      metadata: this.metadata,
      distributed: this.distributed
    };

    await axios.post("http://localhost:3000/api/ingest/playwright", payload);
  }

  async onEnd() {
    console.log(`Finished test run: ${this.runId}`);
  }
}

export default QlitzReporter;
