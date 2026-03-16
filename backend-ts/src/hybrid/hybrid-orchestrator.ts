import { createDashboardApi } from '../dashboard/dashboard-generator';

export class HybridOrchestrator {
  constructor(private readonly outputDir: string) {}

  getDashboard() {
    return createDashboardApi(this.outputDir);
  }
}
