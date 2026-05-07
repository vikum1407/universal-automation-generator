import { useState, useEffect, useCallback } from "react";
import { useColors } from "@/hooks/useColors";
import {
  fetchRTMSnapshot, listRTMVersions, activateRTMVersion,
  type RTMSnapshot, type RtmVersion, type RtmDomainRequirement,
  type RtmPriority, type RtmRisk, type RtmRequirementStatus,
} from "@/api/rtm";
import { RTMImportModal } from "./RTMImportModal";
import { RTMMappingDrawer } from "./RTMMappingDrawer";
import toast from "react-hot-toast";

// ─── Badge helpers ──────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<RtmPriority, string> = {
  P0: "#EF5350", P1: "#FF7043", P2: "#FFA726", P3: "#66BB6A",
};
const RISK_COLOR: Record<RtmRisk, string> = {
  high: "#EF5350", medium: "#FFA726", low: "#66BB6A",
};
const STATUS_BG: Record<RtmRequirementStatus, string> = {
  approved: "#e8f5e9", draft: "#f3e5f5", deprecated: "#fafafa",
};
const STATUS_COLOR: Record<RtmRequirementStatus, string> = {
  approved: "#2e7d32", draft: "#7B1FA2", deprecated: "#9E9E9E",
};

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700,
      background: bg, color,
    }}>
      {label}
    </span>
  );
}

// ─── Version selector ──────────────────────────────────────────────────────

function VersionBar({
  versions, activeId, onActivate,
}: {
  versions: RtmVersion[];
  activeId: string;
  onActivate: (id: string) => void;
}) {
  const { BDR: border, TXT2: muted, P, CARD: surface } = useColors();
  if (versions.length <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Version:
      </span>
      {versions.map(v => {
        const active = v.id === activeId;
        return (
          <button
            key={v.id}
            onClick={() => !active && onActivate(v.id)}
            style={{
              padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: active ? 700 : 400,
              border: `1px solid ${active ? P : border}`,
              background: active ? `${P}1A` : surface,
              color: active ? P : muted,
              cursor: active ? "default" : "pointer",
            }}
          >
            v{v.versionNumber}{v.label ? ` — ${v.label}` : ""}
          </button>
        );
      })}
    </div>
  );
}

// ─── Requirements table ────────────────────────────────────────────────────

function RequirementRow({
  req, border, onSelect,
}: {
  req: RtmDomainRequirement;
  border: string;
  onSelect: () => void;
}) {
  const { TXT: text, TXT2: muted, P } = useColors();
  return (
    <tr
      onClick={onSelect}
      style={{ borderBottom: `1px solid ${border}`, cursor: "pointer" }}
      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = `${P}08`}
      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}
    >
      <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: muted, whiteSpace: "nowrap" }}>
        {req.key}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13, color: text }}>
        <div style={{ fontWeight: 600 }}>{req.title}</div>
        {req.description && (
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{req.description}</div>
        )}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <Badge label={req.priority} bg={`${PRIORITY_COLOR[req.priority]}22`} color={PRIORITY_COLOR[req.priority]} />
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <Badge label={req.risk} bg={`${RISK_COLOR[req.risk]}22`} color={RISK_COLOR[req.risk]} />
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <Badge
          label={req.status}
          bg={STATUS_BG[req.status]}
          color={STATUS_COLOR[req.status]}
        />
      </td>
      <td style={{ padding: "10px 12px", fontSize: 11, color: muted }}>
        {req.tags.join(", ") || "—"}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <span style={{ fontSize: 11, color: P, fontWeight: 600 }}>Map →</span>
      </td>
    </tr>
  );
}

// ─── Main domain view ──────────────────────────────────────────────────────

interface Props {
  projectId: string;
}

