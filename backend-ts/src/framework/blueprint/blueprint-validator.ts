import { Injectable } from '@nestjs/common';
import {
  FrameworkBlueprint,
  BlueprintValidationResult,
  BlueprintValidationError,
} from './blueprint.model';
import { NodeFilterService } from '../filter/node-filter.service';

// ─── Known values ─────────────────────────────────────────────────────────────

const SUPPORTED_FRAMEWORKS = ['selenium', 'cypress', 'playwright', 'webdriverio', 'appium'];
const SUPPORTED_LANGUAGES  = ['java', 'typescript', 'javascript', 'python', 'csharp'];

// ─── Validator ────────────────────────────────────────────────────────────────
// Collects all errors/warnings in one pass — never throws.
// Returns a fully structured BlueprintValidationResult.
// Each phase adds new validation rules without touching existing ones.

@Injectable()
export class BlueprintValidator {
  constructor(private readonly filter: NodeFilterService) {}

  validate(blueprint: Partial<FrameworkBlueprint>): BlueprintValidationResult {
    const errors:      BlueprintValidationError[] = [];
    const warnings:    BlueprintValidationError[] = [];
    const suggestions: BlueprintValidationError[] = [];

    // ── Phase 1A: Required fields ─────────────────────────────────────────────

    if (!blueprint.framework) {
      errors.push({
        field: 'framework',
        code: 'MISSING_FRAMEWORK',
        message: 'Framework is required.',
        severity: 'error',
        suggestion: `Supported frameworks: ${SUPPORTED_FRAMEWORKS.join(', ')}`,
      });
    } else if (!SUPPORTED_FRAMEWORKS.includes(blueprint.framework)) {
      errors.push({
        field: 'framework',
        code: 'UNKNOWN_FRAMEWORK',
        message: `Unknown framework: "${blueprint.framework}".`,
        severity: 'error',
        suggestion: `Supported frameworks: ${SUPPORTED_FRAMEWORKS.join(', ')}`,
      });
    }

    if (!blueprint.language) {
      errors.push({
        field: 'language',
        code: 'MISSING_LANGUAGE',
        message: 'Language is required.',
        severity: 'error',
        suggestion: `Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
      });
    } else if (!SUPPORTED_LANGUAGES.includes(blueprint.language)) {
      errors.push({
        field: 'language',
        code: 'UNKNOWN_LANGUAGE',
        message: `Unknown language: "${blueprint.language}".`,
        severity: 'error',
        suggestion: `Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
      });
    }

    if (!blueprint.architecture) {
      errors.push({
        field: 'architecture',
        code: 'MISSING_ARCHITECTURE',
        message: 'An architecture node is required.',
        severity: 'error',
        suggestion: 'Set architecture to a valid architecture node ID (e.g., "selenium-java-pom").',
      });
    }

    // ── Phase 1B: Combination compatibility ──────────────────────────────────

    if (blueprint.framework && blueprint.language) {
      const combo = this.filter.validateCombination(blueprint.framework, blueprint.language);

      if (!combo.valid) {
        errors.push({
          field: 'language',
          code: 'INCOMPATIBLE_COMBINATION',
          message:
            combo.reason ??
            `${blueprint.framework} + ${blueprint.language} is not a supported combination.`,
          severity: 'error',
          suggestion: combo.alternativeLanguages
            ? `Compatible languages for ${blueprint.framework}: ${combo.alternativeLanguages.join(', ')}`
            : undefined,
        });
      } else if (combo.status === 'partial') {
        warnings.push({
          field: 'language',
          code: 'PARTIAL_SUPPORT',
          message:
            combo.reason ??
            `${blueprint.language} has limited support for ${blueprint.framework}.`,
          severity: 'warning',
          suggestion: combo.alternativeLanguages
            ? `Consider using: ${combo.alternativeLanguages.join(', ')}`
            : undefined,
        });
      }
    }

    // ── Phase 1C: Node list warnings ──────────────────────────────────────────

    if (Array.isArray(blueprint.nodes)) {
      if (blueprint.nodes.length === 0) {
        warnings.push({
          field: 'nodes',
          code: 'EMPTY_NODE_LIST',
          message: 'No nodes selected. The generated framework will only contain the architecture skeleton.',
          severity: 'warning',
          suggestion: 'Add a test runner, a reporting node, and at least one utility node.',
        });
      }

      const enabledCount = blueprint.nodes.filter(n => n.enabled).length;
      if (enabledCount === 0 && blueprint.nodes.length > 0) {
        warnings.push({
          field: 'nodes',
          code: 'ALL_NODES_DISABLED',
          message: 'All selected nodes are disabled.',
          severity: 'warning',
          suggestion: 'Enable at least one node to generate meaningful output.',
        });
      }
    }

    // ── Phase 1D: AI config suggestions ───────────────────────────────────────

    if (blueprint.aiConfig) {
      if (!blueprint.aiConfig.selfHealing) {
        suggestions.push({
          field: 'aiConfig.selfHealing',
          code: 'SELF_HEALING_DISABLED',
          message: 'Self-healing locators are disabled.',
          severity: 'info',
          suggestion: 'Enable self-healing to reduce maintenance when UI changes break locators.',
        });
      }
    } else {
      suggestions.push({
        field: 'aiConfig',
        code: 'NO_AI_CONFIG',
        message: 'No AI configuration provided.',
        severity: 'info',
        suggestion: 'Consider enabling Qlitz AI integration for auto-heal, test suggestions, and coverage insights.',
      });
    }

    // ── Phase 1E: Execution config suggestions ────────────────────────────────

    if (blueprint.executionConfig) {
      if (blueprint.executionConfig.parallel && !blueprint.executionConfig.threadCount) {
        suggestions.push({
          field: 'executionConfig.threadCount',
          code: 'PARALLEL_NO_THREAD_COUNT',
          message: 'Parallel execution is enabled but thread count is not set.',
          severity: 'info',
          suggestion: 'Set threadCount to 4 for most CI environments.',
        });
      }
    }

    const valid = errors.length === 0;

    return {
      valid,
      blueprint,
      errors,
      warnings,
      suggestions,
      summary: valid
        ? `Blueprint is valid. ${warnings.length} warning(s), ${suggestions.length} suggestion(s).`
        : `Blueprint has ${errors.length} error(s) that must be resolved before generation.`,
      checkedAt: new Date().toISOString(),
    };
  }
}
