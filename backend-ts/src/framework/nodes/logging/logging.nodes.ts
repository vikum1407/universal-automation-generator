import { FrameworkNode, defineNode } from '../node.model';

export const LOGGING_NODES: FrameworkNode[] = [

  defineNode({
    id: 'selenium-java-log4j2',
    label: 'Log4j2',
    category: 'logging',
    compatibleFrameworks: ['selenium'],
    compatibleLanguages: ['java'],
    templates: ['selenium/java/log4j2/base'],
    metadata: {
      description: 'Apache Log4j2 structured logging for Selenium + Java. Async appenders, rolling file policies, and JSON layout.',
      version: '2.x',
      tags: ['log4j2', 'logging', 'async', 'java'],
      docs: 'https://logging.apache.org/log4j/2.x/',
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: ['selenium-java-slf4j'],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'selenium-java-slf4j',
    label: 'SLF4J + Logback',
    category: 'logging',
    compatibleFrameworks: ['selenium'],
    compatibleLanguages: ['java'],
    templates: ['selenium/java/slf4j/base'],
    metadata: {
      description: 'SLF4J facade with Logback backend for Selenium + Java. Industry standard for Java logging abstraction.',
      version: '2.x',
      tags: ['slf4j', 'logback', 'java', 'logging-facade'],
      docs: 'https://www.slf4j.org/',
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: ['selenium-java-log4j2'],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: false, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'playwright-ts-winston',
    label: 'Winston Logger',
    category: 'logging',
    compatibleFrameworks: ['playwright', 'cypress', 'webdriverio'],
    compatibleLanguages: ['typescript', 'javascript'],
    templates: ['ts/winston/base'],
    metadata: {
      description: 'Winston structured logging for TypeScript test frameworks. Transport support for file, console, and external services.',
      version: '3.x',
      tags: ['winston', 'logging', 'typescript', 'structured'],
      docs: 'https://github.com/winstonjs/winston',
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
    id: 'python-loguru',
    label: 'Loguru',
    category: 'logging',
    compatibleFrameworks: ['selenium', 'playwright'],
    compatibleLanguages: ['python'],
    templates: ['python/loguru/base'],
    metadata: {
      description: 'Loguru for Python test frameworks. Zero-config structured logging with automatic exception serialization.',
      version: '0.7.x',
      tags: ['loguru', 'logging', 'python', 'structured'],
      docs: 'https://github.com/Delgan/loguru',
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

];
