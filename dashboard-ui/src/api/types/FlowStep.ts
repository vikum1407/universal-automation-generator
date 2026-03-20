export interface FlowStep {
  index: number;
  action: string;
  selector: string | null;
  value: string | null;
  timestamp: string;
  metadata: Record<string, any>;
}
