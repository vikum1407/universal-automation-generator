import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { FrameworkNodeModel } from "../context/FrameworkContext";
import type { StyleTokens } from "./types";
import { CATEGORY_META } from "./types";
import { useBuilderState } from "../builder/useBuilderState";

interface NodeCardProps {
  node: FrameworkNodeModel;
  S: StyleTokens;
}

export function NodeCard({ node, S }: NodeCardProps) {
  const { architecture, components } = useBuilderState();
  const isPlaced =
    architecture?.nodeId === node.id ||
    components.some(c => c.nodeId === node.id);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   `palette-${node.id}`,
    data: { type: "palette-node", node },
  });

  const [hovered, setHovered] = useState(false);
  const meta  = CATEGORY_META[node.category];
  const color = meta?.color ?? "#6B7280";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column",
        padding: "10px 12px", borderRadius: 9,
        border: isPlaced
          ? `1.5px solid ${color}55`
          : `1.5px solid ${hovered ? color + "50" : S.border}`,
        background: isPlaced
          ? `${color}0d`
          : hovered ? `${color}06` : S.card,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.4 : 1,
        transition: "all 0.13s",
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Required badge */}
      {node.constraints.required && (
        <div style={{
          position: "absolute", top: 7, right: 7,
          fontSize: 8, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.06em", color: "#F97316",
          background: "#F9731618", borderRadius: 3, padding: "1px 5px",
        }}>
          Required
        </div>
      )}

      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
        {isPlaced
          ? <span style={{ fontSize: 10, color }}>✓</span>
          : <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
        }
        <span style={{
          fontSize: 12.5, fontWeight: isPlaced ? 700 : 600,
          color: isPlaced ? color : S.text,
          lineHeight: 1.2,
        }}>
          {node.label}
        </span>
      </div>

      {/* Description */}
      {node.metadata.description && (
        <p style={{
          fontSize: 10.5, color: S.textMuted,
          margin: 0, lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {node.metadata.description}
        </p>
      )}

      {/* Capability dots */}
      {(node.capabilities.supportsParallel || node.capabilities.hasAIIntegration) && (
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {node.capabilities.supportsParallel && (
            <span style={{ fontSize: 9, color: "#10B981", background: "#10B98112", borderRadius: 3, padding: "1px 4px" }}>
              ⚡
            </span>
          )}
          {node.capabilities.hasAIIntegration && (
            <span style={{ fontSize: 9, color: "#A78BFA", background: "#A78BFA12", borderRadius: 3, padding: "1px 4px" }}>
              ✦ AI
            </span>
          )}
        </div>
      )}
    </div>
  );
}
