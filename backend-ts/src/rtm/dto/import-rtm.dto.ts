export type ImportSource = 'csv' | 'jira' | 'json';

export class ImportRtmDto {
  projectId: string;
  source:    ImportSource;
  payload:   any;          // raw parsed content (string for csv/jira, object for json)
  label?:    string;       // e.g. "Sprint 5 import"
  createdBy?: string;
}