export function RTMDomainView({ projectId }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [snapshot, setSnapshot] = useState<RTMSnapshot | null>(null);
  const [versions, setVersions] = useState<RtmVersion[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RtmDomainRequirement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [snap, vers] = await Promise.all([
        fetchRTMSnapshot(projectId),
        listRTMVersions(projectId),
      ]);
      setSnapshot(snap);
      setVersions(vers);
    } catch {
      // silently handle — snapshot === null means "not initialised"
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleActivate = async (versionId: string) => {
    try {
      await activateRTMVersion(projectId, versionId);
      toast.success("Version activated");
      await load();
    } catch {
      toast.error("Failed to activate version");
    }
  };

  const handleImported = (newSnapshot: RTMSnapshot) => {
    setSnapshot(newSnapshot);
    setImportOpen(false);
    load();
  };

  // Filter requirements
  const filtered = (snapshot?.requirements ?? []).filter(r => {
    const matchSearch = !search
      || r.key.toLowerCase().includes(search.toLowerCase())
      || r.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const thStyle: React.CSSProperties = {
    padding: "9px 12px", fontSize: 11, fontWeight: 700,
    color: muted, textTransform: "uppercase", letterSpacing: "0.06em",
    background: bg, textAlign: "left", whiteSpace: "nowrap",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: muted, fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Top bar: version info + import button ────────────────── */}
      <div style={{
        background: surface, border: `1px solid ${border}`,
        borderRadius: 12, padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        {snapshot ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: text }}>
                v{snapshot.versionNumber}
                {snapshot.label && <span style={{ color: muted, fontWeight: 400 }}> — {snapshot.label}</span>}
              </div>
              <div style={{ fontSize: 11, color: muted }}>
                {snapshot.requirements.length} requirements · {snapshot.journeys.length} journeys · {snapshot.endpoints.length} endpoints
              </div>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
              <VersionBar versions={versions} activeId={snapshot.versionId} onActivate={handleActivate} />
              <button
                onClick={() => setImportOpen(true)}
                style={{
                  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: "none", background: P, color: "#fff", cursor: "pointer",
                }}
              >
                + Import RTM
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ color: muted, fontSize: 13 }}>
              No RTM domain model found for this project.
            </div>
            <button
              onClick={() => setImportOpen(true)}
              style={{
                marginLeft: "auto",
                padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: "none", background: P, color: "#fff", cursor: "pointer",
              }}
            >
              + Import / Initialize RTM
            </button>
          </>
        )}
      </div>

      {/* ── Requirements table ───────────────────────────────────── */}
      {snapshot && snapshot.requirements.length > 0 && (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>

          {/* Table toolbar */}
          <div style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", borderBottom: `1px solid ${border}`, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by key or title…"
              style={{
                padding: "7px 12px", borderRadius: 8, fontSize: 12,
                border: `1px solid ${border}`, background: bg, color: text, outline: "none", minWidth: 200,
              }}
            />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{
                padding: "7px 10px", borderRadius: 8, fontSize: 12,
                border: `1px solid ${border}`, background: bg, color: text, outline: "none",
              }}
            >
              <option value="all">All Types</option>
              <option value="functional">Functional</option>
              <option value="nonFunctional">Non-Functional</option>
              <option value="technical">Technical</option>
              <option value="regression">Regression</option>
            </select>
            <span style={{ marginLeft: "auto", fontSize: 12, color: muted }}>
              {filtered.length} / {snapshot.requirements.length}
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  <th style={thStyle}>Key</th>
                  <th style={thStyle}>Title / Description</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Priority</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Risk</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
                  <th style={thStyle}>Tags</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Mappings</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <RequirementRow
                    key={r.id}
                    req={r}
                    border={border}
                    onSelect={() => setSelectedReq(r)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Import modal ─────────────────────────────────────────── */}
      {importOpen && (
        <RTMImportModal
          projectId={projectId}
          onImported={handleImported}
          onClose={() => setImportOpen(false)}
        />
      )}

      {/* ── Mapping drawer ───────────────────────────────────────── */}
      {selectedReq && snapshot && (
        <RTMMappingDrawer
          projectId={projectId}
          versionId={snapshot.versionId}
          requirement={selectedReq}
          onClose={() => setSelectedReq(null)}
        />
      )}
    </div>
  );
}
