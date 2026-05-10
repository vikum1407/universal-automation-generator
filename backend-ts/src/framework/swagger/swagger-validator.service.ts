import { Injectable } from '@nestjs/common';
import { SwaggerParserService } from './swagger-parser.service';
import type { SwaggerSummary, ParsedEndpoint } from './swagger.types';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface SpecIssue {
  severity: ValidationSeverity;
  code:     string;
  message:  string;
  endpoint?: string;
}

export interface SpecValidationResult {
  valid:        boolean;  // false only when errors > 0
  canGenerate:  boolean;  // false only on fatal errors (no endpoints, no base URL)
  summary:      SwaggerSummary | null;
  errors:       SpecIssue[];
  warnings:     SpecIssue[];
  info:         SpecIssue[];
  stats: {
    totalEndpoints:   number;
    endpointsCovered: number; // have all required fields
    missingStatus:    number;
    missingBodySchema: number;
    missingParamTypes: number;
  };
}

@Injectable()
export class SwaggerValidatorService {

  constructor(private readonly parser: SwaggerParserService) {}

  async validateFromUrl(url: string): Promise<SpecValidationResult> {
    let summary: SwaggerSummary | null = null;
    const errors: SpecIssue[]   = [];
    const warnings: SpecIssue[] = [];
    const info: SpecIssue[]     = [];

    try {
      summary = await this.parser.parseFromUrl(url);
    } catch (err: any) {
      errors.push({ severity: 'error', code: 'PARSE_FAILED', message: `Cannot parse spec: ${err?.message ?? 'unknown error'}` });
      return this.buildResult(false, errors, warnings, info, null);
    }

    return this.analyzeSpec(summary, errors, warnings, info);
  }

  validateFromContent(content: string): SpecValidationResult {
    let summary: SwaggerSummary | null = null;
    const errors: SpecIssue[]   = [];
    const warnings: SpecIssue[] = [];
    const info: SpecIssue[]     = [];

    try {
      summary = this.parser.parseFromContent(content);
    } catch (err: any) {
      errors.push({ severity: 'error', code: 'PARSE_FAILED', message: `Cannot parse spec: ${err?.message ?? 'unknown error'}` });
      return this.buildResult(false, errors, warnings, info, null);
    }

    return this.analyzeSpec(summary, errors, warnings, info);
  }

  private analyzeSpec(
    summary: SwaggerSummary,
    errors: SpecIssue[],
    warnings: SpecIssue[],
    info: SpecIssue[],
  ): SpecValidationResult {
    // ── Fatal checks ──────────────────────────────────────────────────────────

    if (!summary.baseUrl || summary.baseUrl === 'https://api.example.com') {
      errors.push({
        severity: 'error',
        code:     'NO_BASE_URL',
        message:  'No base URL found in the spec (servers[0].url or host+basePath). Tests cannot be generated without a target URL.',
      });
    }

    if (!summary.endpoints.length) {
      errors.push({
        severity: 'error',
        code:     'NO_ENDPOINTS',
        message:  'No API endpoints found in the spec. Ensure your spec has a valid "paths" section.',
      });
    }

    // ── Per-endpoint checks ────────────────────────────────────────────────────

    let missingStatus     = 0;
    let missingBodySchema = 0;
    let missingParamTypes = 0;

    for (const ep of summary.endpoints) {
      const label = `${ep.method} ${ep.path}`;
      const codes = Object.keys(ep.responses).map(Number).filter(n => !isNaN(n));
      const hasSuccess = codes.some(c => c >= 200 && c < 300);

      if (!hasSuccess) {
        missingStatus++;
        warnings.push({
          severity: 'warning',
          code:     'MISSING_SUCCESS_STATUS',
          endpoint: label,
          message:  `${label} has no 2xx success response defined. The generated test will assert HTTP 200 as a placeholder — verify the actual status code and update the assertion.`,
        });
      }

      if (['POST', 'PUT', 'PATCH'].includes(ep.method) && !ep.requestBodySchema) {
        missingBodySchema++;
        warnings.push({
          severity: 'warning',
          code:     'MISSING_BODY_SCHEMA',
          endpoint: label,
          message:  `${label} has no request body schema. The generated test will send an empty body — update it with a valid payload for your API.`,
        });
      }

      const untypedParams = ep.parameters.filter(p => !p.type || p.type === 'string' && !p.enum);
      if (untypedParams.length) {
        missingParamTypes++;
        info.push({
          severity: 'info',
          code:     'WEAK_PARAM_TYPES',
          endpoint: label,
          message:  `${label} has ${untypedParams.length} parameter(s) without explicit types or enum values. Faker will generate generic string values — results may fail server-side validation.`,
        });
      }

      if (!ep.summary || ep.summary === `${ep.method} ${ep.path}`) {
        info.push({
          severity: 'info',
          code:     'MISSING_SUMMARY',
          endpoint: label,
          message:  `${label} has no summary. Allure report descriptions will use the path as a fallback.`,
        });
      }
    }

    return this.buildResult(errors.length === 0, errors, warnings, info, summary, {
      totalEndpoints:   summary.endpoints.length,
      endpointsCovered: summary.endpoints.length - missingStatus - missingBodySchema,
      missingStatus,
      missingBodySchema,
      missingParamTypes,
    });
  }

  private buildResult(
    valid: boolean,
    errors: SpecIssue[],
    warnings: SpecIssue[],
    info: SpecIssue[],
    summary: SwaggerSummary | null,
    stats?: SpecValidationResult['stats'],
  ): SpecValidationResult {
    const fatalError = errors.some(e => e.code === 'PARSE_FAILED' || e.code === 'NO_ENDPOINTS' || e.code === 'NO_BASE_URL');
    return {
      valid,
      canGenerate: !fatalError,
      summary,
      errors,
      warnings,
      info,
      stats: stats ?? { totalEndpoints: 0, endpointsCovered: 0, missingStatus: 0, missingBodySchema: 0, missingParamTypes: 0 },
    };
  }
}
