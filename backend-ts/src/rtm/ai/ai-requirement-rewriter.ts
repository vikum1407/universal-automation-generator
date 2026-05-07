import { Injectable, Logger } from '@nestjs/common';
import { AIClient } from '../../framework/ai/ai-client';

export type RewriteMode = 'clarity' | 'testability' | 'full';

export interface RewriteResult {
  requirementId:      string;
  improvedTitle:      string;
  improvedDescription: string;
  acceptanceCriteria: string[];
  rationale:          string;
}

const SYSTEM = `You are a senior QA engineer improving software requirements.
You write clear, unambiguous, testable requirements following best practices:
active voice, specific acceptance criteria, measurable outcomes.`;

const MODE_INSTRUCTION: Record<RewriteMode, string> = {
  clarity:     'Focus on removing ambiguity and improving grammar. Keep the meaning unchanged.',
  testability: 'Focus on making the requirement verifiable. Add specific acceptance criteria and expected outcomes.',
  full:        'Fully rewrite for maximum clarity and testability. Restructure if needed. Add preconditions, acceptance criteria, and expected outcomes.',
};

@Injectable()
export class AIRequirementRewriter {
  private readonly logger = new Logger(AIRequirementRewriter.name);

  constructor(private readonly ai: AIClient) {}

  async rewrite(
    requirementId: string,
    title: string,
    description: string,
    mode: RewriteMode,
  ): Promise<RewriteResult> {
    const instruction = MODE_INSTRUCTION[mode];

    const prompt = `${instruction}

Original requirement:
Title: ${title}
Description: ${description}

Return a JSON object with:
- improvedTitle: string
- improvedDescription: string
- acceptanceCriteria: string[] (2–5 Given/When/Then or bullet items)
- rationale: string (2–3 sentences explaining the key changes)

Return ONLY valid JSON. No explanation outside the JSON.`;

    const raw = await this.ai.complete(SYSTEM, prompt);
    const parsed = this.parseJson(raw);
    return {
      requirementId,
      improvedTitle:       parsed?.improvedTitle       ?? title,
      improvedDescription: parsed?.improvedDescription ?? description,
      acceptanceCriteria:  parsed?.acceptanceCriteria  ?? [],
      rationale:           parsed?.rationale           ?? '',
    };
  }

  private parseJson(raw: string): Record<string, any> | null {
    try {
      const start = raw.indexOf('{');
      const end   = raw.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
