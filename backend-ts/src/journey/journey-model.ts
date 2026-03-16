export interface JourneyStep {
  from: string;
  to: string;
  selector?: string;
  action?: string;
}

export type JourneyType =
  | 'login'
  | 'checkout'
  | 'product-browsing'
  | 'cart'
  | 'navigation'
  | 'generic';

export interface Journey {
  id: string;
  title: string;
  type: JourneyType;
  steps: JourneyStep[];

  // Added for risk engine
  risk?: {
    score: number;
    priority: 'P0' | 'P1' | 'P2';
    type: JourneyType;
  };
}
