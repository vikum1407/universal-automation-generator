import { useModuleDependencies } from "../../hooks/useModuleDependencies";
import { useNetworkDependencies } from "../../hooks/useNetworkDependencies";
import { useTestCoupling } from "../../hooks/useTestCoupling";

import { ModuleDependencyGraph } from "./ModuleDependencyGraph";
import { NetworkDependencyGraph } from "./NetworkDependencyGraph";
import { TestCouplingGraph } from "./TestCouplingGraph";

export function DependencyPanel({ runId }: { runId: string }) {
  const { data: modules } = useModuleDependencies(runId);
  const { data: network } = useNetworkDependencies(runId);
  const { data: coupling } = useTestCoupling();

  return (
    <div className="space-y-8">
      <ModuleDependencyGraph edges={modules} />
      <NetworkDependencyGraph deps={network} />
      <TestCouplingGraph edges={coupling} />
    </div>
  );
}
