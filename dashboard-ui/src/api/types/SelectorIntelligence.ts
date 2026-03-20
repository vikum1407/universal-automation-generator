export interface SelectorIntelligence {
  selector: string;
  score: number;
  healedFrom: string | null;
  stability: number;
  usage: number;
  metadata: Record<string, any>;
}
