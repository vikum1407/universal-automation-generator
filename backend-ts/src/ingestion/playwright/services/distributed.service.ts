import { Injectable } from "@nestjs/common";

@Injectable()
export class DistributedService {
  normalize(distributed: any = {}) {
    const env = process.env;

    const ci =
      env.GITHUB_ACTIONS ? "github" :
      env.GITLAB_CI ? "gitlab" :
      env.CIRCLECI ? "circleci" :
      env.BITBUCKET_BUILD_NUMBER ? "bitbucket" :
      env.JENKINS_HOME ? "jenkins" :
      env.AZURE_HTTP_USER_AGENT ? "azure" :
      env.CI ? "generic" :
      null;

    return {
      machine_id:
        distributed.machine_id ||
        env.MACHINE_ID ||
        env.HOSTNAME ||
        env.COMPUTERNAME ||
        "local",
      ci_provider: distributed.ci_provider ?? ci,
      ci_run_id:
        distributed.ci_run_id ||
        env.GITHUB_RUN_ID ||
        env.GITLAB_PIPELINE_ID ||
        env.CIRCLE_WORKFLOW_ID ||
        env.BITBUCKET_BUILD_NUMBER ||
        env.JENKINS_HOME ||
        env.AZURE_HTTP_USER_AGENT ||
        null,
      ci_job:
        distributed.ci_job ||
        env.GITHUB_JOB ||
        env.GITLAB_CI_JOB_NAME ||
        env.CIRCLE_JOB ||
        env.BITBUCKET_STEP_TRIGGERER_UUID ||
        null,
      ci_worker:
        distributed.ci_worker ||
        env.CIRCLE_NODE_INDEX ||
        env.GITHUB_RUN_ATTEMPT ||
        env.GITLAB_CI_JOB_STAGE ||
        null,
      shard_index:
        distributed.shard_index ??
        (env.PLAYWRIGHT_SHARD_INDEX ? Number(env.PLAYWRIGHT_SHARD_INDEX) : 0),
      shard_total:
        distributed.shard_total ??
        (env.PLAYWRIGHT_SHARD_TOTAL ? Number(env.PLAYWRIGHT_SHARD_TOTAL) : 1)
    };
  }
}
