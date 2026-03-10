export class OrchestratorConfig {
  static resolve(memory: any) {
    return memory?.current ?? {
      maxDepth: 2,
      maxPages: 10,
      maxActionsPerPage: 10,
      enableExploration: true,
      enableJourneys: true,
      enableScenarios: true,
      enableStateGraph: true,
      enableOptimization: true,
      enableRegression: true,
      enableSelfRefactor: true
    };
  }
}
