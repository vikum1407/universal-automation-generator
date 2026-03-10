import { RTMDocument, Requirement } from './rtm.model';

export class RTMBuilder {
  build(requirements: Requirement[]): RTMDocument {
    return {
      generatedAt: new Date().toISOString(),
      requirements
    };
  }
}
