import type { ReleaseIntelligenceResponse } from "./ReleaseIntelligenceResponse";
import type { SyncResponse } from "./SyncResponse";
import type { EvolutionResponse } from "./EvolutionResponse";

export interface ReleaseOverviewResponse {
  model: any;
  intelligence: ReleaseIntelligenceResponse;
  sync: SyncResponse;
  evolution: EvolutionResponse;
}
