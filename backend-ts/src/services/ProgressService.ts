class ProgressService {
  private progress: Record<string, {
    percent: number;
    step: string;
    status: string;
  }> = {};

  init(projectId: string, status: string) {
    this.progress[projectId] = {
      percent: 0,
      step: "Starting…",
      status,
    };
  }

  update(projectId: string, percent: number, step: string) {
    if (!this.progress[projectId]) return;
    this.progress[projectId].percent = percent;
    this.progress[projectId].step = step;
  }

  complete(projectId: string) {
    if (!this.progress[projectId]) return;
    this.progress[projectId].percent = 100;
    this.progress[projectId].step = "Completed";
    this.progress[projectId].status = "ready";
  }

  fail(projectId: string, step: string) {
    if (!this.progress[projectId]) return;
    this.progress[projectId].percent = 100;
    this.progress[projectId].step = step;
    this.progress[projectId].status = "failed";
  }

  get(projectId: string) {
    return this.progress[projectId] || null;
  }
}

export const progressService = new ProgressService();
