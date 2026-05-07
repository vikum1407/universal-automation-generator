import { useColors } from "@/hooks/useColors";
import { useRtmVersion } from "../state/rtmVersionStore";

export function RTMVersionSelector() {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P } = useColors();
  const { snapshot, versions, versionId, switchVersion, loading } = useRtmVersion();

  if (loading || !snapshot) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Version
      </span>
      <select
        value={versionId ?? ""}
        onChange={e => switchVersion(e.target.value)}
        style={{
          padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 600,
          border: `1px solid ${border}`, background: surface, color: text,
          cursor: "pointer", outline: "none",
        }}
      >
        {versions.map(v => (
          <option key={v.id} value={v.id}>
            v{v.versionNumber}{v.label ? ` — ${v.label}` : ""}
          </option>
        ))}
      </select>
      {snapshot && (
        <span style={{ fontSize: 10, color: muted }}>
          {new Date(snapshot.createdAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
