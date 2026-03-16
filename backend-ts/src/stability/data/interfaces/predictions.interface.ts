export interface Prediction {
  component: string;
  confidence: number;
}

export interface PredictionsProvider {
  getPredictions(project: string): Promise<Prediction[]>;
}
