import { useState, useRef } from "react";
import { useColors } from "@/hooks/useColors";
import type { ImportSource, RTMSnapshot } from "@/api/rtm";
import { importRTM, initializeRTM } from "@/api/rtm";
import toast from "react-hot-toast";

interface Props {
  projectId: string;
  onImported: (snapshot: RTMSnapshot) => void;
  onClose:    () => void;
}

const SOURCES: { id: ImportSource; label: string; hint: string }[] = [
  { id: "csv",  label: "CSV",  hint: "Columns: key, title, description, type, priority, risk, status, tags" },
  { id: "jira", label: "Jira CSV", hint: "Jira CSV export (File → Export → CSV)" },
  { id: "json", label: "JSON", hint: '{ requirements: [...], journeys: [...], endpoints: [...] }' },
];

export function RTMImportModal({ projectId, onImported, onClose }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [source, setSource]   = useState<ImportSource>("csv");
  const [rawText, setRawText] = useState("");
  const [label, setLabel]     = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hint = SOURCES.find(s => s.id === source)?.hint ?? "";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRawText(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!rawText.trim()) { toast.error("Paste or upload content first"); return; }
    setLoading(true);
    try {
      let payload: string | object = rawText;
      if (source === "json") {
        try { payload = JSON.parse(rawText); }
        catch { toast.error("Invalid JSON"); setLoading(false); return; }
      }
      const snapshot = await importRTM(projectId, source, payload, label || undefined);
      toast.success(`Imported ${snapshot.requirements.length} requirements (v${snapshot.versionNumber})`);
      onImported(snapshot);
    } catch (err: any) {
      toast.error(err?.message ?? "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const { snapshot } = await initializeRTM(projectId, "Initial");
      toast.success("RTM initialised (empty v1)");
      onImported(snapshot);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to initialise RTM");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 560, maxHeight: "90vh", overflowY: "auto",
          background: surface, border: `1px solid ${border}`,
          borderRadius: 16, padding: 28,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          display: "flex", flexDirection: "column", gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: text }}>Import RTM</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
              Creates a new immutable version from your data
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: muted, lineHeight: 1 }}
          >×</button>
        </div>

        {/* Source selector */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Source Format
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {SOURCES.map(s => (
              <button
                key={s.id}
                onClick={() => setSource(s.id)}
                style={{
                  padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: source === s.id ? 700 : 400,
                  border: `1px solid ${source === s.id ? P : border}`,
                  background: source === s.id ? `${P}1A` : "transparent",
                  color: source === s.id ? P : muted,
                  cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: muted, marginTop: 6, fontStyle: "italic" }}>{hint}</div>
        </div>

        {/* File upload */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Upload File or Paste Content
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={source === "json" ? ".json" : ".csv,.txt"}
            onChange={handleFile}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: `1px dashed ${border}`, background: bg, color: muted,
              cursor: "pointer", marginBottom: 10, display: "block",
            }}
          >
            Choose file…
          </button>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={source === "json" ? '{\n  "requirements": [{"key":"REQ-001","title":"..."}]\n}' : "key,title,description,type,priority,risk,status,tags\nREQ-001,User Login,..."}
            rows={8}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 12px", borderRadius: 8, fontSize: 12,
              fontFamily: "monospace", resize: "vertical",
              border: `1px solid ${border}`, background: bg, color: text,
              outline: "none",
            }}
          />
        </div>

        {/* Version label */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Version Label (optional)
          </div>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Sprint 5 import"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px", borderRadius: 8, fontSize: 13,
              border: `1px solid ${border}`, background: bg, color: text, outline: "none",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            onClick={handleInitialize}
            disabled={loading}
            style={{
              padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: `1px solid ${border}`, background: "transparent", color: muted,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Initialize Empty RTM
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: `1px solid ${border}`, background: "transparent", color: text,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !rawText.trim()}
            style={{
              padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: "none",
              background: loading || !rawText.trim() ? "#ccc" : P,
              color: "#fff",
              cursor: loading || !rawText.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
