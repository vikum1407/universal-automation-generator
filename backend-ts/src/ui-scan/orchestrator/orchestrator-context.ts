export class OrchestratorContext {
  constructor(public outputDir: string) {}

  pipelineMemory: any;
  existingReinforcement: any;
  existingRegression: any;
  existingRootCause: any;
}
