import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TemplateEngine } from '../templates/template-engine';
import { FolderBuilder } from './folder-builder';
import { FileWriter } from './file-writer';
import { ZipGenerator } from './zip-generator';
import { AIFileHeaderGenerator } from '../ai/ai-file-header-generator';
import { AIDocGenerator } from '../ai/ai-doc-generator';
import { SampleTestsService } from '../samples/sample-tests.service';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';

export interface AssemblyResult {
  jobId: string;
  projectName: string;
  fileCount: number;
  downloadUrl: string;
  projectStructure: string[];
  aiDocs: boolean;
  aiHeaders: boolean;
  samples: { uiTests: string[]; apiTests: string[]; hybridTests: string[] };
}

@Injectable()
export class AssemblyOrchestrator {
  private readonly logger = new Logger(AssemblyOrchestrator.name);

  constructor(
    private readonly engine:         TemplateEngine,
    private readonly folder:         FolderBuilder,
    private readonly writer:         FileWriter,
    private readonly zipper:         ZipGenerator,
    private readonly headerGen:      AIFileHeaderGenerator,
    private readonly docGen:         AIDocGenerator,
    private readonly sampleSvc:      SampleTestsService,
  ) {}

  async assembleFramework(blueprint: FrameworkBlueprint): Promise<AssemblyResult> {
    const jobId       = uuidv4();
    const projectRoot = this.folder.createProjectRoot(jobId);
    const zipPath     = this.folder.getZipPath(jobId);

    const aiCfg      = blueprint.ai;
    const aiEnabled  = aiCfg?.enabled  ?? false;
    const aiHeaders  = aiEnabled && (aiCfg?.headers ?? true);
    const aiDocs     = aiEnabled && (aiCfg?.docs    ?? true);
    const safeMode   = aiCfg?.safeMode ?? true;

    // Step 1 — generate template files
    let files = this.engine.generate(blueprint);

    // Step 2 — optionally inject AI file headers (modifies in-memory file content)
    let headersApplied = false;
    if (aiHeaders) {
      try {
        files = await this.headerGen.applyHeaders(files, blueprint, safeMode);
        headersApplied = true;
      } catch (err: any) {
        this.logger.warn(`AI header step failed: ${err?.message}`);
      }
    }

    // Step 3 — write files to disk
    this.writer.writeAll(projectRoot, files);

    // Step 4 — optionally generate and write AI docs
    let docsApplied = false;
    if (aiDocs) {
      try {
        const docs = await this.docGen.generateDocs(blueprint, safeMode);
        this.docGen.writeDocs(projectRoot, docs);
        docsApplied = docs.length > 0;
      } catch (err: any) {
        this.logger.warn(`AI doc step failed: ${err?.message}`);
      }
    }

    // Step 5 — optionally seed sample tests
    let seedResult = { uiTests: [] as string[], apiTests: [] as string[], hybridTests: [] as string[] };
    if (blueprint.samples && Object.values(blueprint.samples).some(Boolean)) {
      try {
        seedResult = await this.sampleSvc.seedSamples(blueprint, projectRoot);
      } catch (err: any) {
        this.logger.warn(`Sample seeding failed: ${err?.message}`);
      }
    }

    // Step 6 — zip
    await this.zipper.zip(projectRoot, zipPath);

    return {
      jobId,
      projectName:      blueprint.metadata?.name ?? 'qlitz-framework',
      fileCount:        files.length,
      downloadUrl:      `/framework/download/${jobId}`,
      projectStructure: files.map(f => f.path).sort(),
      aiDocs:           docsApplied,
      aiHeaders:        headersApplied,
      samples:          seedResult,
    };
  }
}
