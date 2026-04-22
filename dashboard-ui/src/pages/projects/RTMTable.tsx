import { useEffect, useState } from "react";
import { theme } from "@/theme";
import type { RTMResponse, RTMRequirementView } from "@/api/rtm";

import RTMTableHeader from "./RTMTableHeader";
import RTMTableRow from "./RTMTableRow";
import RTMRegenerateModal from "./RTMRegenerateModal";

const API_BASE = "http://localhost:3000";

export default function RTMTable({ projectId }: { projectId: string }) {
  const [rtm, setRtm] = useState<RTMResponse | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RTMRequirementView | null>(null);

  const load = () => {
    fetch(`${API_BASE}/projects/${projectId}/rtm`)
      .then(res => res.json())
      .then(data => setRtm(data)); // IMPORTANT: use full backend response
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const openRegenerate = (req: RTMRequirementView) => {
    setSelectedReq(req);
    setRegenOpen(true);
  };

  const closeRegenerate = () => {
    setRegenOpen(false);
    setSelectedReq(null);
  };

  const regenerate = async (reqId: string) => {
    await fetch(`${API_BASE}/projects/${projectId}/rtm/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedIds: [reqId] })
    });

    load();
    closeRegenerate();
  };

  if (!rtm || !rtm.rtm || !rtm.rtm.requirements) return null;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ color: theme.colors.primary }}>
        Requirements Traceability Matrix
      </h3>

      <div
        style={{
          marginTop: 16,
          border: `1px solid ${border}`,
          borderRadius: 12,
          overflow: "hidden",
          background: theme.colors.background,
          boxShadow: theme.shadow.card
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <RTMTableHeader />

          <tbody>
            {rtm.rtm.requirements.map((req, idx) => (
              <RTMTableRow
                key={req.id}
                req={req}
                idx={idx}
                onRegenerate={() => openRegenerate(req)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <RTMRegenerateModal
        open={regenOpen}
        onClose={closeRegenerate}
        onRegenerate={regenerate}
        requirement={
          selectedReq
            ? { id: selectedReq.id, title: selectedReq.title }
            : null
        }
      />
    </div>
  );
}
