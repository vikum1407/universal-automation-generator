import { useMemo } from "react";
import { useFramework } from "../context/FrameworkContext";
import { useBuilderState } from "../builder/useBuilderState";

// Maps BuilderState + FrameworkContext → the FrameworkBlueprint contract (Phase 1 backend model).
// This derivation is pure and deterministic — same inputs always produce the same blueprint.

export interface DerivedBlueprint {
  framework: string;
  language: string;
  architecture: string;
  // Project linkage
  projectId?:   string;
  projectName?: string;
  // API generation (REST Assured + Playwright API/Hybrid)
  swaggerUrl?:       string;
  swaggerFile?:      string;
  coverageLevel?:    'smoke' | 'functional';
  testDataStrategy?: 'faker' | 'custom' | 'csv' | 'json';
  // Playwright-specific
  playwrightMode?:   'ui' | 'api' | 'hybrid';
  websiteUrl?:       string;
  metadata: {
    name: string;
    description: string;
    author: string;
    createdAt: string;
    version: string;
    tags: string[];
  };
  nodes: Array<{
    nodeId: string;
    enabled: boolean;
    config: Record<string, any>;
  }>;
  executionConfig: {
    parallel: boolean;
    threadCount?: number;
    retryCount?: number;
    timeout?: number;
    headless?: boolean;
  };
  aiConfig: {
    selfHealing: boolean;
    autoSuggest: boolean;
    visualTesting: boolean;
  };
  components: Record<string, Array<{ nodeId: string; config: Record<string, any> }>>;
}

export function useBlueprint(): DerivedBlueprint | null {
  const { selection } = useFramework();
  const { architecture, components, getAllInstances } = useBuilderState();

  return useMemo(() => {
    if (!selection || !architecture) return null;

    const allInstances = getAllInstances();

    // Build components map: { [category]: [{ nodeId, config }] }
    const componentsMap: DerivedBlueprint["components"] = {};
    for (const inst of allInstances) {
      if (!componentsMap[inst.category]) componentsMap[inst.category] = [];
      componentsMap[inst.category].push({ nodeId: inst.nodeId, config: inst.config });
    }

    // Derive execution config from testRunner node config (if present)
    const testRunnerInst = components.find(c => c.category === "testRunner");
    const execConfig = testRunnerInst?.config ?? {};

    // Derive AI config from AI nodes
    const hasAI    = components.some(c => c.nodeId === "all-qlitz-ai");
    const hasHeal  = components.some(c => c.nodeId === "all-self-healing");
    const hasVisual= components.some(c => c.nodeId === "all-visual-ai");

    return {
      framework:   selection.framework,
      language:    selection.language,
      architecture: architecture.nodeId,
      metadata: {
        name:        `${selection.framework}-${selection.language}-framework`,
        description: `Generated test automation framework: ${selection.framework} + ${selection.language}`,
        author:      "Qlitz Framework Generator",
        createdAt:   new Date().toISOString(),
        version:     "1.0.0",
        tags:        [selection.framework, selection.language, "generated"],
      },
      nodes: allInstances.map(inst => ({
        nodeId:  inst.nodeId,
        enabled: true,
        config:  inst.config,
      })),
      executionConfig: {
        parallel:    !!(execConfig.parallel || execConfig.threadCount),
        threadCount: execConfig.threadCount   as number | undefined,
        retryCount:  execConfig.retryCount    as number | undefined,
        timeout:     execConfig.timeout       as number | undefined,
        headless:    execConfig.headless      as boolean | undefined,
      },
      aiConfig: {
        selfHealing:   hasHeal,
        autoSuggest:   hasAI,
        visualTesting: hasVisual,
      },
      components: componentsMap,
      swaggerUrl:       selection.swaggerUrl,
      swaggerFile:      selection.swaggerFile,
      coverageLevel:    selection.coverageLevel,
      testDataStrategy: selection.testDataStrategy,
      playwrightMode:   selection.playwrightMode,
      websiteUrl:       selection.websiteUrl,
      projectId:        selection.projectId,
      projectName:      selection.projectName,
    };
  }, [selection, architecture, components, getAllInstances]);
}
