export interface RiskTrend {
  module: string;
  increasingStreak: number;
}

export interface RiskTrendsProvider {
  getRiskTrends(project: string): Promise<RiskTrend[]>;
}
