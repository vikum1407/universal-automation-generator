export interface SyncResponse {
  missing: string[];
  outdated: string[];
  drift: string[];
  regenerated: string[];
  summary: string;
}
