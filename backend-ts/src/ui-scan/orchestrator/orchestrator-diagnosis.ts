export class OrchestratorDiagnosis {
  diagnose(failures: any[], requirements: any[]) {
    return failures.map((f) => {
      const req = requirements.find((r: any) => f.title.includes(r.description));

      return {
        title: f.title,
        file: f.file,
        rootCause: req
          ? `Test for requirement "${req.id}" failed.`
          : 'Test failed.',
        suggestion: req
          ? `Review selector "${req.selector}".`
          : 'Review failing test.',
        confidence: req ? 0.8 : 0.5
      };
    });
  }
}
