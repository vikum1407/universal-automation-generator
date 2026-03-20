export type GuardrailStatus = "pass" | "warn" | "fail";

export interface Guardrail {
  name: string;
  status: GuardrailStatus;
  details: string;
}

export interface ReadinessResult {
  score: number;
  guardrails: Guardrail[];
}

export function computeReadiness(model: any, sync: any, evolution: any): ReadinessResult {
  const totalTests = model.tests.length;
  const drift = sync?.drift?.length ?? 0;
  const regenerated = evolution?.updatedTests?.length ?? 0;

  const stability =
    model.tests.reduce((acc: number, t: any) => acc + (t.stability ?? 1), 0) /
    totalTests;

  const score = Math.max(
    0,
    100 -
      drift * 5 -
      regenerated * 2 +
      Math.floor(stability * 10)
  );

  const driftStatus: GuardrailStatus =
    drift === 0 ? "pass" : drift < 5 ? "warn" : "fail";

  const stabilityStatus: GuardrailStatus =
    stability > 0.8 ? "pass" : stability > 0.6 ? "warn" : "fail";

  const regenStatus: GuardrailStatus =
    regenerated < 3 ? "pass" : regenerated < 10 ? "warn" : "fail";

  const guardrails: Guardrail[] = [
    {
      name: "Drift",
      status: driftStatus,
      details: `${drift} tests show drift`,
    },
    {
      name: "Stability",
      status: stabilityStatus,
      details: `Average stability: ${stability.toFixed(2)}`,
    },
    {
      name: "Regeneration",
      status: regenStatus,
      details: `${regenerated} tests regenerated`,
    },
  ];

  return { score, guardrails };
}
