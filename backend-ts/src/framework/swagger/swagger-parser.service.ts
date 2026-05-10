import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import * as yaml from 'js-yaml';
import type { SwaggerSummary, ParsedEndpoint, ParsedParameter, HttpMethod } from './swagger.types';

const SUPPORTED_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

@Injectable()
export class SwaggerParserService {
  private readonly logger = new Logger(SwaggerParserService.name);

  async parseFromUrl(url: string): Promise<SwaggerSummary> {
    this.logger.log(`Fetching Swagger spec from ${url}`);
    const { data } = await axios.get<string>(url, {
      timeout: 30_000,
      responseType: 'text',
      headers: { Accept: 'application/json, application/yaml, text/yaml, */*' },
    });
    return this.parseRaw(typeof data === 'string' ? data : JSON.stringify(data), url);
  }

  parseFromContent(content: string): SwaggerSummary {
    return this.parseRaw(content, '');
  }

  private parseRaw(raw: string, sourceUrl: string): SwaggerSummary {
    let spec: any;
    try {
      spec = JSON.parse(raw);
    } catch {
      try {
        spec = yaml.load(raw);
      } catch {
        throw new BadRequestException('Cannot parse the provided content as JSON or YAML.');
      }
    }

    if (typeof spec?.openapi === 'string' && spec.openapi.startsWith('3.')) {
      return this.parseOpenApi3(spec, sourceUrl);
    }
    if (spec?.swagger === '2.0') {
      return this.parseSwagger2(spec, sourceUrl);
    }
    throw new BadRequestException('Unsupported spec format. Provide OpenAPI 3.x or Swagger 2.0.');
  }

  // ─── OpenAPI 3.x ──────────────────────────────────────────────────────────────

  private parseOpenApi3(spec: any, sourceUrl: string): SwaggerSummary {
    const servers = spec.servers ?? [];
    const baseUrl = servers[0]?.url ?? this.extractBaseFromUrl(sourceUrl) ?? 'https://api.example.com';

    const endpoints: ParsedEndpoint[] = [];
    const paths = spec.paths ?? {};

    for (const [path, pathItem] of Object.entries<any>(paths)) {
      for (const method of SUPPORTED_METHODS) {
        const op = pathItem[method.toLowerCase()];
        if (!op) continue;

        const tag = (op.tags?.[0] ?? 'Default') as string;
        const opId = op.operationId ?? this.buildOperationId(method, path);

        const params: ParsedParameter[] = this.parseOa3Parameters(op.parameters ?? [], spec);
        const { schema: bodySchema, required: bodyRequired } = this.parseOa3RequestBody(op.requestBody, spec);
        const responses = this.parseOa3Responses(op.responses ?? {});
        const requiresAuth = this.detectAuth3(op, spec);

        endpoints.push({
          operationId: opId,
          method,
          path,
          tag: this.normalizeTag(tag),
          summary:     op.summary     ?? `${method} ${path}`,
          description: op.description ?? undefined,
          parameters:  params,
          requestBodySchema:    bodySchema,
          requestBodyRequired:  bodyRequired,
          responses,
          requiresAuth,
        });
      }
    }

    return {
      title:     spec.info?.title   ?? 'API',
      version:   spec.info?.version ?? '1.0.0',
      baseUrl,
      endpoints,
    };
  }

  private parseOa3Parameters(params: any[], spec: any): ParsedParameter[] {
    return (params ?? []).map(p => {
      const schema = p.schema ?? {};
      const enumVals: string[] | undefined = schema.enum?.map(String);
      return {
        name:        p.name        ?? '',
        in:          p.in          ?? 'query',
        required:    p.required    ?? (p.in === 'path'),
        type:        schema.type   ?? 'string',
        description: p.description ?? undefined,
        schema,
        example:     p.example     ?? schema.example ?? undefined,
        enum:        enumVals?.length ? enumVals : undefined,
      };
    });
  }

  private parseOa3RequestBody(body: any, spec: any): { schema: any; required: boolean } {
    if (!body) return { schema: null, required: false };
    const content = body.content ?? {};
    const mediaType = content['application/json'] ?? content['application/x-www-form-urlencoded'] ?? Object.values(content)[0];
    let schema = (mediaType as any)?.schema ?? null;
    if (schema?.$ref) schema = this.resolveRef(spec, schema.$ref) ?? schema;
    return {
      schema,
      required: body.required ?? false,
    };
  }

