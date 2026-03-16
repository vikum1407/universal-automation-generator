export interface PRDiff {
  component: string;
  selector?: string;
  pattern?: string;
}

export interface PRDiffsProvider {
  getPRDiffs(project: string): Promise<PRDiff[]>;
}
