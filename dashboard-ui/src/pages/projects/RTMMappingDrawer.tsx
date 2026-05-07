import { useState, useEffect, useCallback } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import type {
  RtmDomainRequirement, RequirementMappingSummary,
  MappingSuggestions, DiscoveredFlow, DiscoveredEndpoint,
  RtmMappingStrength,
} from "@/api/rtm";
import {
  getRequirementMappings, getRequirementSuggestions,
  listDiscoveredFlows, listDiscoveredEndpoints,
  linkRequirementToFlow, unlinkRequirementFromFlow,
  linkRequirementToEndpoint, unlinkRequirementFromEndpoint,
} from "@/api/rtm";
import { RTMMappingModal } from "./RTMMappingModal";

const PRIORITY_COLOR: Record<string, string> = {
  P0: "#EF5350", P1: "#FF7043", P2: "#FFA726", P3: "#66BB6A",
};
const RISK_COLOR: Record<string, string> = {
  high: "#EF5350", medium: "#FFA726", low: "#66BB6A",
};
const METHOD_COLOR: Record<string, string> = {
  GET: "#4CAF50", POST: "#2196F3", PUT: "#FF9800",
  PATCH: "#9C27B0", DELETE: "#F44336",
};

interface Props {
  projectId:   string;
  versionId:   string;
  requirement: RtmDomainRequirement;
  onClose:     () => void;
}

