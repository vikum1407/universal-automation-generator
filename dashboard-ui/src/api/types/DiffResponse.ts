export interface DiffResponse {
  previous: string | null;
  current: string | null;
  diff: string;
}
