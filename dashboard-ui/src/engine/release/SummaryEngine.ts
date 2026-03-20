export function buildReleaseSummary(model: any, sync: any, evolution: any) {
  const totalTests = model.tests.length;
  const changedTests =
    (evolution?.updatedTests?.length ?? 0) +
    (evolution?.addedTests?.length ?? 0) +
    (evolution?.removedTests?.length ?? 0);

  const drift = sync?.drift?.length ?? 0;

  const stability =
    model.tests.reduce((acc: number, t: any) => acc + (t.stability ?? 1), 0) /
    totalTests;

  return {
    totalTests,
    changedTests,
    drift,
    stability,
    generatedAt: new Date().toISOString(),
  };
}
