export interface FlowResponse {
  testId: string;
  steps: {
    index: number;
    action: string;
    selector: string | null;
    value: string | null;
    timestamp: string;
    metadata: Record<string, any>;
  }[];
}
