class ProgressService {
  private map = new Map<
    string,
    { status: string; percent: number; step: string }
  >();

  init(projectId: string, status: string = "processing") {
    this.map.set(projectId, {
      status,
      percent: 0,
      step: "Starting…"
    });
  }

  update(projectId: string, percent: number, step: string) {
    const entry = this.map.get(projectId);
    if (!entry) return;

    entry.percent = percent;
    entry.step = step;

    // Always keep status as "processing" during pipeline
    if (entry.status !== "failed" && entry.status !== "ready") {
      entry.status = "processing";
    }
  }

  complete(projectId: string) {
    const entry = this.map.get(projectId);
    if (!entry) return;

    entry.percent = 100;
    entry.step = "Completed";

    // Match DB + UI expectations
    entry.status = "ready";
  }

  fail(projectId: string, step: string) {
    const entry = this.map.get(projectId);
    if (!entry) return;

    entry.percent = 100;
    entry.step = step;
    entry.status = "failed";
  }

  clear(projectId: string) {
    this.map.delete(projectId);
  }

  get(projectId: string) {
    return this.map.get(projectId) || null;
  }
}

export const progressService = new ProgressService();
