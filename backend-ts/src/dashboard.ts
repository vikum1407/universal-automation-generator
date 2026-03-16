import { createDashboardApi } from './dashboard/dashboard-generator';

export const dashboard = (outputDir: string) => {
  return createDashboardApi(outputDir);
};
