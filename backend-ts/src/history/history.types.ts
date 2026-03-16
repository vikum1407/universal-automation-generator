export interface RunRecord {
  project: string;
  tests?: {
    id: string;
    type: string;
    status: string;
    requirementId?: string;
    file?: string;
    steps?: {
      selector?: string;
      suggestedSelector?: string;
      selectorConfidence?: number;
    }[];
  }[];
}
