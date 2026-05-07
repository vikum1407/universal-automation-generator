import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import {
  extractRequirementsFromText,
  type ExtractedRequirement,
} from "@/api/rtm";

interface Props {
  projectId: string;
  versionId: string;
  onClose:   () => void;
  onImported: () => void;
}

const RISK_COLOR: Record<string, string> = { high: "#EF4444", medium: "#FFA726", low: "#4CAF50" };
const PRI_COLOR:  Record<string, string>  = { P0: "#EF4444", P1: "#F97316", P2: "#FFA726", P3: "#9E9E9E" };

export function ExtractRequirementsModal({ projectId, versionId, onClose, onImported }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [content,   setContent]   = useState("");
  const [source,    setSource]    = useState<"paste" | "openapi" | "confluence">("paste");
  const [loading,   setLoading]   = useState(false);
  const [preview,   setPreview]   = useState<ExtractedRequirement[] | null>(null);
  const [imported,  setImported]  = useState(false);

  const placeholders: Record<string, string> = {
    paste:      "Paste your requirements document, user story, meeting notes, or product spec here…",
    openapi:    "Paste your OpenAPI/Swagger JSON or YAML specification here…",
    confluence: "Paste the Confluence page text content here…",
  };

  async function handleExtract() {
    if (!content.trim()) return;
    setLoading(true);
    setPreview(null);
    try {
      const result = await extractRequirementsFromText(projectId, versionId, content);
      setPreview(result.requirements);
      if (result.extracted === 0) toast("No requirements found in the provided text.");
    } catch {
      toast.error("Extraction failed. Check that the AI service is configured.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setImported(true);
    toast.success(`${preview?.length ?? 0} requirements imported into RTM`);
    onImported();
    onClose();
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)" }}
      />
      <div style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div style={{
          background: surface, border: `1px solid ${border}`, borderRadius: 14,
          width: "100%", maxWidth: 760, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.24)",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 22px", borderBottom: `1px solid ${border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: text }}>Import with AI</div>
              <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                Extract structured requirements from any document
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: muted, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Source selector */}
            <div style={{ display: "flex", gap: 8 }}>
              {(["paste", "openapi", "confluence"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  style={{
                    padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: source === s ? 700 : 500,
                    border: `1px solid ${source === s ? P : border}`,
                    background: source === s ? `${P}1A` : "transparent",
                    color: source === s ? P : muted, cursor: "pointer",
                  }}
                >
                  {s === "paste" ? "Text / Markdown" : s === "openapi" ? "OpenAPI" : "Confluence"}
                </button>
              ))}
            </div>

            {/* Text area */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={placeholders[source]}
              rows={10}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${border}`, background: bg, color: text,
                fontSize: 12, fontFamily: "monospace", resize: "vertical",
                boxSizing: "border-box", outline: "none", lineHeight: 1.5,
              }}
            />

            {/* Extract button */}
            <button
              onClick={handleExtract}
              disabled={loading || !content.trim()}
              style={{
                alignSelf: "flex-start", padding: "9px 22px", borderRadius: 8,
                background: loading || !content.trim() ? border : P,
                color: loading || !content.trim() ? muted : "#fff",
                fontSize: 13, fontWeight: 700, border: "none",
                cursor: loading ? "wait" : !content.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Extracting…" : "✦ Extract Requirements"}
            </button>

            {/* Preview */}
            {preview && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: text }}>
                  {preview.length} requirement{preview.length !== 1 ? "s" : ""} extracted
                </div>
                {preview.map((req, i) => (
                  <div key={i} style={{
                    background: bg, border: `1px solid ${border}`, borderRadius: 10,
                    padding: "12px 14px",
                  }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: `${RISK_COLOR[req.risk] ?? "#9E9E9E"}18`, color: RISK_COLOR[req.risk] ?? "#9E9E9E", border: `1px solid ${RISK_COLOR[req.risk] ?? "#9E9E9E"}44` }}>
                        {req.risk}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: `${PRI_COLOR[req.priority] ?? "#9E9E9E"}18`, color: PRI_COLOR[req.priority] ?? "#9E9E9E", border: `1px solid ${PRI_COLOR[req.priority] ?? "#9E9E9E"}44` }}>
                        {req.priority}
                      </span>
                      <span style={{ fontSize: 10, color: muted }}>{req.type}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 4 }}>{req.title}</div>
                    <div style={{ fontSize: 11, color: muted, lineHeight: 1.6, marginBottom: 8 }}>{req.description}</div>
                    {req.acceptanceCriteria?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Acceptance Criteria</div>
                        {req.acceptanceCriteria.map((ac, ai) => (
                          <div key={ai} style={{ fontSize: 11, color: text, padding: "3px 0", display: "flex", gap: 6 }}>
                            <span style={{ color: P, flexShrink: 0 }}>·</span>
                            <span>{ac}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {preview && preview.length > 0 && (
            <div style={{ padding: "14px 22px", borderTop: `1px solid ${border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={onClose}
                style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${border}`, background: "transparent", color: muted, cursor: "pointer" }}
              >
                Discard
              </button>
              <button
                onClick={handleImport}
                disabled={imported}
                style={{ padding: "8px 22px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", background: P, color: "#fff", cursor: imported ? "not-allowed" : "pointer" }}
              >
                {imported ? "Imported" : `Import ${preview.length} Requirements`}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
