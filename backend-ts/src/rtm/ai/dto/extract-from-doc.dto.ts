export class ExtractFromDocDto {
  projectId:    string;
  rtmVersionId: string;
  content:      string;
  source?:      'paste' | 'openapi' | 'confluence' | 'jira';
}
