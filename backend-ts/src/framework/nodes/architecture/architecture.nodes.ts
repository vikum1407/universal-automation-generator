import { FrameworkNode, defineNode } from '../node.model';

export const ARCHITECTURE_NODES: FrameworkNode[] = [

  defineNode({
    id: 'selenium-java-pom',
    label: 'Page Object Model',
    category: 'architecture',
    compatibleFrameworks: ['selenium'],
    compatibleLanguages: ['java'],
    templates: ['selenium/java/pom/base'],
    metadata: {
      description: 'Industry-standard Page Object Model pattern for Selenium + Java. Each page is a class with locators and actions.',
      version: '4.x',
      tags: ['pom', 'oop', 'selenium', 'java', 'design-pattern'],
      docs: 'https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/',
      since: '1.0.0',
    },
    constraints: {
      required: true,
      maxInstances: 1,
      requires: [],
      conflicts: ['selenium-java-page-factory'],
      recommendedWith: ['selenium-java-testng', 'selenium-java-allure'],
    },
    capabilities: { canBeRoot: true, supportsParallel: true, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
    configSchema: {
      basePackage: { type: 'string', label: 'Base package', default: 'com.qlitz.pages', required: true },
      driverManager: { type: 'enum', label: 'Driver Manager', default: 'webdrivermanager', options: ['webdrivermanager', 'manual'] },
    },
  }),

  defineNode({
    id: 'selenium-java-page-factory',
    label: 'Page Factory',
    category: 'architecture',
    compatibleFrameworks: ['selenium'],
    compatibleLanguages: ['java'],
    templates: ['selenium/java/page-factory/base'],
    metadata: {
      description: 'Selenium Page Factory pattern using @FindBy annotations for element initialization.',
      version: '4.x',
      tags: ['page-factory', 'annotations', 'selenium', 'java'],
      since: '1.0.0',
    },
    constraints: {
      required: true,
      maxInstances: 1,
      requires: [],
      conflicts: ['selenium-java-pom'],
      recommendedWith: ['selenium-java-testng'],
    },
    capabilities: { canBeRoot: true, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'selenium-python-pom',
    label: 'Page Object Model',
    category: 'architecture',
    compatibleFrameworks: ['selenium'],
    compatibleLanguages: ['python'],
    templates: ['selenium/python/pom/base'],
    metadata: {
      description: 'Page Object Model for Selenium + Python using dataclasses and type hints.',
      version: '4.x',
      tags: ['pom', 'selenium', 'python'],
      since: '1.0.0',
    },
    constraints: { required: true, maxInstances: 1, requires: [], conflicts: [], recommendedWith: ['selenium-python-pytest', 'selenium-python-allure'] },
    capabilities: { canBeRoot: true, supportsParallel: true, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'playwright-ts-pom',
    label: 'Page Object Model',
    category: 'architecture',
    compatibleFrameworks: ['playwright'],
    compatibleLanguages: ['typescript'],
    templates: ['playwright/ts/pom/base'],
    metadata: {
      description: 'Page Object Model for Playwright + TypeScript. Pages extend base Page class, fixtures inject them.',
      version: '1.x',
      tags: ['pom', 'playwright', 'typescript', 'fixtures'],
      docs: 'https://playwright.dev/docs/pom',
      since: '1.0.0',
    },
    constraints: { required: true, maxInstances: 1, requires: [], conflicts: [], recommendedWith: ['playwright-ts-runner', 'playwright-ts-allure'] },
    capabilities: { canBeRoot: true, supportsParallel: true, supportsDistributed: true, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'playwright-java-pom',
    label: 'Page Object Model',
    category: 'architecture',
    compatibleFrameworks: ['playwright'],
    compatibleLanguages: ['java'],
    templates: ['playwright/java/pom/base'],
    metadata: {
      description: 'Page Object Model for Playwright + Java using the official playwright-java bindings.',
      version: '1.x',
      tags: ['pom', 'playwright', 'java'],
      since: '1.0.0',
    },
    constraints: { required: true, maxInstances: 1, requires: [], conflicts: [], recommendedWith: ['playwright-java-junit5', 'playwright-java-allure'] },
    capabilities: { canBeRoot: true, supportsParallel: true, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'playwright-python-pom',
    label: 'Page Object Model',
    category: 'architecture',
    compatibleFrameworks: ['playwright'],
    compatibleLanguages: ['python'],
    templates: ['playwright/python/pom/base'],
    metadata: {
      description: 'Page Object Model for Playwright + Python using pytest fixtures.',
      version: '1.x',
      tags: ['pom', 'playwright', 'python'],
      since: '1.0.0',
    },
    constraints: { required: true, maxInstances: 1, requires: [], conflicts: [], recommendedWith: ['playwright-python-pytest'] },
    capabilities: { canBeRoot: true, supportsParallel: true, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'playwright-csharp-pom',
    label: 'Page Object Model',
    category: 'architecture',
    compatibleFrameworks: ['playwright'],
    compatibleLanguages: ['csharp'],
    templates: ['playwright/csharp/pom/base'],
    metadata: {
      description: 'Page Object Model for Playwright + C# using Microsoft.Playwright.',
      version: '1.x',
      tags: ['pom', 'playwright', 'csharp'],
      since: '1.0.0',
    },
    constraints: { required: true, maxInstances: 1, requires: [], conflicts: [], recommendedWith: ['playwright-csharp-nunit'] },
    capabilities: { canBeRoot: true, supportsParallel: true, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'cypress-ts-page-objects',
    label: 'Page Objects',
    category: 'architecture',
    compatibleFrameworks: ['cypress'],
    compatibleLanguages: ['typescript', 'javascript'],
    templates: ['cypress/ts/page-objects/base'],
    metadata: {
      description: 'Page Object pattern for Cypress + TypeScript. Uses custom commands and typed selectors.',
      version: '13.x',
      tags: ['page-objects', 'cypress', 'typescript'],
      docs: 'https://docs.cypress.io/guides/references/best-practices#Page-Objects',
      since: '1.0.0',
    },
    constraints: { required: true, maxInstances: 1, requires: [], conflicts: [], recommendedWith: ['cypress-ts-runner', 'cypress-ts-allure'] },
    capabilities: { canBeRoot: true, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'webdriverio-ts-page-objects',
    label: 'Page Objects',
    category: 'architecture',
    compatibleFrameworks: ['webdriverio'],
    compatibleLanguages: ['typescript', 'javascript'],
    templates: ['webdriverio/ts/page-objects/base'],
    metadata: {
      description: 'Page Object pattern for WebdriverIO + TypeScript using WDIO page object conventions.',
      version: '8.x',
      tags: ['page-objects', 'webdriverio', 'typescript'],
      since: '1.0.0',
    },
    constraints: { required: true, maxInstances: 1, requires: [], conflicts: [], recommendedWith: ['webdriverio-ts-mocha'] },
    capabilities: { canBeRoot: true, supportsParallel: true, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

];
