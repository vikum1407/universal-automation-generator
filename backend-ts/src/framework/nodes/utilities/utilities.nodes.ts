import { FrameworkNode, defineNode } from '../node.model';

export const UTILITIES_NODES: FrameworkNode[] = [

  defineNode({
    id: 'selenium-java-screenshot',
    label: 'Screenshot Utility',
    category: 'utilities',
    compatibleFrameworks: ['selenium'],
    compatibleLanguages: ['java'],
    templates: ['selenium/java/utils/screenshot'],
    metadata: {
      description: 'Automatic screenshot capture on test failure for Selenium + Java. Saves to timestamped files with Allure/Extent attachment hooks.',
      version: '1.0.0',
      tags: ['screenshot', 'failure-capture', 'selenium', 'java'],
      since: '1.0.0',
    },
    constraints: { required: false, maxInstances: 1, requires: [], conflicts: [], recommendedWith: ['selenium-java-allure'] },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'selenium-java-retry',
    label: 'Retry Analyzer',
    category: 'utilities',
    compatibleFrameworks: ['selenium'],
    compatibleLanguages: ['java'],
    templates: ['selenium/java/utils/retry'],
    metadata: {
      description: 'IRetryAnalyzer implementation for TestNG that retries flaky tests with configurable attempt count and delay.',
      version: '1.0.0',
      tags: ['retry', 'flaky', 'testng', 'java'],
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: ['selenium-java-testng'],
      conflicts: [],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: true },
    configSchema: {
      maxRetry: { type: 'number', label: 'Max retry attempts', default: 2 },
    },
  }),

  defineNode({
    id: 'all-dotenv',
    label: 'Environment Config (.env)',
    category: 'utilities',
    compatibleFrameworks: ['*'],
    compatibleLanguages: ['*'],
    templates: ['utils/dotenv/base'],
    metadata: {
      description: 'Environment configuration using .env files. Secrets, base URLs, and environment-specific settings are injected at runtime.',
      version: 'latest',
      tags: ['dotenv', 'config', 'env', 'secrets'],
      since: '1.0.0',
    },
    constraints: { required: false, maxInstances: 1, requires: [], conflicts: [], recommendedWith: [] },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'all-docker',
    label: 'Docker Compose Test Environment',
    category: 'utilities',
    compatibleFrameworks: ['*'],
    compatibleLanguages: ['*'],
    templates: ['utils/docker/base'],
    metadata: {
      description: 'Docker Compose configuration to spin up browser, application, and database containers for isolated test environments.',
      version: 'latest',
      tags: ['docker', 'docker-compose', 'containers', 'isolation'],
      since: '1.0.0',
    },
    constraints: { required: false, maxInstances: 1, requires: [], conflicts: [], recommendedWith: [] },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: true, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'playwright-ts-custom-fixtures',
    label: 'Custom Fixture Extensions',
    category: 'utilities',
    compatibleFrameworks: ['playwright'],
    compatibleLanguages: ['typescript', 'javascript'],
    templates: ['playwright/ts/utils/custom-fixtures'],
    metadata: {
      description: 'Typed Playwright fixture extensions for shared browser state, authenticated sessions, and mock data injection.',
      version: '1.x',
      tags: ['fixtures', 'playwright', 'typescript', 'authentication'],
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: ['playwright-ts-runner'],
      conflicts: [],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

];
