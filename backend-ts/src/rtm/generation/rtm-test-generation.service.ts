import * as fs   from 'fs';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

import { UITestGeneratorService }     from './ui-test-generator.service';
import { APITestGeneratorService }    from './api-test-generator.service';
import { HybridTestGeneratorService } from './hybrid-test-generator.service';
import { buildTestMetadata }          from './mapping/test-metadata-builder';
import { getFrameworkTestLocation }   from './mapping/rtm-to-framework-mapper';

const OUTPUT_BASE = './qlitz-output';

export interface GenerateTestsDto {
  framework:     string;
  language:      string;
  strategy:      'smoke' | 'regression' | 'full';
  includeUI:     boolean;
  includeAPI:    boolean;
  includeHybrid: boolean;
  baseUrl:       string;
}

export interface GeneratedFile {
  filePath:  string;
  testCount: number;
  type:      'ui' | 'api' | 'hybrid';
  reqKey:    string;
}

export interface GenerationResult {
  totalFiles:    number;
  totalTests:    number;
  uiFiles:       number;
  apiFiles:      number;
  hybridFiles:   number;
  files:         GeneratedFile[];
  outputDir:     string;
}

@Injectable()
export class RtmTestGenerationService {
  private readonly logger = new Logger(RtmTestGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uiGen:     UITestGeneratorService,
    private readonly apiGen:    APITestGeneratorService,
    private readonly hybridGen: HybridTestGeneratorService,
  ) {}

