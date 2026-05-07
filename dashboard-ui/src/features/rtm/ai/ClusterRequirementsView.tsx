import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import { clusterRequirements, type RequirementCluster, type RtmDomainRequirement } from "@/api/rtm";

interface Props {
  projectId:    string;
  versionId:    string;
  requirements: RtmDomainRequirement[];
  onClose:      () => void;
}

export function ClusterRequirementsView({ projectId, versionId, requirements, onClose }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [loading,  setLoading]  = useState(false);
  const [clusters, setClusters] = useState<RequirementCluster[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const reqMap = new Map(requirements.map(r => [r.id, r]));

  const toggle = (id: string) =>
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  async function handleCluster() {
    setLoading(true);
    try {
      const result = await clusterRequirements(projectId, versionId);
      setClusters(result);
      setExpanded(new Set(result.map(c => c.clusterId)));
      if (result.length === 0) toast("No clusters found — try adding more requirements first.");
    } catch {
      toast.error("Clustering failed. Check that the AI service is configured.");
    } finally {
      setLoading(false);
    }
  }

  const CLUSTER_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)" }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div style={{
          background: surface, border: `1px solid ${border}`, borderRadius: 14,
          width: "100%", maxWidth: 860, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.24)",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 22px", borderBottom: `1px solid ${border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: text }}>Cluster with AI</div>
              <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                {requirements.length} requirements · AI groups by theme, detects duplicates & conflicts
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {!clusters && (
                <button
                  onClick={handleCluster}
                  disabled={loading}
                  style={{
                    padding: "8px 20px", borderRadius: 8,
                    background: loading ? border : P, color: loading ? muted : "#fff",
                    fontSize: 12, fontWeight: 700, border: "none",
                    cursor: loading ? "wait" : "pointer",
                  }}
                >
                  {loading ? "Clustering…" : "✦ Run Clustering"}
                </button>
              )}
              {clusters && (
                <button
                  onClick={handleCluster}
                  disabled={loading}
                  style={{ padding: "7px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: `1px solid ${border}`, background: "transparent", color: muted, cursor: loading ? "wait" : "pointer" }}
                >
                  {loading ? "Re-clustering…" : "↻ Re-cluster"}
                </button>
              )}
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: muted, cursor: "pointer" }}>×</button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
            {!clusters && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
                <div style={{ fontSize: 36, opacity: 0.2 }}>◈</div>
                <div style={{ fontSize: 13, color: muted }}>Click "Run Clustering" to group your requirements.</div>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", justifyContent: "center", padding: 60, color: muted, fontSize: 13 }}>
                Analyzing {requirements.length} requirements…
              </div>
            )}

            {clusters && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {clusters.map((cluster, ci) => {
                  const color   = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
                  const isOpen  = expanded.has(cluster.clusterId);
                  const members = cluster.requirementIds.map(id => reqMap.get(id)).filter(Boolean) as RtmDomainRequirement[];

                  return (
                    <div key={cluster.clusterId} style={{
                      border: `1px solid ${border}`, borderRadius: 10, overflow: "hidden",
                    }}>
                      {/* Cluster header */}
                      <div
                        onClick={() => toggle(cluster.clusterId)}
                        style={{
                          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                          background: `${color}09`, cursor: "pointer",
                          borderBottom: isOpen ? `1px solid ${border}` : "none",
                        }}
                      >
                        <div style={{ width: 4, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: text }}>{cluster.label}</div>
                          <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>
                            {members.length} requirement{members.length !== 1 ? "s" : ""}
                            {cluster.duplicates.length > 0 && (
                              <span style={{ marginLeft: 8, color: "#FFA726" }}>
                                · {cluster.duplicates.length / 2} duplicate pair{cluster.duplicates.length > 2 ? "s" : ""}
                              </span>
                            )}
                            {cluster.conflicts.length > 0 && (
                              <span style={{ marginLeft: 8, color: "#EF4444" }}>
                                · {cluster.conflicts.length / 2} conflict{cluster.conflicts.length > 2 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: muted, fontWeight: 700 }}>{isOpen ? "▾" : "▸"}</span>
                      </div>

                      {/* Members */}
                      {isOpen && (
                        <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6, background: bg }}>
                          {members.length === 0 && (
                            <div style={{ fontSize: 11, color: muted, padding: "8px 0" }}>No matching requirements found (IDs may be stale).</div>
                          )}
                          {members.map(req => {
                            const isDuplicate = cluster.duplicates.includes(req.id);
                            const isConflict  = cluster.conflicts.includes(req.id);
                            return (
                              <div key={req.id} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "8px 10px", borderRadius: 7,
                                background: surface, border: `1px solid ${border}`,
                              }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color }}>{req.key}</span>
                                <span style={{ fontSize: 12, color: text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.title}</span>
                                {isDuplicate && (
                                  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#FFA72618", color: "#FFA726", border: "1px solid #FFA72644" }}>DUPLICATE</span>
                                )}
                                {isConflict && (
                                  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "#EF535018", color: "#EF5350", border: "1px solid #EF535044" }}>CONFLICT</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
