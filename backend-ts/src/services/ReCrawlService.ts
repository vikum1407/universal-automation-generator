import { progressService } from "./ProgressService";

export class ReCrawlService {
  constructor(private io) {}

  async recrawl(projectId: string) {
    progressService.init(projectId, "recrawling");
    this.emit(projectId);

    const steps: [string, number][] = [
      ["Cleaning old project…", 10],
      ["Resetting database…", 25],
      ["Re‑scanning website…", 50],
      ["Generating updated tests…", 75],
      ["Finalizing…", 95],
    ];

    for (const [step, percent] of steps) {
      progressService.update(projectId, percent, step);

      this.io.to(projectId).emit("recrawl-progress", {
        percent,
        step,
      });

      this.emit(projectId);

      await new Promise((r) => setTimeout(r, 800));
    }

    progressService.complete(projectId);
    this.emit(projectId);

    this.io.to(projectId).emit("recrawl-event", {
      event: "recrawl-completed",
      projectId,
    });
  }

  private emit(projectId: string) {
    const p = progressService.get(projectId);
    if (!p) return;

    this.io.to(projectId).emit("project-status", {
      status: p.status,
      progressPercent: p.percent,
      progressStep: p.step,
    });
  }
}
