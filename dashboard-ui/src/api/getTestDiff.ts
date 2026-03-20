import type { DiffResponse } from "./types/DiffResponse";
import type { MultiFrameworkOutput } from "@/engine/orchestrator/MultiFrameworkTypes";
import { generateUnifiedDiff } from "@/engine/diff/DiffEngine";

export function getTestDiffHandler(context: any, testId: string): DiffResponse {
  const previous = context.previousGenerated as MultiFrameworkOutput | null;
  const current = context.currentGenerated as MultiFrameworkOutput;

  const prevContent = previous
    ? previous.playwright?.[testId] ||
      previous.cypress?.[testId] ||
      previous.selenium?.[testId] ||
      previous.restassured?.[testId] ||
      null
    : null;

  const currContent =
    current.playwright?.[testId] ||
    current.cypress?.[testId] ||
    current.selenium?.[testId] ||
    current.restassured?.[testId] ||
    null;

  const diff = generateUnifiedDiff(prevContent ?? "", currContent ?? "");

  return {
    previous: prevContent,
    current: currContent,
    diff,
  };
}
