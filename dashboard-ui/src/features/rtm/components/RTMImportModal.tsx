import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import { importRTM, initializeRTM, type ImportSource } from "@/api/rtm";

interface Props {
  projectId: string;
  onClose:   () => void;
  onDone:    () => void;
}

type SourceTab = ImportSource | "initialize";

export function RTMImportModal({ projectId, onClose, onDone }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [tab,       setTab]       = useState<SourceTab>("json");
  const [label,     setLabel]     = useState("");
  const [jsonText,  setJsonText]  = useState("");
  const [csvText,   setCsvText]   = useState("");
  const [jiraQuery, setJiraQuery] = useState("project = MY_PROJECT AND issuetype = Story");
  const [loading,   setLoading]   = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "8px 12px", borderRadius: 8, fontSize: 12,
    border: `1px solid ${border}`, background: bg, color: text, outline: "none",
  };

  async function handleSubmit() {
    setLoading(true);
    try {
      if (tab === "initialize") {
        await initializeRTM(projectId, label || "Initial");
        toast.success("RTM initialized");
      } else {
        const payload = tab === "json" ? jsonText.trim() : tab === "csv" ? csvText.trim() : jiraQuery.trim();
        if (!payload) { toast.error("Provide the import payload"); return; }
        await importRTM(projectId, tab, payload, label || undefined);
        toast.success("RTM imported successfully");
      }
      onDone();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed");
    } finally {
      setLoading(false);
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: active ? 700 : 500,
    border: `1px solid ${active ? P : border}`,
    background: active ? `${P}1A` : "transparent",
    color: active ? P : muted, cursor: "pointer",
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: 28, width: 520, maxHeight: "88vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: text }}>Import RTM</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>
              Create a new versioned RTM from an external source
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: muted, cursor: "pointer" }}>×</button>
        </div>

        {/* Source tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "initialize" as SourceTab, label: "Initialize (Empty)" },
            { id: "json"       as SourceTab, label: "JSON" },
            { id: "csv"        as SourceTab, label: "CSV" },
            { id: "jira"       as SourceTab, label: "Jira" },
          ].map(s => (
            <button key={s.id} onClick={() => setTab(s.id)} style={tabStyle(tab === s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Version label */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>
            Version label (optional)
          </label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Sprint 12 baseline" style={inputStyle} />
        </div>

        {/* Source-specific inputs */}
        {tab === "initialize" && (
          <div style={{ padding: "14px 16px", borderRadius: 10, background: `${P}08`, border: `1px solid ${P}22`, fontSize: 12, color: muted }}>
            Creates a fresh empty RTM version. You can add requirements manually afterward.
          </div>
        )}

        {tab === "json" && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>
              Paste JSON requirements array
            </label>
            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              rows={8}
              placeholder={'[{"key":"REQ-001","title":"User login","priority":"P0","risk":"high",...}]'}
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}
            />
          </div>
        )}

        {tab === "csv" && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>
              Paste CSV content
            </label>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={8}
              placeholder={"key,title,type,priority,risk,status\nREQ-001,User login,functional,P0,high,approved"}
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}
            />
          </div>
        )}

        {tab === "jira" && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>
              Jira JQL Query
            </label>
            <input value={jiraQuery} onChange={e => setJiraQuery(e.target.value)} style={inputStyle} />
            <div style={{ fontSize: 10, color: muted, marginTop: 4 }}>
              Jira integration must be configured in Settings for this to work.
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${border}`, paddingTop: 16 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${border}`, background: "transparent", color: muted, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", background: loading ? "#ccc" : P, color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Importing…" : tab === "initialize" ? "Initialize" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