  async generate(
    projectId:    string,
    rtmVersionId: string,
    dto:          GenerateTestsDto,
  ): Promise<GenerationResult> {
    const loc = getFrameworkTestLocation(dto.framework, dto.language);

    // ── 1. Load requirements for this RTM version ─────────────────────────────
    const requirements = await this.prisma.rtmRequirement.findMany({
      where:   { rtmVersionId },
      orderBy: { key: 'asc' },
    });

    // ── 2. Load Phase 2 mapping IDs ───────────────────────────────────────────
    const flowMappings = await this.prisma.rtmReqFlowMapping.findMany({
      where: { rtmVersionId },
    });
    const endpointMappings = await this.prisma.rtmReqEndpointMapping.findMany({
      where: { rtmVersionId },
    });

    // Collect all referenced IDs
    const allFlowIds     = [...new Set(flowMappings.map(m => m.flowId))];
    const allEndpointIds = [...new Set(endpointMappings.map(m => m.discoveredEndpointId))];

    // Bulk-load the actual Flow and Endpoint records
    const [flows, endpoints] = await Promise.all([
      allFlowIds.length
        ? this.prisma.flow.findMany({ where: { id: { in: allFlowIds } } })
        : Promise.resolve([]),
      allEndpointIds.length
        ? this.prisma.endpoint.findMany({ where: { id: { in: allEndpointIds } } })
        : Promise.resolve([]),
    ]);

    const flowMap     = new Map(flows.map(f => [f.id, f]));
    const endpointMap = new Map(endpoints.map(e => [e.id, e]));

    // Index flow/endpoint lists by requirementId
    const flowsByReq     = new Map<string, { id: string; name: string }[]>();
    const endpointsByReq = new Map<string, { id: string; method: string; path: string }[]>();

    for (const m of flowMappings) {
      const flow = flowMap.get(m.flowId);
      if (!flow) continue;
      const arr = flowsByReq.get(m.requirementId) ?? [];
      arr.push({ id: flow.id, name: flow.name });
      flowsByReq.set(m.requirementId, arr);
    }
    for (const m of endpointMappings) {
      const ep = endpointMap.get(m.discoveredEndpointId);
      if (!ep) continue;
      const arr = endpointsByReq.get(m.requirementId) ?? [];
      arr.push({ id: ep.id, method: ep.method, path: ep.path });
      endpointsByReq.set(m.requirementId, arr);
    }

    // ── 3. Prepare output directories ─────────────────────────────────────────
    const outputBase = path.join(OUTPUT_BASE, projectId, 'rtm-tests');
    for (const dir of [loc.uiTestDir, loc.apiTestDir, loc.hybridTestDir]) {
      fs.mkdirSync(path.join(outputBase, dir), { recursive: true });
    }

    const generatedFiles: GeneratedFile[] = [];

    // ── 4. Generate per requirement ───────────────────────────────────────────
    for (const req of requirements) {
      const reqFlows     = flowsByReq.get(req.id)     ?? [];
      const reqEndpoints = endpointsByReq.get(req.id) ?? [];
      const hasFlows     = reqFlows.length > 0;
      const hasEndpoints = reqEndpoints.length > 0;

      const meta = buildTestMetadata({
        requirementId:  req.id,
        requirementKey: req.key,
        endpointIds:    reqEndpoints.map(e => e.id),
        uiFlowIds:      reqFlows.map(f => f.id),
      });

      // UI test — only when requirement has mapped flows
      if (dto.includeUI && hasFlows) {
        const spec = this.uiGen.generate(
          dto.framework, dto.language,
          req.key, req.title, req.description ?? '',
          dto.baseUrl, reqFlows.map(f => f.name),
          meta, dto.strategy,
        );
        const filePath = path.join(outputBase, loc.uiTestDir, spec.fileName);
        fs.writeFileSync(filePath, spec.content, 'utf8');
        await this.registerTags(projectId, spec.fileName, meta);
        generatedFiles.push({ filePath, testCount: spec.testCount, type: 'ui', reqKey: req.key });
      }

      // API test — only when requirement has mapped endpoints
      if (dto.includeAPI && hasEndpoints) {
        const spec = this.apiGen.generate(
          dto.framework, dto.language,
          req.key, req.title,
          dto.baseUrl, reqEndpoints,
          meta, dto.strategy,
        );
        const filePath = path.join(outputBase, loc.apiTestDir, spec.fileName);
        fs.writeFileSync(filePath, spec.content, 'utf8');
        await this.registerTags(projectId, spec.fileName, meta);
        generatedFiles.push({ filePath, testCount: spec.testCount, type: 'api', reqKey: req.key });
      }

      // Hybrid test — only when both flows and endpoints are mapped
      if (dto.includeHybrid && hasFlows && hasEndpoints) {
        const spec = this.hybridGen.generate(
          dto.framework, dto.language,
          req.key, req.title,
          dto.baseUrl, reqFlows.map(f => f.name), reqEndpoints,
          meta, dto.strategy,
        );
        const filePath = path.join(outputBase, loc.hybridTestDir, spec.fileName);
        fs.writeFileSync(filePath, spec.content, 'utf8');
        await this.registerTags(projectId, spec.fileName, meta);
        generatedFiles.push({ filePath, testCount: spec.testCount, type: 'hybrid', reqKey: req.key });
      }
    }

    const result: GenerationResult = {
      totalFiles:  generatedFiles.length,
      totalTests:  generatedFiles.reduce((s, f) => s + f.testCount, 0),
      uiFiles:     generatedFiles.filter(f => f.type === 'ui').length,
      apiFiles:    generatedFiles.filter(f => f.type === 'api').length,
      hybridFiles: generatedFiles.filter(f => f.type === 'hybrid').length,
      files:       generatedFiles,
      outputDir:   outputBase,
    };

    this.logger.log(
      `Generated ${result.totalFiles} files / ${result.totalTests} tests for project ${projectId}`,
    );
    return result;
  }

  // ── List previously generated files ─────────────────────────────────────────

  async listGeneratedFiles(projectId: string, _rtmVersionId: string): Promise<string[]> {
    const outputBase = path.join(OUTPUT_BASE, projectId, 'rtm-tests');
    if (!fs.existsSync(outputBase)) return [];
    const files: string[] = [];
    this.walkDir(outputBase, files);
    return files.map(f => path.relative(outputBase, f));
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private async registerTags(
    projectId: string,
    testId:    string,
    meta:      ReturnType<typeof buildTestMetadata>,
  ): Promise<void> {
    const rows = [
      ...meta.requirementIds.map(v => ({ projectId, testId, tagType: 'requirement', tagValue: v })),
      ...meta.uiFlowIds.map(v       => ({ projectId, testId, tagType: 'uiflow',      tagValue: v })),
      ...meta.endpointIds.map(v     => ({ projectId, testId, tagType: 'endpoint',    tagValue: v })),
    ];

    for (const row of rows) {
      await this.prisma.rtmTestTag.upsert({
        where:  { projectId_testId_tagType_tagValue: row },
        update: {},
        create: row,
      });
    }
  }

  private walkDir(dir: string, acc: string[]): void {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) this.walkDir(full, acc);
      else acc.push(full);
    }
  }
}
