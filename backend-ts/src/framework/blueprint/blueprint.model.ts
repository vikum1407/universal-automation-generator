// ─── Component ────────────────────────────────────────────────────────────────

export interface BlueprintComponent {
  nodeId: string;
  enabled: boolean;
  config: Record<string, any>;
  position?: { x: number; y: number };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export interface BlueprintMetadata {
  name: string;
  description?: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
  version: string;
  tags?: string[];
}

// ─── Execution config ─────────────────────────────────────────────────────────

export interface BlueprintExecutionConfig {
  parallel: boolean;
  threadCount?: number;
  retryCount?: number;
  timeout?: number;
  headless?: boolean;
  browser?: string;
  baseUrl?: string;
}

// ─── AI config ────────────────────────────────────────────────────────────────

export interface BlueprintAIConfig {
  selfHealing: boolean;
  autoSuggest: boolean;
  visualTesting: boolean;
}

// ─── AI generation config (Phase 6) ──────────────────────────────────────────

export interface BlueprintAIGeneration {
  enabled: boolean;   // master switch — if false, all AI steps are skipped
  docs: boolean;      // generate README / ARCHITECTURE / DEVELOPER_GUIDE
  headers: boolean;   // inject AI-written headers into key generated files
  safeMode: boolean;  // if true, AI failures are silent (generation still succeeds)
}

// ─── Sample tests config (Phase 7) ────────────────────────────────────────────

export interface BlueprintSamples {
  uiTests?:     boolean;  // seed tests/ui/ with sample UI tests
  apiTests?:    boolean;  // seed tests/api/ with sample API tests
  hybridFlows?: boolean;  // seed tests/hybrid/ with sample hybrid flows
}

// ─── API generation config (Phase 10) ─────────────────────────────────────────

export type CoverageLevel    = 'smoke' | 'functional' | 'regression';
export type TestDataStrategy = 'faker' | 'custom' | 'csv' | 'json';
export type PlaywrightMode   = 'ui' | 'api' | 'hybrid';

// ─── Primary blueprint contract ───────────────────────────────────────────────
// This is the canonical input to the template engine (Phase 3+).
// It is language-agnostic and framework-agnostic at the structural level.

export interface FrameworkBlueprint {
  id?: string;
  framework: string;
  language: string;
  architecture: string;        // root architecture node ID
  metadata: BlueprintMetadata;
  nodes: BlueprintComponent[];  // ordered list of selected nodes
  executionConfig: BlueprintExecutionConfig;
  aiConfig: BlueprintAIConfig;
  ai?: BlueprintAIGeneration;   // Phase 6 AI doc / header generation
  samples?: BlueprintSamples;   // Phase 7 sample test seeding
  // Phase 10 — Swagger-driven API test generation (REST Assured + Playwright API)
  swaggerUrl?:       string;
  swaggerFile?:      string;           // raw OpenAPI JSON/YAML content
  coverageLevel?:    CoverageLevel;    // 'smoke' | 'functional' | 'regression'
  testDataStrategy?: TestDataStrategy; // 'faker' | 'custom' | 'csv' | 'json'
  parsedApiBaseUrl?: string;           // extracted from spec at generation time
  // Playwright-specific
  websiteUrl?:       string;           // UI crawl target URL
  playwrightMode?:   PlaywrightMode;   // 'ui' | 'api' | 'hybrid'
  codegenScript?:    string;           // raw Playwright codegen .ts script (alternative to crawling)
  components: Record<string, any>; // free-form extensions + legacy compat
}

// ─── Validation result ────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface BlueprintValidationError {
  field: string;
  message: string;
  severity: ValidationSeverity;
  code: string;
  suggestion?: string;
}

export interface BlueprintValidationResult {
  valid: boolean;
  blueprint: Partial<FrameworkBlueprint>;
  errors: BlueprintValidationError[];
  warnings: BlueprintValidationError[];
  suggestions: BlueprintValidationError[];
  summary: string;
  checkedAt: string;
}
