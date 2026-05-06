import { FrameworkNode, defineNode } from '../node.model';

// CI/CD nodes are framework-agnostic and language-agnostic.
// compatibleFrameworks: ['*'] and compatibleLanguages: ['*'] means universal.

export const CI_NODES: FrameworkNode[] = [

  defineNode({
    id: 'ci-github-actions',
    label: 'GitHub Actions',
    category: 'ci',
    compatibleFrameworks: ['*'],
    compatibleLanguages: ['*'],
    templates: ['ci/github-actions/base'],
    metadata: {
      description: 'GitHub Actions workflow for automated test execution. Includes matrix builds, caching, artifact upload, and environment secrets.',
      version: 'latest',
      tags: ['github-actions', 'ci', 'matrix', 'artifacts'],
      docs: 'https://docs.github.com/en/actions',
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: ['ci-gitlab', 'ci-jenkins', 'ci-azure-devops', 'ci-circleci'],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: true, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
    configSchema: {
      branch: { type: 'string', label: 'Trigger branch', default: 'main' },
      runsOn: { type: 'enum', label: 'Runner OS', default: 'ubuntu-latest', options: ['ubuntu-latest', 'windows-latest', 'macos-latest'] },
      uploadArtifacts: { type: 'boolean', label: 'Upload test artifacts', default: true },
    },
  }),

  defineNode({
    id: 'ci-jenkins',
    label: 'Jenkins Pipeline',
    category: 'ci',
    compatibleFrameworks: ['*'],
    compatibleLanguages: ['*'],
    templates: ['ci/jenkins/base'],
    metadata: {
      description: 'Jenkins declarative pipeline (Jenkinsfile) for test execution with stage-based workflow, parallel steps, and archiving.',
      version: '2.x',
      tags: ['jenkins', 'jenkinsfile', 'declarative-pipeline', 'ci'],
      docs: 'https://www.jenkins.io/doc/book/pipeline/',
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: ['ci-github-actions', 'ci-gitlab', 'ci-azure-devops', 'ci-circleci'],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: true, supportsDistributed: true, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'ci-gitlab',
    label: 'GitLab CI',
    category: 'ci',
    compatibleFrameworks: ['*'],
    compatibleLanguages: ['*'],
    templates: ['ci/gitlab/base'],
    metadata: {
      description: 'GitLab CI/CD pipeline (.gitlab-ci.yml) with stages, caching, Docker executor, and artifact reports.',
      version: 'latest',
      tags: ['gitlab-ci', 'yaml', 'docker', 'ci'],
      docs: 'https://docs.gitlab.com/ee/ci/',
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: ['ci-github-actions', 'ci-jenkins', 'ci-azure-devops', 'ci-circleci'],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: true, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'ci-azure-devops',
    label: 'Azure DevOps Pipelines',
    category: 'ci',
    compatibleFrameworks: ['*'],
    compatibleLanguages: ['*'],
    templates: ['ci/azure-devops/base'],
    metadata: {
      description: 'Azure DevOps YAML pipeline (azure-pipelines.yml) with multi-stage builds, test result publishing, and coverage reporting.',
      version: 'latest',
      tags: ['azure-devops', 'yaml', 'pipelines', 'ci'],
      docs: 'https://learn.microsoft.com/en-us/azure/devops/pipelines/',
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: ['ci-github-actions', 'ci-jenkins', 'ci-gitlab', 'ci-circleci'],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: true, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'ci-circleci',
    label: 'CircleCI',
    category: 'ci',
    compatibleFrameworks: ['*'],
    compatibleLanguages: ['*'],
    templates: ['ci/circleci/base'],
    metadata: {
      description: 'CircleCI configuration (.circleci/config.yml) with orbs, test splitting, and parallelism support.',
      version: 'latest',
      tags: ['circleci', 'orbs', 'parallelism', 'ci'],
      docs: 'https://circleci.com/docs/',
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: ['ci-github-actions', 'ci-jenkins', 'ci-gitlab', 'ci-azure-devops'],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: true, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

];
