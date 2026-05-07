import { Injectable, Logger } from '@nestjs/common';
import { AIClient } from '../../framework/ai/ai-client';

export interface ExtractedRequirement {
  title:               string;
  description:         string;
  type:                'functional' | 'nonFunctional';
  priority:            'P0' | 'P1' | 'P2' | 'P3';
  risk:                'high' | 'medium' | 'low';
  acceptanceCriteria:  string[];
}

const SYSTEM = `You are a senior QA engineer extracting structured, testable requirements
from unstructured product documentation. You are precise, thorough, and write clear
acceptance criteria. Never invent information that is not present in the source text.`;

@Injectable()
export class AIRequirementExtractor {
  private readonly logger = new Logger(AIRequirementExtractor.name);

  constructor(private readonly ai: AIClient) {}

  async extract(content: string): Promise<ExtractedRequirement[]> {
    const prompt = `Extract all testable requirements from the document below.
Return a JSON array. Each element must have:
- title: concise title (max 80 chars)
- description: full detail (1–3 sentences)
- type: "functional" or "nonFunctional"
- priority: "P0", "P1", "P2", or "P3"  (P0=critical, P3=low)
- risk: "high", "medium", or "low"
- acceptanceCriteria: array of "Given/When/Then" or bullet statements (2–5 items)

Document:
${content.slice(0, 12000)}

Return ONLY a valid JSON array. No markdown, no explanation.`;

    const raw = await this.ai.complete(SYSTEM, prompt);
    return this.parseJsonArray<ExtractedRequirement>(raw, []);
  }

  private parseJsonArray<T>(raw: string, fallback: T[]): T[] {
    try {
      const start = raw.indexOf('[');
      const end   = raw.lastIndexOf(']');
      if (start === -1 || end === -1) return fallback;
      return JSON.parse(raw.slice(start, end + 1)) as T[];
    } catch (err) {
      this.logger.warn(`JSON parse failed: ${err}`);
      return fallback;
    }
  }
}
