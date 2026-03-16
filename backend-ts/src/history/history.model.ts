export interface HistoryRun {
  id: string;
  project: string;
  timestamp: string;

  rtm: any;
  execution?: any;
  analytics?: any;
  insights?: any;

  releaseReadinessScore: number;
}

export interface SaveHistoryRequest {
  project: string;
  rtm: any;
  execution?: any;
  analytics?: any;
  insights?: any;
}

export interface HistoryRecord {
  id: string;
  project: string;
  timestamp: number;
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
  results: any[];
  raw: {
    stdout: string;
    stderr: string;
  };
}
