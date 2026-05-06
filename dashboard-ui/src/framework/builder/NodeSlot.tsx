import { useDroppable } from "@dnd-kit/core";
import type { StyleTokens } from "../nodes/types";
import { CATEGORY_META } from "../nodes/types";
import type { BuilderNodeInstance } from "./useBuilderState";
import { NodeInstanceCard } from "./NodeInstanceCard";

interface NodeSlotProps {
  category: string;
  instances: BuilderNodeInstance[];
  activeDragCategory: string | null;
  S: StyleTokens;
}

export function NodeSlot({ category, instances, activeDragCategory, S }: NodeSlotProps) {
  const meta   = CATEGORY_META[category] ?? { label: category, color: "#6B7280" };
  const isCompatibleDrop = activeDragCategory === category;

  const { setNodeRef, isOver } = useDroppable({
    id:   `slot-${category}`,
    data: { category },
  });

  const glowing  = isOver && isCompatibleDrop;
  const pulsing  = activeDragCategory !== null && isCompatibleDrop && !isOver;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Category header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
      }}>
        <div style={{ width: 4, height: 14, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {meta.label}
        </span>
        {instances.length > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: meta.color,
            background: `${meta.color}15`, borderRadius: 8, padding: "0 5px",
          }}>
            {instances.length}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          minHeight: instances.length === 0 ? 64 : "auto",
          borderRadius: 12,
          border: glowing
            ? `2px solid ${meta.color}`
            : pulsing
            ? `2px dashed ${meta.color}80`
            : instances.length === 0
            ? `1.5px dashed ${S.border}`
            : "none",
          background: glowing
            ? `${meta.color}12`
            : pulsing
            ? `${meta.color}06`
            : "transparent",
          transition: "all 0.15s",
          padding: instances.length === 0 ? 0 : 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Placed nodes */}
        {instances.map(inst => (
          <NodeInstanceCard key={inst.instanceId} instance={inst} S={S} />
        ))}

        {/* Empty drop target */}
        {instances.length === 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: 64,
            color: pulsing || glowing ? meta.color : S.textDim,
            fontSize: 12, fontWeight: 500,
            transition: "color 0.15s",
          }}>
            {glowing ? `Drop ${meta.label} here` : `+ drag ${meta.label} node here`}
          </div>
        )}
      </div>
    </div>
  );
}
