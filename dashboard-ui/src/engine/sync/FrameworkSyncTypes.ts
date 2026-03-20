export interface FrameworkSyncResult {
  missing: string[];
  outdated: string[];
  drift: string[];
  regenerated: string[];
  summary: string;
}
