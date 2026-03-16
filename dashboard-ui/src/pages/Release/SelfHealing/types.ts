export interface SelfHealingSuggestion {
  id: string;
  type: 'locator' | 'flakiness' | 'coverage' | 'api_contract';
  testId: string;
  requirementId?: string;
  file?: string;
  currentSelector?: string;
  suggestedSelector?: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  summary: string;
  details: string;
  recommendedAction: string;
}

export interface SelfHealingSummary {
  project: string;
  totalSuggestions: number;
  highImpact: number;
  mediumImpact: number;
  lowImpact: number;
  byType: Record<string, number>;
  suggestions: SelfHealingSuggestion[];
}
