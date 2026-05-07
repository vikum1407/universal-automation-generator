import { useState, useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import type {
  DiscoveredFlow, DiscoveredEndpoint, MappingSuggestions,
  RtmMappingStrength,
} from "@/api/rtm";

type ModalMode = "flow" | "endpoint";

interface Props {
  mode:         ModalMode;
  suggestions:  MappingSuggestions;
  allFlows:     DiscoveredFlow[];
  allEndpoints: DiscoveredEndpoint[];
  onLink:       (id: string, strength: RtmMappingStrength) => void;
  onClose:      () => void;
}

const METHOD_COLOR: Record<string, string> = {
  GET: "#4CAF50", POST: "#2196F3", PUT: "#FF9800",
  PATCH: "#9C27B0", DELETE: "#F44336",
};

export function RTMMappingModal({
  mode, suggestions, allFlows, allEndpoints, onLink, onClose,
}: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [search, setSearch]       = useState("");
  const [strength, setStrength]   = useState<RtmMappingStrength>("primary");
  const [selected, setSelected]   = useState<string | null>(null);

  const suggestedIds = mode === "flow"
    ? new Set(suggestions.suggestedFlows.map(f => f.id))
    : new Set(suggestions.suggestedEndpoints.map(e => e.id));

  const q = search.toLowerCase();

  const filteredFlows = allFlows.filter(f =>
    !q || f.name.toLowerCase().includes(q)
  );
  const filteredEndpoints = allEndpoints.filter(e =>
    !q || e.path.toLowerCase().includes(q) || e.method.toLowerCase().includes(q)
  );

  const items = mode === "flow" ? filteredFlows : filteredEndpoints;
  const suggestedList = mode === "flow"
    ? suggestions.suggestedFlows
    : suggestions.suggestedEndpoints;

  const label = (item: DiscoveredFlow | DiscoveredEndpoint) =>
    mode === "flow"
      ? (item as DiscoveredFlow).name
      : `${(item as DiscoveredEndpoint).method}  ${(item as DiscoveredEndpoint).path}`;

  const handleLink = () => {
    if (!selected) return;
    onLink(selected, strength);
  };

  const rowStyle = (id: string): React.CSSProperties => ({
    padding: "9px 14px",
    borderRadius: 8,
    cursor: "pointer",
    border: `1px solid ${selected === id ? P : border}`,
    background: selected === id ? `${P}14` : bg,
    marginBottom: 6,
    display: "flex",
    alignItems: "center",
    gap: 8,
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520, maxHeight: "85vh", overflowY: "auto",
          background: surface, border: `1px solid ${border}`,
          borderRadius: 16, padding: 26,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          display: "flex", flexDirection: "column", gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: text }}>
            Link {mode === "flow" ? "UI Flow" : "API Endpoint"}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: muted }}
          >×</button>
        </div>

        {/* Suggested section */}
        {suggestedList.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              AI Suggestions
            </div>
            {suggestedList.map(item => (
              <div
                key={item.id}
                onClick={() => setSelected(item.id)}
                style={rowStyle(item.id)}
              >
                {mode === "endpoint" && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                    background: `${METHOD_COLOR[(item as DiscoveredEndpoint).method] ?? "#999"}22`,
                    color: METHOD_COLOR[(item as DiscoveredEndpoint).method] ?? "#999",
                    minWidth: 44, textAlign: "center",
                  }}>
                    {(item as DiscoveredEndpoint).method}
                  </span>
                )}
                <span style={{ fontSize: 13, color: text, flex: 1 }}>{label(item)}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: "#4CAF5022", color: "#4CAF50",
                }}>
                  {item.score}% match
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={mode === "flow" ? "Search flows…" : "Search by method or path…"}
          style={{
            padding: "8px 12px", borderRadius: 8, fontSize: 13,
            border: `1px solid ${border}`, background: bg, color: text, outline: "none",
          }}
        />

        {/* All items */}
        <div style={{ maxHeight: 280, overflowY: "auto" }}>
          {items.length === 0 && (
            <div style={{ textAlign: "center", color: muted, fontSize: 13, padding: "24px 0" }}>
              {mode === "flow"
                ? "No UI flows discovered yet. Run a UI scan first."
                : "No API endpoints discovered yet. Run an API scan first."}
            </div>
          )}
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => setSelected(item.id)}
              style={rowStyle(item.id)}
            >
              {mode === "endpoint" && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: `${METHOD_COLOR[(item as DiscoveredEndpoint).method] ?? "#999"}22`,
                  color: METHOD_COLOR[(item as DiscoveredEndpoint).method] ?? "#999",
                  minWidth: 44, textAlign: "center",
                }}>
                  {(item as DiscoveredEndpoint).method}
                </span>
              )}
              <span style={{ fontSize: 13, color: text, flex: 1 }}>{label(item)}</span>
              {suggestedIds.has(item.id) && (
                <span style={{ fontSize: 10, color: P, fontWeight: 600 }}>suggested</span>
              )}
            </div>
          ))}
        </div>

        {/* Strength */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Mapping Strength
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["primary", "secondary"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStrength(s)}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: strength === s ? 700 : 400,
                  border: `1px solid ${strength === s ? P : border}`,
                  background: strength === s ? `${P}1A` : "transparent",
                  color: strength === s ? P : muted,
                  cursor: "pointer", textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: `1px solid ${border}`, background: "transparent", color: text, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={!selected}
            style={{
              padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: "none", background: selected ? P : "#ccc", color: "#fff",
              cursor: selected ? "pointer" : "not-allowed",
            }}
          >
            Link
          </button>
        </div>
      </div>
    </div>
  );
}
