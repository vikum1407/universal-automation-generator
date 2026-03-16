export interface TestFile {
  name: string;
  content: string;
}

export interface TestFilesProvider {
  getTestFiles(project: string): Promise<TestFile[]>;
}
