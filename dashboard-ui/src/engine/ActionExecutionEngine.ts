import type { OrchestratedAction } from "@/engine/AutonomousFixOrchestrator";

export type ExecutionStatus = "success" | "skipped" | "failed";

export interface ExecutionResult {
  action: OrchestratedAction;
  status: ExecutionStatus;
  error?: string;
}

export interface ExecutionAdapters {
  triggerCiRerun?: (tests: string[], reason: string) => Promise<void>;
  resetEnvironment?: (environment: string, reason: string) => Promise<void>;
  applyHealing?: (testId: string, fix: string, reason: string) => Promise<void>;
  createIssue?: (
    requirementId: string,
    title: string,
    reason: string
  ) => Promise<void>;
  notifyTeam?: (message: string, reason: string) => Promise<void>;
  gateRelease?: (reason: string) => Promise<void>;
}

/**
 * Executes orchestrated actions using the provided adapters.
 * Missing adapters cause actions to be marked as "skipped".
 */
export async function executeOrchestratedActions(
  actions: OrchestratedAction[],
  adapters: ExecutionAdapters
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case "rerun-tests": {
          if (!adapters.triggerCiRerun) {
            results.push({ action, status: "skipped" });
            break;
          }
          await adapters.triggerCiRerun(action.tests, action.reason);
          results.push({ action, status: "success" });
          break;
        }

        case "reset-environment": {
          if (!adapters.resetEnvironment) {
            results.push({ action, status: "skipped" });
            break;
          }
          await adapters.resetEnvironment(action.environment, action.reason);
          results.push({ action, status: "success" });
          break;
        }

        case "apply-healing": {
          if (!adapters.applyHealing) {
            results.push({ action, status: "skipped" });
            break;
          }
          await adapters.applyHealing(
            action.testId,
            action.fix,
            action.reason
          );
          results.push({ action, status: "success" });
          break;
        }

        case "create-issue": {
          if (!adapters.createIssue) {
            results.push({ action, status: "skipped" });
            break;
          }
          await adapters.createIssue(
            action.requirementId,
            action.title,
            action.reason
          );
          results.push({ action, status: "success" });
          break;
        }

        case "notify-team": {
          if (!adapters.notifyTeam) {
            results.push({ action, status: "skipped" });
            break;
          }
          await adapters.notifyTeam(action.message, action.reason);
          results.push({ action, status: "success" });
          break;
        }

        case "gate-release": {
          if (!adapters.gateRelease) {
            results.push({ action, status: "skipped" });
            break;
          }
          await adapters.gateRelease(action.reason);
          results.push({ action, status: "success" });
          break;
        }

        default: {
          results.push({
            action,
            status: "skipped",
            error: "Unknown action type",
          });
        }
      }
    } catch (err: any) {
      results.push({
        action,
        status: "failed",
        error: err?.message ?? "Unknown error",
      });
    }
  }

  return results;
}
