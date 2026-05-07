import { Injectable, Logger } from '@nestjs/common';
import { AIClient } from '../../framework/ai/ai-client';

export interface RequirementCluster {
  clusterId:      string;
  label:          string;
  requirementIds: string[];
  duplicates:     string[];
  conflicts:      string[];
}

interface SlimReq { id: string; key: string; title: string; description: string }

const SYSTEM = `You are a QA architect specializing in requirement organization.
You identify themes, group related requirements, detect duplicates, and flag conflicts.`;

@Injectable()
export class AIRequirementClusterer {
  private readonly logger = new Logger(AIRequirementClusterer.name);

  constructor(private readonly ai: AIClient) {}

  async cluster(requirements: SlimReq[]): Promise<RequirementCluster[]> {
    if (requirements.length === 0) return [];

    const reqText = requirements
      .map(r => `{"id":"${r.id}","key":"${r.key}","title":${JSON.stringify(r.title)},"description":${JSON.stringify(r.description.slice(0, 200))}}`)
      .join('\n');

    const prompt = `Group the following requirements into logical clusters (themes/epics).
Requirements (JSON):
${reqText}

Return a JSON array of clusters. Each cluster has:
- clusterId: "C1", "C2", etc.
- label: descriptive name for the group (e.g. "Authentication", "User Management")
- requirementIds: array of requirement IDs in this cluster
- duplicates: pairs of IDs that seem to describe the same thing (flat array, e.g. ["id1","id2"])
- conflicts: pairs of IDs with contradictory statements (flat array)

Every requirement must appear in exactly one cluster. Aim for 3–8 clusters unless the data naturally calls for more.
Return ONLY valid JSON array. No explanation.`;

    const raw = await this.ai.complete(SYSTEM, prompt);
    return this.parseJsonArray<RequirementCluster>(raw, []);
  }

  private parseJsonArray<T>(raw: string, fallback: T[]): T[] {
    try {
      const start = raw.indexOf('[');
      const end   = raw.lastIndexOf(']');
      if (start === -1 || end === -1) return fallback;
      return JSON.parse(raw.slice(start, end + 1)) as T[];
    } catch {
      return fallback;
    }
  }
}
