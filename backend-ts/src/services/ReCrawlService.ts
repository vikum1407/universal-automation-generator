import { Injectable } from "@nestjs/common";
import { progressService } from "./ProgressService";
import { ProgressGateway } from "../gateways/progress.gateway";

@Injectable()
export class ReCrawlService {
  constructor(private readonly gateway: ProgressGateway) {}

  async recrawl(projectId: string) {
    progressService.init(projectId, "recrawling");
    this.gateway.emitProjectStatus(projectId);

    const steps: [string, number][] = [
      ["Cleaning old project…", 10],
      ["Resetting database…", 25],
      ["Re‑scanning website…", 50],
      ["Generating updated tests…", 75],
      ["Finalizing…", 95]
    ];

    for (const [step, percent] of steps) {
      progressService.update(projectId, percent, step);
      this.gateway.emitRecrawlProgress(projectId, percent, step);
      this.gateway.emitProjectStatus(projectId);
      await new Promise(r => setTimeout(r, 800));
    }

    progressService.complete(projectId);
    this.gateway.emitProjectStatus(projectId);
    this.gateway.emitRecrawlEvent(projectId);

    setTimeout(() => progressService.clear(projectId), 2000);
  }
}
