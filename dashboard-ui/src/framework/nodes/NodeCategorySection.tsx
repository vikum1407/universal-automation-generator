import { useState } from "react";
import type { FrameworkNodeModel } from "../context/FrameworkContext";
import type { StyleTokens } from "./types";
import { CATEGORY_META } from "./types";
import { NodeCard } from "./NodeCard";

interface NodeCategorySectionProps {
  category: string;
  nodes: FrameworkNodeModel[];
  S: StyleTokens;
}

export function NodeCategorySection({ category, nodes, S }: NodeCategorySectionProps) {
  const meta  = CATEGORY_META[category] ?? { label: category, color: "#6B7280" };
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 7, width: "100%",
          background: "none", border: "none", cursor: "pointer",
          padding: "3px 0 7px", textAlign: "left",
        }}
      >
        <div style={{ width: 3, height: 12, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {meta.label}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, color: meta.color,
          background: `${meta.color}15`, borderRadius: 8, padding: "0 5px",
        }}>
          {nodes.length}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: S.textDim }}>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {/* Node list */}
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {nodes.map(node => (
            <NodeCard key={node.id} node={node} S={S} />
          ))}
        </div>
      )}
    </div>
  );
}
