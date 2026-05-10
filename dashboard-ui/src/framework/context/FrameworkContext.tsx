import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FrameworkSelection {
  framework: string;
  language: string;
  // API generation fields (REST Assured + Playwright API/Hybrid)
  swaggerUrl?:       string;
  swaggerFile?:      string;
  coverageLevel?:    'smoke' | 'functional';
  testDataStrategy?: 'faker' | 'custom' | 'csv' | 'json';
  // Playwright-specific
  playwrightMode?:   'ui' | 'api' | 'hybrid';
  websiteUrl?:       string;
}

export interface CombinationValidation {
  valid: boolean;
  status: "supported" | "partial" | "unsupported";
  framework: string;
  language: string;
  reason?: string;
  alternativeLanguages?: string[];
}

export interface FrameworkNodeModel {
  id: string;
  label: string;
  category: string;
  compatibleFrameworks: string[];
  compatibleLanguages: string[];
  metadata: {
    description: string;
    version: string;
    tags: string[];
    docs?: string;
    since: string;
  };
  constraints: {
    required: boolean;
    maxInstances: number;
    requires: string[];
    conflicts: string[];
    recommendedWith: string[];
  };
  capabilities: {
    canBeRoot: boolean;
    supportsParallel: boolean;
    supportsDistributed: boolean;
    hasAIIntegration: boolean;
    hasReporting: boolean;
    hasRetry: boolean;
  };
  templates: string[];
  configSchema?: Record<string, any>;
}

export interface NodeFilterResult {
  framework: string;
  language: string;
  combination: CombinationValidation;
  nodes: FrameworkNodeModel[];
  byCategory: Record<string, FrameworkNodeModel[]>;
  requiredNodes: FrameworkNodeModel[];
  totalCount: number;
}

export interface FrameworkContextState {
  selection: FrameworkSelection | null;
  result: NodeFilterResult | null;
  loading: boolean;
  error: string | null;
  setSelection: (s: FrameworkSelection) => void;
  setResult: (r: NodeFilterResult) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FrameworkContext = createContext<FrameworkContextState | null>(null);

export function FrameworkProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<FrameworkSelection | null>(null);
  const [result,    setResult]    = useState<NodeFilterResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const reset = () => {
    setSelection(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  return (
    <FrameworkContext.Provider
      value={{ selection, result, loading, error, setSelection, setResult, setLoading, setError, reset }}
    >
      {children}
    </FrameworkContext.Provider>
  );
}

export function useFramework(): FrameworkContextState {
  const ctx = useContext(FrameworkContext);
  if (!ctx) throw new Error("useFramework must be used inside <FrameworkProvider>");
  return ctx;
}
