import { Injectable, Logger } from '@nestjs/common';
import { AIClient } from '../../framework/ai/ai-client';

export interface RiskScore {
  requirementId: string;
  risk:          'high' | 'medium' | 'low';
  score:         number;   // 0–1
  explanation:   string;
}

interface SlimReq {
  id:          string;
  key:         string;
  title:       string;
  description: string;
  currentRisk: string;
  totalTests:  number;
  coverageScore: number;
  hasNoTests:  boolean;
}

const SYSTEM = `You are a senior QA risk analyst. You evaluate software requirement risk
based on complexity, business impact, ambiguity, and test coverage gaps.
Your risk assessments drive test prioritization and coverage targets.`;

@Injectable()
export class AIRiskScorer {
  private readonly logger = new Logger(AIRiskScorer.name);

  constructor(private readonly ai: AIClient) {}

  async scoreRequirements(requirements: SlimReq[]): Promise<RiskScore[]> {
    if (requirements.length === 0) return [];

    const chunks = this.chunk(requirements, 20);
    const results: RiskScore[] = [];

    for (const chunk of chunks) {
      const reqText = chunk.map(r =>
        `{"id":"${r.id}","key":"${r.key}","title":${JSON.stringify(r.title)}` +
        `,"description":${JSON.stringify(r.description.slice(0, 300))}` +
        `,"currentRisk":"${r.currentRisk}","totalTests":${r.totalTests}` +
        `,"coverageScore":${r.coverageScore.toFixed(2)},"hasNoTests":${r.hasNoTests}}`
      ).join('\n');

      const prompt = `Assess the risk level for each requirement below.
Consider: business impact keywords, description complexity, ambiguity, current coverage gaps.

Requirements:
${reqText}

Return a JSON array. Each element has:
- requirementId: the requirement's id field
- risk: "high", "medium", or "low"
- score: float 0.0–1.0 (1.0 = highest risk)
- explanation: 2 sentences explaining the risk level

Return ONLY valid JSON array.`;

      const raw = await this.ai.complete(SYSTEM, prompt);
      const parsed = this.parseJsonArray<RiskScore>(raw);
      results.push(...parsed);
    }

    return results;
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  private parseJsonArray<T>(raw: string): T[] {
    try {
      const start = raw.indexOf('[');
      const end   = raw.lastIndexOf(']');
      if (start === -1 || end === -1) return [];
      return JSON.parse(raw.slice(start, end + 1)) as T[];
    } catch {
      return [];
    }
  }
}
