import { FrameworkNode, FrameworkRef, defineNode } from '../node.model';

const UI_FRAMEWORKS: FrameworkRef[] = ['selenium', 'cypress', 'playwright', 'webdriverio', 'appium'];

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
    compatibleFrameworks: UI_FRAMEWORKS,
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

  // ─── REST Assured utilities ────────────────────────────────���──────────────────

  defineNode({
    id: 'restassured-java-auth-helper',
    label: 'Auth Helper',
    category: 'utilities',
    compatibleFrameworks: ['restassured'],
    compatibleLanguages: ['java'],
    templates: ['restassured/java/utils/auth-helper'],
    metadata: {
      description: 'Authentication utility for REST Assured. Provides ready-to-use strategies: Bearer token, API key header, Basic Auth, and OAuth2 client-credentials flow.',
      version: '1.0.0',
      tags: ['auth', 'oauth2', 'bearer', 'api-key', 'restassured'],
      since: '1.0.0',
    },
    constraints: { required: false, maxInstances: 1, requires: [], conflicts: [], recommendedWith: [] },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'restassured-java-schema-validator',
    label: 'JSON Schema Validator',
    category: 'utilities',
    compatibleFrameworks: ['restassured'],
    compatibleLanguages: ['java'],
    templates: ['restassured/java/utils/schema-validator'],
    metadata: {
      description: 'JSON Schema response validator for REST Assured. Validates response bodies against JSON Schema files stored in src/test/resources/schemas/. Uses rest-assured-json-schema-validator.',
      version: '1.0.0',
      tags: ['schema', 'json-schema', 'validation', 'restassured'],
      since: '1.0.0',
    },
    constraints: { required: false, maxInstances: 1, requires: [], conflicts: [], recommendedWith: [] },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'restassured-java-retry',
    label: 'Retry Analyzer',
    category: 'utilities',
    compatibleFrameworks: ['restassured'],
    compatibleLanguages: ['java'],
    templates: [],  // generated programmatically in ApiTestGeneratorService (runner-aware)
    metadata: {
      description: 'IRetryAnalyzer for TestNG that retries flaky API tests with configurable attempt count. Logs each retry attempt with the failure reason.',
      version: '1.0.0',
      tags: ['retry', 'flaky', 'testng', 'restassured'],
      since: '1.0.0',
    },
    constraints: {
      required: false, maxInstances: 1,
      requires: ['restassured-java-testng'],
      conflicts: [],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: true },
    configSchema: {
      maxRetry: { type: 'number', label: 'Max retry attempts', default: 2 },
    },
  }),

  defineNode({
    id: 'restassured-java-response-assertions',
    label: 'Custom Response Assertions',
    category: 'utilities',
    compatibleFrameworks: ['restassured'],
    compatibleLanguages: ['java'],
    templates: ['restassured/java/utils/response-assertions'],
    metadata: {
      description: 'Fluent custom assertion builder for REST Assured responses. Provides typed helpers: assertJsonField, assertPaginatedList, assertErrorResponse, assertResponseTime.',
      version: '1.0.0',
      tags: ['assertions', 'fluent', 'custom-matchers', 'restassured'],
      since: '1.0.0',
    },
    constraints: { required: false, maxInstances: 1, requires: [], conflicts: [], recommendedWith: [] },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

];
