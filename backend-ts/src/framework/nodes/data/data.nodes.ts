import { FrameworkNode, defineNode } from '../node.model';

export const DATA_NODES: FrameworkNode[] = [

  defineNode({
    id: 'selenium-java-excel',
    label: 'Excel Data Provider',
    category: 'data',
    compatibleFrameworks: ['selenium'],
    compatibleLanguages: ['java'],
    templates: ['selenium/java/data/excel'],
    metadata: {
      description: 'Apache POI-based Excel data provider for Selenium + Java. Reads .xlsx files as test data tables for data-driven testing.',
      version: '5.x',
      tags: ['excel', 'data-driven', 'apache-poi', 'java'],
      docs: 'https://poi.apache.org/',
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: [],
      recommendedWith: ['selenium-java-testng'],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'selenium-java-csv',
    label: 'CSV Data Provider',
    category: 'data',
    compatibleFrameworks: ['selenium'],
    compatibleLanguages: ['java'],
    templates: ['selenium/java/data/csv'],
    metadata: {
      description: 'OpenCSV-based CSV data provider for Selenium + Java. Lightweight alternative to Excel for tabular test data.',
      version: '5.x',
      tags: ['csv', 'data-driven', 'opencsv', 'java'],
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: [],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'selenium-java-faker',
    label: 'Java Faker',
    category: 'data',
    compatibleFrameworks: ['selenium'],
    compatibleLanguages: ['java'],
    templates: ['selenium/java/data/faker'],
    metadata: {
      description: 'Java Faker library for generating realistic synthetic test data. Names, addresses, emails, credit cards, and 50+ locales.',
      version: '1.x',
      tags: ['faker', 'synthetic-data', 'generation', 'java'],
      docs: 'https://github.com/DiUS/java-faker',
      since: '1.0.0',
    },
    constraints: { required: false, maxInstances: 1, requires: [], conflicts: [], recommendedWith: [] },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'playwright-ts-faker',
    label: 'Faker.js',
    category: 'data',
    compatibleFrameworks: ['playwright', 'cypress', 'webdriverio'],
    compatibleLanguages: ['typescript', 'javascript'],
    templates: ['ts/data/faker'],
    metadata: {
      description: '@faker-js/faker for TypeScript frameworks. Generates realistic names, emails, addresses, dates, and more with full TS types.',
      version: '9.x',
      tags: ['faker', 'synthetic-data', 'typescript', 'generation'],
      docs: 'https://fakerjs.dev/',
      since: '1.0.0',
    },
    constraints: { required: false, maxInstances: 1, requires: [], conflicts: [], recommendedWith: [] },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'python-faker',
    label: 'Faker (Python)',
    category: 'data',
    compatibleFrameworks: ['selenium', 'playwright'],
    compatibleLanguages: ['python'],
    templates: ['python/data/faker'],
    metadata: {
      description: 'Faker library for Python test frameworks. Locale-aware data generation for names, addresses, text, and more.',
      version: '20.x',
      tags: ['faker', 'synthetic-data', 'python'],
      docs: 'https://faker.readthedocs.io/',
      since: '1.0.0',
    },
    constraints: { required: false, maxInstances: 1, requires: [], conflicts: [], recommendedWith: [] },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'playwright-ts-fixtures',
    label: 'Playwright Fixtures',
    category: 'data',
    compatibleFrameworks: ['playwright'],
    compatibleLanguages: ['typescript', 'javascript'],
    templates: ['playwright/ts/fixtures/base'],
    metadata: {
      description: 'Playwright fixture extension pattern for test data injection. Type-safe scoped fixtures with automatic setup/teardown.',
      version: '1.x',
      tags: ['fixtures', 'playwright', 'typescript', 'dependency-injection'],
      docs: 'https://playwright.dev/docs/test-fixtures',
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

  // ─── REST Assured data providers ─────────────────────────────────────────────

  defineNode({
    id: 'restassured-java-faker',
    label: 'Faker Test Data',
    category: 'data',
    compatibleFrameworks: ['restassured'],
    compatibleLanguages: ['java'],
    templates: ['restassured/java/faker'],
    metadata: {
      description: 'JavaFaker-based test data generator for REST Assured. Automatically produces realistic positive and negative payloads for every endpoint — names, emails, phones, UUIDs, boundary values, and injection strings. Bulk data can be injected via the Qlitz dashboard.',
      version: '1.x',
      tags: ['faker', 'test-data', 'randomised', 'boundary', 'restassured'],
      docs: 'https://github.com/DiUS/java-faker',
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: [],
      recommendedWith: ['restassured-java-testng'],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'restassured-java-csv',
    label: 'CSV Data Provider',
    category: 'data',
    compatibleFrameworks: ['restassured'],
    compatibleLanguages: ['java'],
    templates: [],
    metadata: {
      description: 'CSV-file data provider for REST Assured + Java. Uses the built-in CsvDataReader to feed TestNG @DataProvider with rows from testdata/*.csv — drop your own file in and re-run.',
      version: '1.x',
      tags: ['csv', 'data-driven', 'data-provider', 'restassured'],
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: [],
      recommendedWith: ['restassured-java-testng'],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

];
