import { useState, useMemo } from "react";
import type { StyleTokens } from "./types";
import { CATEGORY_META } from "./types";
import { useFramework } from "../context/FrameworkContext";
import { NodeCategorySection } from "./NodeCategorySection";

interface NodePaletteProps {
  S: StyleTokens;
}

export function NodePalette({ S }: NodePaletteProps) {
  const { result } = useFramework();
  const [search, setSearch] = useState("");

  const byCategory = useMemo(() => {
    if (!result) return {};
    const nodes = result.nodes;
    const filtered = search.trim()
      ? nodes.filter(n =>
          n.label.toLowerCase().includes(search.toLowerCase()) ||
          n.category.toLowerCase().includes(search.toLowerCase()) ||
          n.metadata.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
          n.metadata.description.toLowerCase().includes(search.toLowerCase())
        )
      : nodes;

    const map: Record<string, typeof nodes> = {};
    filtered.forEach(n => {
      if (!map[n.category]) map[n.category] = [];
      map[n.category].push(n);
    });
    return map;
  }, [result, search]);

  const sortedCategories = Object.entries(byCategory)
    .sort(([a], [b]) => {
      const oa = CATEGORY_META[a]?.order ?? 99;
      const ob = CATEGORY_META[b]?.order ?? 99;
      return oa - ob;
    });

  const totalVisible = sortedCategories.reduce((s, [, nodes]) => s + nodes.length, 0);

  return (
    <div style={{
      width: 264, flexShrink: 0,
      borderRight: `1px solid ${S.border}`,
      background: S.bg,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 14px 10px",
        borderBottom: `1px solid ${S.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Node Library
          </span>
          <span style={{ fontSize: 10, color: S.textDim }}>
            {totalVisible} node{totalVisible !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 10px", borderRadius: 8,
          border: `1px solid ${S.border}`, background: S.card,
        }}>
          <span style={{ color: S.textDim, fontSize: 12 }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: S.text, fontSize: 12,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: S.textDim, fontSize: 12 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Node list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 20px" }}>
        {sortedCategories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: S.textDim, fontSize: 12 }}>
            {search ? `No nodes match "${search}"` : "No nodes available."}
          </div>
        ) : (
          sortedCategories.map(([cat, nodes]) => (
            <NodeCategorySection key={cat} category={cat} nodes={nodes} S={S} />
          ))
        )}
      </div>

      {/* Drag hint */}
      <div style={{
        padding: "8px 14px 10px",
        borderTop: `1px solid ${S.border}`,
        fontSize: 10, color: S.textDim, textAlign: "center",
      }}>
        Drag nodes onto the canvas →
      </div>
    </div>
  );
}
