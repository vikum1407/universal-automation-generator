import { useReleaseGates } from "../../hooks/useReleaseGates";
import { useReleaseBlockers } from "../../hooks/useReleaseBlockers";
import { useReleaseRisks } from "../../hooks/useReleaseRisks";
import { useReleaseChecklist } from "../../hooks/useReleaseChecklist";

import { ReleaseGatePanel } from "./ReleaseGatePanel";
import { ReleaseBlockerPanel } from "./ReleaseBlockerPanel";
import { ReleaseRiskMatrix } from "./ReleaseRiskMatrix";
import { ReleaseChecklist } from "./ReleaseChecklist";

export function ReleaseReadinessPanel() {
  const { data: gates } = useReleaseGates();
  const { data: blockers } = useReleaseBlockers();
  const { data: risks } = useReleaseRisks();
  const { data: checklist } = useReleaseChecklist();

  return (
    <div className="space-y-8">
      <ReleaseGatePanel gates={gates} />
      <ReleaseBlockerPanel items={blockers} />
      <ReleaseRiskMatrix items={risks} />
      <ReleaseChecklist items={checklist} />
    </div>
  );
}
