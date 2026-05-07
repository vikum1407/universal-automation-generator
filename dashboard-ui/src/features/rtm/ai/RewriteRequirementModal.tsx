import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import {
  rewriteRequirement, acceptRewrite,
  type RtmDomainRequirement, type RewriteResult,
} from "@/api/rtm";

interface Props {
  req:       RtmDomainRequirement;
  projectId: string;
  versionId: string;
  onClose:   () => void;
  onAccepted: () => void;
}

type RewriteMode = "clarity" | "testability" | "full";

const MODE_LABELS: Record<RewriteMode, { label: string; desc: string }> = {
  clarity:     { label: "Clarity",     desc: "Remove ambiguity, fix grammar, improve readability" },
  testability: { label: "Testability", desc: "Add acceptance criteria, measurable outcomes" },
  full:        { label: "Full rewrite", desc: "Maximum improvement: clarity + testability + structure" },
};

export function RewriteRequirementModal({ req, projectId, versionId, onClose, onAccepted }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [mode,     setMode]     = useState<RewriteMode>("full");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<RewriteResult | null>(null);
  const [accepted, setAccepted] = useState(false);

  async function handleRewrite() {
    setLoading(true);
    setResult(null);
    try {
      const res = await rewriteRequirement(projectId, versionId, req.id, mode);
      setResult(res);
    } catch {
      toast.error("Rewrite failed. Check that the AI service is configured.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!result) return;
    try {
      await acceptRewrite(projectId, versionId, req.id, result.improvedTitle, result.improvedDescription);
      setAccepted(true);
      toast.success("Requirement updated");
      onAccepted();
      onClose();
    } catch {
      toast.error("Failed to save rewrite");
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)" }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div style={{
          background: surface, border: `1px solid ${border}`, borderRadius: 14,
          width: "100%", maxWidth: 700, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.24)",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 22px", borderBottom: `1px solid ${border}`,
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: text }}>Rewrite with AI</div>
              <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                <span style={{ fontWeight: 700, color: P }}>{req.key}</span> — {req.title}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: muted, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Mode selector */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Rewrite Mode
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(Object.entries(MODE_LABELS) as [RewriteMode, { label: string; desc: string }][]).map(([m, { label, desc }]) => (
                  <label key={m} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                    background: mode === m ? `${P}0a` : bg,
                    border: `1px solid ${mode === m ? P + "44" : border}`,
                  }}>
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === m}
                      onChange={() => setMode(m)}
                      style={{ marginTop: 2, accentColor: P, cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{label}</div>
                      <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Rewrite button */}
            <button
              onClick={handleRewrite}
              disabled={loading}
              style={{
                alignSelf: "flex-start", padding: "9px 22px", borderRadius: 8,
                background: loading ? border : P, color: loading ? muted : "#fff",
                fontSize: 12, fontWeight: 700, border: "none",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Rewriting…" : "✦ Rewrite Requirement"}
            </button>

            {/* Result: side-by-side diff */}
            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Rationale */}
                <div style={{
                  padding: "10px 14px", borderRadius: 8,
                  background: `${P}09`, border: `1px solid ${P}30`,
                  fontSize: 12, color: text, lineHeight: 1.6,
                }}>
                  <span style={{ fontWeight: 700, color: P }}>✦ AI: </span>
                  {result.rationale}
                </div>

                {/* Title comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Original Title</div>
                    <div style={{ padding: "10px 12px", background: bg, border: `1px solid ${border}`, borderRadius: 8, fontSize: 12, color: text }}>{req.title}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Improved Title</div>
                    <div style={{ padding: "10px 12px", background: "#10B98108", border: "1px solid #10B98130", borderRadius: 8, fontSize: 12, color: text, fontWeight: 600 }}>{result.improvedTitle}</div>
                  </div>
                </div>

                {/* Description comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Original Description</div>
                    <div style={{ padding: "10px 12px", background: bg, border: `1px solid ${border}`, borderRadius: 8, fontSize: 12, color: text, lineHeight: 1.6 }}>{req.description || <span style={{ color: muted }}>No description</span>}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Improved Description</div>
                    <div style={{ padding: "10px 12px", background: "#10B98108", border: "1px solid #10B98130", borderRadius: 8, fontSize: 12, color: text, lineHeight: 1.6 }}>{result.improvedDescription}</div>
                  </div>
                </div>

                {/* Acceptance criteria */}
                {result.acceptanceCriteria?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      Suggested Acceptance Criteria
                    </div>
                    <div style={{ padding: "12px 14px", background: "#10B98108", border: "1px solid #10B98130", borderRadius: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      {result.acceptanceCriteria.map((ac, i) => (
                        <div key={i} style={{ fontSize: 12, color: text, display: "flex", gap: 8 }}>
                          <span style={{ color: "#10B981", flexShrink: 0, fontWeight: 700 }}>✓</span>
                          <span>{ac}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {result && !accepted && (
            <div style={{ padding: "14px 22px", borderTop: `1px solid ${border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setResult(null)}
                style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${border}`, background: "transparent", color: muted, cursor: "pointer" }}
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                style={{ padding: "8px 22px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", background: "#10B981", color: "#fff", cursor: "pointer" }}
              >
                ✓ Accept & Save
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
