// ─── Category ─────────────────────────────────────────────────────────────────

export type NodeCategory =
  | 'architecture'
  | 'reporting'
  | 'testRunner'
  | 'data'
  | 'ci'
  | 'logging'
  | 'distributed'
  | 'utilities'
  | 'ai';

// ─── Framework + Language registry ────────────────────────────────────────────

export type SupportedFramework =
  | 'selenium'
  | 'cypress'
  | 'playwright'
  | 'webdriverio'
  | 'appium';

export type SupportedLanguage =
  | 'java'
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'csharp';

export type Wildcard = '*';
export type FrameworkRef = SupportedFramework | Wildcard;
export type LanguageRef  = SupportedLanguage  | Wildcard;

// ─── Node sub-models ──────────────────────────────────────────────────────────

export interface NodeMetadata {
  description: string;
  version: string;
  tags: string[];
  docs?: string;
  since: string;
}

export interface NodeConstraints {
  required: boolean;
  maxInstances: number;
  requires: string[];       // node IDs that must also be present
  conflicts: string[];      // node IDs that cannot coexist with this node
  recommendedWith: string[]; // node IDs that pair well
}

export interface NodeCapabilities {
  canBeRoot: boolean;         // can act as the architecture/root node
  supportsParallel: boolean;
  supportsDistributed: boolean;
  hasAIIntegration: boolean;
  hasReporting: boolean;
  hasRetry: boolean;
}

export interface NodeConfigField {
  type: 'string' | 'number' | 'boolean' | 'enum';
  label: string;
  default?: any;
  options?: string[];
  required?: boolean;
  description?: string;
}

// ─── Primary model ────────────────────────────────────────────────────────────

export interface FrameworkNode {
  id: string;
  label: string;
  category: NodeCategory;
  compatibleFrameworks: FrameworkRef[];
  compatibleLanguages: LanguageRef[];
  metadata: NodeMetadata;
  constraints: NodeConstraints;
  capabilities: NodeCapabilities;
  templates: string[];
  configSchema?: Record<string, NodeConfigField>;
}

// ─── Factory helper — keeps node definitions lean ─────────────────────────────

interface NodePartial {
  id: string;
  label: string;
  category: NodeCategory;
  compatibleFrameworks: FrameworkRef[];
  compatibleLanguages: LanguageRef[];
  templates: string[];
  metadata?: Partial<NodeMetadata>;
  constraints?: Partial<NodeConstraints>;
  capabilities?: Partial<NodeCapabilities>;
  configSchema?: Record<string, NodeConfigField>;
}

export function defineNode(p: NodePartial): FrameworkNode {
  return {
    id: p.id,
    label: p.label,
    category: p.category,
    compatibleFrameworks: p.compatibleFrameworks,
    compatibleLanguages: p.compatibleLanguages,
    templates: p.templates,
    metadata: {
      description: '',
      version: 'latest',
      tags: [],
      since: '1.0.0',
      ...p.metadata,
    },
    constraints: {
      required: false,
      maxInstances: 1,
      requires: [],
      conflicts: [],
      recommendedWith: [],
      ...p.constraints,
    },
    capabilities: {
      canBeRoot: false,
      supportsParallel: false,
      supportsDistributed: false,
      hasAIIntegration: false,
      hasReporting: false,
      hasRetry: false,
      ...p.capabilities,
    },
    configSchema: p.configSchema,
  };
}
