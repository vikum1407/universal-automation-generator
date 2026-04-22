import { RTMDocument, Requirement } from "./rtm.model";
import { AITestLogicService } from "../ai/ai-test-logic.service";

export class RTMGenerator {
  private ai = new AITestLogicService();

  generate(requirements: Requirement[], project?: string): RTMDocument {
    const enriched = requirements.map(req => ({
      ...req,

      // Always regenerate AI logic from semantic description
      aiLogic: this.ai.generate(req.description)
    }));

    return {
      generatedAt: new Date().toISOString(),
      project,
      requirements: enriched
    };
  }
}