export function RTMMappingDrawer({ projectId, versionId, requirement, onClose }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [mappings,   setMappings]   = useState<RequirementMappingSummary | null>(null);
  const [suggestions, setSuggestions] = useState<MappingSuggestions>({ suggestedFlows: [], suggestedEndpoints: [] });
  const [allFlows,    setAllFlows]    = useState<DiscoveredFlow[]>([]);
  const [allEndpoints, setAllEndpoints] = useState<DiscoveredEndpoint[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState<"flow" | "endpoint" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, s, f, e] = await Promise.all([
        getRequirementMappings(projectId, versionId, requirement.id),
        getRequirementSuggestions(projectId, versionId, requirement.id),
        listDiscoveredFlows(projectId, versionId),
        listDiscoveredEndpoints(projectId, versionId),
      ]);
      setMappings(m);
      setSuggestions(s);
      setAllFlows(f);
      setAllEndpoints(e);
    } catch {
      // non-fatal — mappings may not exist yet
    } finally {
      setLoading(false);
    }
  }, [projectId, versionId, requirement.id]);

  useEffect(() => { load(); }, [load]);

  const handleLinkFlow = async (flowId: string, strength: RtmMappingStrength) => {
    try {
      await linkRequirementToFlow(projectId, versionId, requirement.id, flowId, strength);
      toast.success("UI flow linked");
      setModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to link flow");
    }
  };

  const handleUnlinkFlow = async (flowId: string) => {
    try {
      await unlinkRequirementFromFlow(projectId, versionId, requirement.id, flowId);
      toast.success("UI flow removed");
      await load();
    } catch {
      toast.error("Failed to remove flow");
    }
  };

  const handleLinkEndpoint = async (endpointId: string, strength: RtmMappingStrength) => {
    try {
      await linkRequirementToEndpoint(projectId, versionId, requirement.id, endpointId, strength);
      toast.success("Endpoint linked");
      setModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to link endpoint");
    }
  };

  const handleUnlinkEndpoint = async (endpointId: string) => {
    try {
      await unlinkRequirementFromEndpoint(projectId, versionId, requirement.id, endpointId);
      toast.success("Endpoint removed");
      await load();
    } catch {
      toast.error("Failed to remove endpoint");
    }
  };

  const sectionHead = (label: string) => (
    <div style={{
      fontSize: 11, fontWeight: 700, color: muted,
      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10,
    }}>
      {label}
    </div>
  );

  const chipBtn = (label: string, onClick: () => void, accent?: string) => (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
        border: `1px solid ${accent ?? border}`,
        background: accent ? `${accent}14` : "transparent",
        color: accent ?? muted, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.2)", backdropFilter: "blur(1px)",
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420, zIndex: 101,
        background: surface, borderLeft: `1px solid ${border}`,
        overflowY: "auto", display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 22px 16px", borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4 }}>
              {requirement.key}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: text, lineHeight: 1.3 }}>
              {requirement.title}
            </div>
            {requirement.description && (
              <div style={{ fontSize: 12, color: muted, marginTop: 6, lineHeight: 1.5 }}>
                {requirement.description}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, background: `${PRIORITY_COLOR[requirement.priority]}22`, color: PRIORITY_COLOR[requirement.priority] }}>
                {requirement.priority}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, background: `${RISK_COLOR[requirement.risk]}22`, color: RISK_COLOR[requirement.risk] }}>
                {requirement.risk} risk
              </span>
              <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 600, background: `${border}`, color: muted }}>
                {requirement.type}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: muted, lineHeight: 1, flexShrink: 0 }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 24 }}>

          {loading && (
            <div style={{ color: muted, fontSize: 13, textAlign: "center", paddingTop: 40 }}>
              Loading mappings…
            </div>
          )}

          {!loading && (
            <>
              {/* ── Linked UI Flows ── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  {sectionHead(`Linked UI Flows (${mappings?.uiFlows.length ?? 0})`)}
                  <button
                    onClick={() => setModal("flow")}
                    style={{
                      padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                      border: "none", background: P, color: "#fff", cursor: "pointer",
                    }}
                  >
                    + Add Flow
                  </button>
                </div>

                {(mappings?.uiFlows.length ?? 0) === 0 ? (
                  <div style={{ fontSize: 12, color: muted, padding: "10px 0" }}>
                    No UI flows linked yet.
                    {suggestions.suggestedFlows.length > 0 && (
                      <span style={{ color: P, marginLeft: 4 }}>
                        {suggestions.suggestedFlows.length} suggestion{suggestions.suggestedFlows.length > 1 ? "s" : ""} available.
                      </span>
                    )}
                  </div>
                ) : (
                  mappings!.uiFlows.map(f => (
                    <div key={f.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", borderRadius: 8,
                      border: `1px solid ${border}`, background: bg,
                      marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 13, color: text, flex: 1 }}>{f.name}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                        background: f.strength === "primary" ? `${P}1A` : `${border}`,
                        color: f.strength === "primary" ? P : muted,
                      }}>
                        {f.strength}
                      </span>
                      <button
                        onClick={() => handleUnlinkFlow(f.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: muted, padding: 2 }}
                        title="Remove"
                      >×</button>
                    </div>
                  ))
                )}
              </div>

              {/* ── Linked API Endpoints ── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  {sectionHead(`Linked API Endpoints (${mappings?.endpoints.length ?? 0})`)}
                  <button
                    onClick={() => setModal("endpoint")}
                    style={{
                      padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                      border: "none", background: P, color: "#fff", cursor: "pointer",
                    }}
                  >
                    + Add Endpoint
                  </button>
                </div>

                {(mappings?.endpoints.length ?? 0) === 0 ? (
                  <div style={{ fontSize: 12, color: muted, padding: "10px 0" }}>
                    No API endpoints linked yet.
                    {suggestions.suggestedEndpoints.length > 0 && (
                      <span style={{ color: P, marginLeft: 4 }}>
                        {suggestions.suggestedEndpoints.length} suggestion{suggestions.suggestedEndpoints.length > 1 ? "s" : ""} available.
                      </span>
                    )}
                  </div>
                ) : (
                  mappings!.endpoints.map(e => (
                    <div key={e.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", borderRadius: 8,
                      border: `1px solid ${border}`, background: bg,
                      marginBottom: 6,
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: `${METHOD_COLOR[e.method] ?? "#999"}22`,
                        color: METHOD_COLOR[e.method] ?? "#999",
                        minWidth: 44, textAlign: "center",
                      }}>
                        {e.method}
                      </span>
                      <span style={{ fontSize: 12, color: text, flex: 1, fontFamily: "monospace" }}>{e.path}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                        background: e.strength === "primary" ? `${P}1A` : `${border}`,
                        color: e.strength === "primary" ? P : muted,
                      }}>
                        {e.strength}
                      </span>
                      <button
                        onClick={() => handleUnlinkEndpoint(e.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: muted, padding: 2 }}
                        title="Remove"
                      >×</button>
                    </div>
                  ))
                )}
              </div>

              {/* ── Linked Journeys (read-only) ── */}
              {(mappings?.journeys.length ?? 0) > 0 && (
                <div>
                  {sectionHead(`In Journeys (${mappings!.journeys.length})`)}
                  {mappings!.journeys.map(j => (
                    <div key={j.id} style={{
                      padding: "7px 12px", borderRadius: 8,
                      border: `1px solid ${border}`, background: bg,
                      marginBottom: 6, fontSize: 12, color: text,
                    }}>
                      {j.name}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Tags ── */}
              {requirement.tags.length > 0 && (
                <div>
                  {sectionHead("Tags")}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {requirement.tags.map(t => (
                      <span key={t} style={{
                        padding: "3px 8px", borderRadius: 5, fontSize: 11,
                        background: border, color: muted,
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Flow picker modal */}
      {modal === "flow" && (
        <RTMMappingModal
          mode="flow"
          suggestions={suggestions}
          allFlows={allFlows}
          allEndpoints={allEndpoints}
          onLink={handleLinkFlow}
          onClose={() => setModal(null)}
        />
      )}

      {/* Endpoint picker modal */}
      {modal === "endpoint" && (
        <RTMMappingModal
          mode="endpoint"
          suggestions={suggestions}
          allFlows={allFlows}
          allEndpoints={allEndpoints}
          onLink={handleLinkEndpoint}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
