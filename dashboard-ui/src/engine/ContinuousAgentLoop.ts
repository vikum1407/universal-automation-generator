import type { StabilitySnapshot } from "@/types/StabilitySnapshot";
import { orchestrateFixes } from "@/engine/AutonomousFixOrchestrator";
import {
  executeOrchestratedActions,
  type ExecutionAdapters,
  type ExecutionResult,
} from "@/engine/ActionExecutionEngine";

export interface SnapshotProvider {
  getLatestSnapshot: () => Promise<StabilitySnapshot | null>;
}

export interface AgentLoopOptions {
  intervalMs: number;
  onCycleStart?: () => void;
  onCycleEnd?: (results: ExecutionResult[]) => void;
  onError?: (error: any) => void;
}

/**
 * A continuous loop that:
 * 1. Fetches the latest snapshot
 * 2. Runs the orchestrator
 * 3. Executes resulting actions
 * 4. Repeats on a fixed interval
 */
export class ContinuousAgentLoop {
  private running = false;
  private timer: any = null;

  private provider: SnapshotProvider;
  private adapters: ExecutionAdapters;
  private options: AgentLoopOptions;

  constructor(
    provider: SnapshotProvider,
    adapters: ExecutionAdapters,
    options: AgentLoopOptions
  ) {
    this.provider = provider;
    this.adapters = adapters;
    this.options = options;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.scheduleNext();
  }

  stop() {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
  }

  private scheduleNext() {
    if (!this.running) return;
    this.timer = setTimeout(() => this.runCycle(), this.options.intervalMs);
  }

  private async runCycle() {
    try {
      this.options.onCycleStart?.();

      const snapshot = await this.provider.getLatestSnapshot();
      if (!snapshot) {
        this.options.onCycleEnd?.([]);
        this.scheduleNext();
        return;
      }

      const actions = orchestrateFixes(snapshot);
      const results = await executeOrchestratedActions(
        actions,
        this.adapters
      );

      this.options.onCycleEnd?.(results);
    } catch (err) {
      this.options.onError?.(err);
    }

    this.scheduleNext();
  }
}
