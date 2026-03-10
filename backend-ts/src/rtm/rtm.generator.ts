import { RTMDocument, Requirement } from './rtm.model';
import { AITestLogicService } from '../ai/ai-test-logic.service';

export class RTMGenerator {
  private ai = new AITestLogicService();

  generate(requirements: Requirement[]): RTMDocument {
    const enriched = requirements.map(req => ({
      ...req,
      aiLogic: this.ai.generate(req.description)
    }));

    return {
      generatedAt: new Date().toISOString(),
      requirements: enriched
    };
  }
}
