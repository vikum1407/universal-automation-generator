import { Injectable, NotFoundException } from '@nestjs/common';
import { NodeFilterService }    from './filter/node-filter.service';
import { BlueprintValidator }   from './blueprint/blueprint-validator';
import { NodeLibraryService }   from './nodes/node-library.service';
import { AssemblyOrchestrator } from './assembly/assembly-orchestrator';
import { FolderBuilder }        from './assembly/folder-builder';
import { AIExplainService }     from './ai/ai-explain.service';
import { AIDocGenerator }       from './ai/ai-doc-generator';
import { FrameworkBlueprint }   from './blueprint/blueprint.model';

// FrameworkService is the orchestration layer.
// All business logic lives here — controllers stay thin.

@Injectable()
export class FrameworkService {
  constructor(
    private readonly filter:       NodeFilterService,
    private readonly validator:    BlueprintValidator,
    private readonly nodeLibrary:  NodeLibraryService,
    private readonly orchestrator: AssemblyOrchestrator,
    private readonly folder:       FolderBuilder,
    private readonly explainSvc:   AIExplainService,
    private readonly docGen:       AIDocGenerator,
  ) {}

  getNodes(framework: string, language: string, category?: string) {
    return this.filter.filterNodes(framework, language, category);
  }

  getNodeById(id: string) {
    const node = this.nodeLibrary.getNodeById(id);
    if (!node) throw new NotFoundException(`Node "${id}" not found in the node library.`);
    return node;
  }

  getSupportedFrameworks() {
    return {
      frameworks: this.filter.getSupportedFrameworks(),
    };
  }

  getFrameworkSummaries() {
    return {
      summaries: this.filter.getFrameworkSummaries(),
    };
  }

  getSupportedLanguages(framework: string) {
    return {
      framework,
      languages: this.filter.getSupportedLanguages(framework),
    };
  }

  getCompatibilityMatrix() {
    return this.filter.getCompatibilityMatrix();
  }

  validateCombination(framework: string, language: string) {
    return this.filter.validateCombination(framework, language);
  }

  getCategories() {
    return {
      categories: this.filter.getCategories(),
    };
  }

  getLibrarySummary() {
    const all = this.nodeLibrary.getAllNodes();
    const byCategory: Record<string, number> = {};
    all.forEach(n => { byCategory[n.category] = (byCategory[n.category] ?? 0) + 1; });
    return {
      totalNodes: all.length,
      byCategory,
      frameworks: this.filter.getSupportedFrameworks(),
      categories: this.filter.getCategories(),
    };
  }

  validateBlueprint(blueprint: Partial<FrameworkBlueprint>) {
    return this.validator.validate(blueprint);
  }

  async generateFramework(blueprint: FrameworkBlueprint) {
    const validation = this.validator.validate(blueprint);
    if (!validation.valid) {
      return { success: false, validation };
    }
    const result = await this.orchestrator.assembleFramework(blueprint);
    return { success: true, ...result };
  }

  getDownloadPath(jobId: string): string | null {
    const zipPath = this.folder.getZipPath(jobId);
    return this.folder.exists(jobId) ? zipPath : null;
  }

  async explainBlueprint(blueprint: FrameworkBlueprint) {
    return this.explainSvc.explain(blueprint);
  }

  getJobDocs(jobId: string) {
    const projectRoot = this.folder.getProjectPath(jobId);
    const docs = this.docGen.readDocs(projectRoot);
    return { jobId, docs };
  }
}
