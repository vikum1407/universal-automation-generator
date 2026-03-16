export interface NightlyFailure {
  component: string;
  failureCount: number;
}

export interface NightlyFailuresProvider {
  getNightlyFailures(project: string): Promise<NightlyFailure[]>;
}
