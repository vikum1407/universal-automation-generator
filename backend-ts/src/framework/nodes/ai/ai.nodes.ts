import { FrameworkNode, defineNode } from '../node.model';

// AI nodes integrate with Qlitz's AI subsystem or external AI testing services.
// All are framework-agnostic and language-agnostic.

export const AI_NODES: FrameworkNode[] = [

  defineNode({
    id: 'all-qlitz-ai',
    label: 'Qlitz AI Integration',
    category: 'ai',
    compatibleFrameworks: ['*'],
    compatibleLanguages: ['*'],
    templates: ['ai/qlitz/base'],
    metadata: {
      description: 'Integrates the generated framework with Qlitz\'s AI subsystem for auto-heal, test suggestions, coverage analysis, and RTM generation.',
      version: '1.0.0',
      tags: ['qlitz', 'ai', 'auto-heal', 'rtm', 'suggestions'],
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: [],
      recommendedWith: ['all-self-healing'],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: true, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'all-self-healing',
    label: 'Self-Healing Locators',
    category: 'ai',
    compatibleFrameworks: ['*'],
    compatibleLanguages: ['*'],
    templates: ['ai/self-healing/base'],
    metadata: {
      description: 'AI-powered self-healing locator engine. Automatically recovers broken selectors using attribute scoring and DOM similarity analysis.',
      version: '1.0.0',
      tags: ['self-healing', 'ai', 'locators', 'resilience'],
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: [],
      recommendedWith: ['all-qlitz-ai'],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: false, hasAIIntegration: true, hasReporting: false, hasRetry: false },
  }),

  defineNode({
    id: 'all-visual-ai',
    label: 'Visual AI Testing',
    category: 'ai',
    compatibleFrameworks: ['*'],
    compatibleLanguages: ['*'],
    templates: ['ai/visual/base'],
    metadata: {
      description: 'AI-powered visual regression testing with Percy or Applitools Eyes. Pixel-diff and layout-diff baseline comparison.',
      version: 'latest',
      tags: ['visual-testing', 'percy', 'applitools', 'ai', 'regression'],
      docs: 'https://applitools.com/docs/',
      since: '1.0.0',
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: [],
      recommendedWith: [],
    },
    capabilities: { canBeRoot: false, supportsParallel: false, supportsDistributed: true, hasAIIntegration: true, hasReporting: true, hasRetry: false },
    configSchema: {
      provider: { type: 'enum', label: 'Visual AI provider', default: 'percy', options: ['percy', 'applitools', 'screener'] },
    },
  }),

];
