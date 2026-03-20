import { Injectable } from "@nestjs/common";
import { StabilityDataService } from "../data/stabilityData.service";

@Injectable()
export class LoadStabilityScoreContext {
  constructor(private readonly data: StabilityDataService) {}

  async execute(project: string) {
    return this.data.loadStabilityScoreContext(project);
  }
}
