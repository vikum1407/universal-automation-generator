import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AIClient } from './ai-client';
import {
  AI_SYSTEM_DOC_WRITER,
  readmePrompt,
  architecturePrompt,
  developerGuidePrompt,
} from './ai-prompts';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';

export interface GeneratedDoc {
  filename: string;
  content:  string;
}

@Injectable()
export class AIDocGenerator {
  private readonly logger = new Logger(AIDocGenerator.name);

  constructor(private readonly ai: AIClient) {}

  async generateDocs(blueprint: FrameworkBlueprint, safeMode: boolean): Promise<GeneratedDoc[]> {
    if (!this.ai.isConfigured()) {
      this.logger.warn('OPENAI_API_KEY not set — skipping AI doc generation');
      return [];
    }

    const framework    = blueprint.framework  ?? 'unknown';
    const language     = blueprint.language   ?? 'unknown';
    const architecture = blueprint.architecture ?? 'unknown';
    const projectName  = blueprint.metadata?.name ?? 'qlitz-framework';
    const nodeIds      = (blueprint.nodes ?? []).filter(n => n.enabled).map(n => n.nodeId);

    const docs: GeneratedDoc[] = [];

    const tasks: Array<{ filename: string; userPrompt: string }> = [
      {
        filename:   'README.md',
        userPrompt: readmePrompt(framework, language, architecture, nodeIds, projectName),
      },
      {
        filename:   'ARCHITECTURE.md',
        userPrompt: architecturePrompt(framework, language, architecture, nodeIds),
      },
      {
        filename:   'DEVELOPER_GUIDE.md',
        userPrompt: developerGuidePrompt(framework, language, nodeIds),
      },
    ];

    for (const task of tasks) {
      try {
        const content = await this.ai.complete(AI_SYSTEM_DOC_WRITER, task.userPrompt);
        if (content) docs.push({ filename: task.filename, content });
      } catch (err: any) {
        this.logger.warn(`Failed to generate ${task.filename}: ${err?.message}`);
        if (!safeMode) throw err;
      }
    }

    return docs;
  }

  writeDocs(projectRoot: string, docs: GeneratedDoc[]): void {
    for (const doc of docs) {
      const filePath = path.join(projectRoot, doc.filename);
      fs.writeFileSync(filePath, doc.content, 'utf8');
    }
  }

  readDocs(projectRoot: string): GeneratedDoc[] {
    const docFiles = ['README.md', 'ARCHITECTURE.md', 'DEVELOPER_GUIDE.md'];
    const docs: GeneratedDoc[] = [];
    for (const filename of docFiles) {
      const filePath = path.join(projectRoot, filename);
      if (fs.existsSync(filePath)) {
        docs.push({ filename, content: fs.readFileSync(filePath, 'utf8') });
      }
    }
    return docs;
  }
}
