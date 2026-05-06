import { Injectable, Logger } from '@nestjs/common';
import { AIClient } from './ai-client';
import { AI_SYSTEM_EXPLAINER, blueprintExplainPrompt } from './ai-prompts';
import type { FrameworkBlueprint } from '../blueprint/blueprint.model';

export interface ExplainResult {
  explanation: string;
  configured:  boolean;
}

@Injectable()
export class AIExplainService {
  private readonly logger = new Logger(AIExplainService.name);

  constructor(private readonly ai: AIClient) {}

  async explain(blueprint: FrameworkBlueprint): Promise<ExplainResult> {
    if (!this.ai.isConfigured()) {
      return {
        explanation: 'AI explanation is not available (OPENAI_API_KEY not configured).',
        configured:  false,
      };
    }

    const framework    = blueprint.framework   ?? 'unknown';
    const language     = blueprint.language    ?? 'unknown';
    const architecture = blueprint.architecture ?? 'unknown';
    const projectName  = blueprint.metadata?.name ?? 'qlitz-framework';
    const nodeIds      = (blueprint.nodes ?? []).filter(n => n.enabled).map(n => n.nodeId);

    try {
      const explanation = await this.ai.complete(
        AI_SYSTEM_EXPLAINER,
        blueprintExplainPrompt(framework, language, architecture, nodeIds, projectName),
      );
      return { explanation, configured: true };
    } catch (err: any) {
      this.logger.warn(`Explain failed: ${err?.message}`);
      return {
        explanation: `AI explanation temporarily unavailable: ${err?.message ?? 'unknown error'}`,
        configured:  true,
      };
    }
  }
}
