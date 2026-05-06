import { useState } from "react";
import type { StyleTokens } from "../nodes/types";
import { CATEGORY_META } from "../nodes/types";
import type { BuilderNodeInstance } from "./useBuilderState";
import { useBuilderState } from "./useBuilderState";

interface NodeInstanceCardProps {
  instance: BuilderNodeInstance;
  S: StyleTokens;
}

export function NodeInstanceCard({ instance, S }: NodeInstanceCardProps) {
  const { selectedInstanceId, removeNode, selectNode } = useBuilderState();
  const [hovered, setHovered] = useState(false);

  const isSelected = selectedInstanceId === instance.instanceId;
  const meta       = CATEGORY_META[instance.category];
  const color      = meta?.color ?? "#6B7280";

  const hasConflictInBuilder = false; // conflict detection shown via NodeSlot

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => selectNode(isSelected ? null : instance.instanceId)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10,
        border: isSelected
          ? `2px solid ${color}`
          : `1.5px solid ${hovered ? color + "50" : S.border}`,
        background: isSelected ? `${color}10` : hovered ? `${color}06` : S.card,
        cursor: "pointer", transition: "all 0.13s",
        position: "relative",
        boxShadow: isSelected ? `0 0 0 3px ${color}18` : "none",
      }}
    >
      {/* Color dot */}
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: color, flexShrink: 0,
        boxShadow: isSelected ? `0 0 6px ${color}` : "none",
      }} />

      {/* Label + category */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? color : S.text }}>
          {instance.nodeLabel}
        </div>
        {Object.keys(instance.config).length > 0 && (
          <div style={{ fontSize: 10, color: S.textMuted, marginTop: 2 }}>
            {Object.keys(instance.config).length} config value(s) set
          </div>
        )}
      </div>

      {/* Config indicator */}
      {instance.configSchema && Object.keys(instance.configSchema).length > 0 && (
        <span title="Has configuration" style={{
          fontSize: 10, color: S.textMuted, opacity: 0.6,
        }}>
          ⚙
        </span>
      )}

      {/* Remove button */}
      <button
        onClick={e => { e.stopPropagation(); removeNode(instance.instanceId); }}
        title="Remove"
        style={{
          width: 20, height: 20, borderRadius: "50%",
          border: "none", cursor: "pointer",
          background: hovered ? "#EF444420" : "transparent",
          color: hovered ? "#EF4444" : S.textDim,
          fontSize: 13, lineHeight: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.13s", flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