  private parseOa3Responses(responses: any): Record<string, { description: string; schema?: any }> {
    const result: Record<string, { description: string; schema?: any }> = {};
    for (const [code, resp] of Object.entries<any>(responses)) {
      const content = resp.content ?? {};
      const mediaType = content['application/json'] ?? Object.values(content)[0];
      result[code] = {
        description: resp.description ?? '',
        schema: (mediaType as any)?.schema ?? undefined,
      };
    }
    return result;
  }

  private detectAuth3(op: any, spec: any): boolean {
    if (op.security !== undefined) return op.security.length > 0;
    return Object.keys(spec.components?.securitySchemes ?? {}).length > 0 &&
           (spec.security ?? []).length > 0;
  }

  // ─── Swagger 2.x ─────────────────────────────────────────────────────────────

  private parseSwagger2(spec: any, sourceUrl: string): SwaggerSummary {
    const scheme = spec.schemes?.[0] ?? 'https';
    const host   = spec.host   ?? this.extractHostFromUrl(sourceUrl) ?? 'api.example.com';
    const base   = spec.basePath ?? '';
    const baseUrl = `${scheme}://${host}${base}`;

    const endpoints: ParsedEndpoint[] = [];
    const paths = spec.paths ?? {};

    for (const [path, pathItem] of Object.entries<any>(paths)) {
      for (const method of SUPPORTED_METHODS) {
        const op = pathItem[method.toLowerCase()];
        if (!op) continue;

        const tag = (op.tags?.[0] ?? 'Default') as string;
        const opId = op.operationId ?? this.buildOperationId(method, path);

        const allParams: any[] = [...(pathItem.parameters ?? []), ...(op.parameters ?? [])];
        const bodyParam = allParams.find(p => p.in === 'body');
        const params: ParsedParameter[] = allParams
          .filter(p => p.in !== 'body')
          .map(p => {
            const enumVals: string[] | undefined = p.enum?.map(String);
            return {
              name:        p.name     ?? '',
              in:          p.in       ?? 'query',
              required:    p.required ?? (p.in === 'path'),
              type:        p.type     ?? p.schema?.type ?? 'string',
              description: p.description ?? undefined,
              schema:      p.schema   ?? undefined,
              example:     p['x-example'] ?? undefined,
              enum:        enumVals?.length ? enumVals : undefined,
            };
          });

        const responses: Record<string, { description: string; schema?: any }> = {};
        for (const [code, resp] of Object.entries<any>(op.responses ?? {})) {
          responses[code] = { description: (resp as any).description ?? '', schema: (resp as any).schema ?? undefined };
        }

        const requiresAuth = (op.security !== undefined)
          ? op.security.length > 0
          : Object.keys(spec.securityDefinitions ?? {}).length > 0 && (spec.security ?? []).length > 0;

        let bodySchema = bodyParam?.schema ?? null;
        if (bodySchema?.$ref) bodySchema = this.resolveRef(spec, bodySchema.$ref) ?? bodySchema;

        endpoints.push({
          operationId: opId,
          method,
          path,
          tag: this.normalizeTag(tag),
          summary:     op.summary     ?? `${method} ${path}`,
          description: op.description ?? undefined,
          parameters:  params,
          requestBodySchema:   bodySchema,
          requestBodyRequired: bodyParam?.required ?? false,
          responses,
          requiresAuth,
        });
      }
    }

    return {
      title:     spec.info?.title   ?? 'API',
      version:   spec.info?.version ?? '1.0.0',
      baseUrl,
      endpoints,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private resolveRef(spec: any, ref: string): any {
    try {
      const parts = ref.replace(/^#\//, '').split('/');
      let node = spec;
      for (const part of parts) {
        node = node?.[decodeURIComponent(part.replace(/~1/g, '/').replace(/~0/g, '~'))];
        if (!node) return null;
      }
      return node;
    } catch { return null; }
  }

  private buildOperationId(method: string, path: string): string {
    const cleaned = path.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    return `${method.toLowerCase()}_${cleaned}`;
  }

  private normalizeTag(tag: string): string {
    return tag.trim().replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Default';
  }

  private extractBaseFromUrl(url: string): string | null {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}`;
    } catch { return null; }
  }

  private extractHostFromUrl(url: string): string | null {
    try {
      return new URL(url).host;
    } catch { return null; }
  }
}
