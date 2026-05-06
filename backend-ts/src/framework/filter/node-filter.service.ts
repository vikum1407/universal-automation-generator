import { Injectable } from '@nestjs/common';
import { NodeLibraryService } from '../nodes/node-library.service';
import { FrameworkNode, NodeCategory } from '../nodes/node.model';
import {
  CompatibilityStatus,
  getCompatibilityStatus,
  getViolationRule,
  getSupportedFrameworks,
  getSupportedLanguages,
  getFullySupportedLanguages,
  COMPATIBILITY_MATRIX,
} from './compatibility-rules';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface CombinationValidation {
  valid: boolean;
  status: CompatibilityStatus;
  framework: string;
  language: string;
  reason?: string;
  alternativeLanguages?: string[];
}

export interface FilterResult {
  framework: string;
  language: string;
  combination: CombinationValidation;
  nodes: FrameworkNode[];
  byCategory: Record<string, FrameworkNode[]>;
  requiredNodes: FrameworkNode[];
  totalCount: number;
}

export interface FrameworkSummary {
  framework: string;
  supportedLanguages: string[];
  fullySupportedLanguages: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class NodeFilterService {
  constructor(private readonly nodeLibrary: NodeLibraryService) {}

  // Validates a framework+language combination against the compatibility matrix.
  validateCombination(framework: string, language: string): CombinationValidation {
    const status  = getCompatibilityStatus(framework, language);
    const rule    = getViolationRule(framework, language);
    const alts    = getSupportedLanguages(framework);

    return {
      valid: status !== 'unsupported',
      status,
      framework,
      language,
      reason:               rule?.reason,
      alternativeLanguages: status === 'unsupported' ? alts : undefined,
    };
  }

  // Returns all nodes that are compatible with the given framework+language,
  // optionally filtered by category.
  filterNodes(framework: string, language: string, category?: string): FilterResult {
    const combination = this.validateCombination(framework, language);
    const all = this.nodeLibrary.getAllNodes();

    const nodes = all.filter(n => {
      const fwMatch =
        n.compatibleFrameworks.includes('*') ||
        (n.compatibleFrameworks as string[]).includes(framework);

      const langMatch =
        n.compatibleLanguages.includes('*') ||
        (n.compatibleLanguages as string[]).includes(language);

      const catMatch = !category || n.category === (category as NodeCategory);

      return fwMatch && langMatch && catMatch;
    });

    const byCategory: Record<string, FrameworkNode[]> = {};
    nodes.forEach(n => {
      if (!byCategory[n.category]) byCategory[n.category] = [];
      byCategory[n.category].push(n);
    });

    const requiredNodes = nodes.filter(n => n.constraints.required);

    return {
      framework,
      language,
      combination,
      nodes,
      byCategory,
      requiredNodes,
      totalCount: nodes.length,
    };
  }

  getSupportedFrameworks(): string[] {
    return getSupportedFrameworks();
  }

  getSupportedLanguages(framework: string): string[] {
    return getSupportedLanguages(framework);
  }

  getFrameworkSummaries(): FrameworkSummary[] {
    return getSupportedFrameworks().map(fw => ({
      framework: fw,
      supportedLanguages:       getSupportedLanguages(fw),
      fullySupportedLanguages:  getFullySupportedLanguages(fw),
    }));
  }

  getCompatibilityMatrix() {
    return COMPATIBILITY_MATRIX;
  }

  getCategories(): NodeCategory[] {
    return this.nodeLibrary.getCategories();
  }
}
