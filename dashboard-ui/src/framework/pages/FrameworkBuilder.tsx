import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

import { useFramework } from "../context/FrameworkContext";
import type { FrameworkNodeModel } from "../context/FrameworkContext";
import { useBuilderState } from "../builder/useBuilderState";
import { NodePalette }    from "../nodes/NodePalette";
import { BuilderCanvas }  from "../builder/BuilderCanvas";
import { NodeConfigPanel } from "../builder/NodeConfigPanel";
import { BlueprintPreview } from "../blueprint/BlueprintPreview";
import type { PaletteNodeDragData } from "../nodes/types";
import { DARK_TOKENS, LIGHT_TOKENS, CATEGORY_META } from "../nodes/types";

// ─── Dark mode ────────────────────────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Drag overlay card ────────────────────────────────────────────────────────

function DragPreviewCard({ node, S }: { node: FrameworkNodeModel; S: typeof DARK_TOKENS }) {
  const meta  = CATEGORY_META[node.category];
  const color = meta?.color ?? "#6B7280";
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 10,
      background: S.card, border: `2px solid ${color}`,
      boxShadow: `0 12px 36px rgba(0,0,0,0.3), 0 0 0 4px ${color}18`,
      display: "flex", alignItems: "center", gap: 8,
      minWidth: 180, maxWidth: 240, cursor: "grabbing",
      opacity: 0.95,
    }}>
      <div style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: S.text }}>{node.label}</span>
    </div>
  );
}

// ─── Framework + language color maps ─────────────────────────────────────────

const FW_COLORS:   Record<string, string> = { selenium: "#E25C1D", playwright: "#7B5FFF", cypress: "#17B26A", webdriverio: "#E8A000", appium: "#2563EB" };
const LANG_COLORS: Record<string, string> = { java: "#E76F00", typescript: "#3178C6", javascript: "#C4A000", python: "#3B82F6", csharp: "#9B59B6" };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FrameworkBuilder() {
  const navigate     = useNavigate();
  const dark         = useDarkMode();
  const S            = dark ? DARK_TOKENS : LIGHT_TOKENS;
  const { selection, result } = useFramework();
  const { addNode, reset, architecture, components } = useBuilderState();

  const [draggedNode,        setDraggedNode]        = useState<FrameworkNodeModel | null>(null);
  const [activeDragCategory, setActiveDragCategory] = useState<string | null>(null);
  const [showConfig,         setShowConfig]         = useState(true);
  const [toast,              setToast]              = useState<string | null>(null);

  // Guard: redirect if context missing (direct navigation)
  useEffect(() => {
    if (!result) navigate("/framework/start", { replace: true });
  }, [result, navigate]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as PaletteNodeDragData | undefined;
    if (data?.type === "palette-node") {
      setDraggedNode(data.node);
      setActiveDragCategory(data.node.category);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedNode(null);
    setActiveDragCategory(null);

    const { active, over } = event;
    if (!over) return;

    const data = active.data.current as PaletteNodeDragData | undefined;
    if (data?.type !== "palette-node") return;

    const node           = data.node;
    const targetCategory = (over.id as string).replace("slot-", "");

    if (node.category !== targetCategory) {
      showToast(`${node.label} belongs to "${CATEGORY_META[node.category]?.label ?? node.category}"`, 3000);
      return;
    }

    const result = addNode(node);
    if (!result.success && result.conflict) {
      showToast(result.conflict, 3500);
    }
  };

  const showToast = (msg: string, ms = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  if (!result || !selection) return null;

  const totalPlaced = (architecture ? 1 : 0) + components.length;
  const fwColor     = FW_COLORS[selection.framework]  ?? S.accent;
  const langColor   = LANG_COLORS[selection.language] ?? S.accent;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setDraggedNode(null); setActiveDragCategory(null); }}
    >
      <div style={{
        display: "flex", flexDirection: "column",
        height: "100vh", overflow: "hidden",
        background: S.bg,
      }}>

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "0 20px", height: 56, flexShrink: 0,
          background: S.card, borderBottom: `1px solid ${S.border}`,
          zIndex: 10,
        }}>
          <button
            onClick={() => navigate("/framework/start")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              color: S.textMuted, fontSize: 13, fontWeight: 500, padding: 0,
            }}
          >
            ← Back
          </button>

          <div style={{ width: 1, height: 18, background: S.border }} />

          {/* Selection pills */}
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
            background: `${fwColor}18`, color: fwColor, border: `1px solid ${fwColor}30`,
            textTransform: "capitalize",
          }}>
            {selection.framework}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
            background: `${langColor}18`, color: langColor, border: `1px solid ${langColor}30`,
            textTransform: "capitalize",
          }}>
            {selection.language}
          </span>

          {/* Step badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10,
            background: `${S.accent}14`, color: S.accent,
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Step 2 of 5
          </span>

          <div style={{ flex: 1 }} />

          {/* Node count */}
          <span style={{ fontSize: 12, color: S.textMuted }}>
            <strong style={{ color: S.text }}>{totalPlaced}</strong> node{totalPlaced !== 1 ? "s" : ""} placed
          </span>

          {/* Config panel toggle */}
          <button
            onClick={() => setShowConfig(v => !v)}
            style={{
              fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 7,
              border: `1px solid ${S.border}`,
              background: showConfig ? `${S.accent}14` : "transparent",
              color: showConfig ? S.accent : S.textMuted,
              cursor: "pointer",
            }}
          >
            ⚙ Config
          </button>

          {/* Reset */}
          <button
            onClick={reset}
            style={{
              fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 7,
              border: `1px solid ${S.border}`, background: "transparent",
              color: S.textMuted, cursor: "pointer",
            }}
          >
            ↺ Reset
          </button>

          {/* Next step */}
          <button
            onClick={() => navigate("/framework/review")}
            disabled={totalPlaced === 0}
            style={{
              fontSize: 13, fontWeight: 700, padding: "7px 20px", borderRadius: 8,
              background: totalPlaced > 0 ? S.accent : S.border,
              color: totalPlaced > 0 ? "#fff" : S.textMuted,
              border: "none", cursor: totalPlaced > 0 ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            Review →
          </button>
        </div>

        {/* ── Main layout ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Left: Node Palette */}
          <NodePalette S={S} />

          {/* Center: Builder Canvas */}
          <BuilderCanvas activeDragCategory={activeDragCategory} S={S} />

          {/* Right: Node Config Panel */}
          {showConfig && (
            <div style={{
              width: 280, flexShrink: 0,
              borderLeft: `1px solid ${S.border}`,
              background: S.card,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 18px 10px",
                borderBottom: `1px solid ${S.border}`,
                fontSize: 10, fontWeight: 800, color: S.textMuted,
                textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                Node Config
              </div>
              <NodeConfigPanel S={S} />
            </div>
          )}
        </div>

        {/* ── Bottom: Blueprint Preview ─────────────────────────────────── */}
        <BlueprintPreview S={S} />

        {/* ── Drag overlay ─────────────────────────────────────────────── */}
        <DragOverlay dropAnimation={null}>
          {draggedNode && <DragPreviewCard node={draggedNode} S={S} />}
        </DragOverlay>

        {/* ── Toast notification ────────────────────────────────────────── */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: "#1a1a2e", color: "#fff",
            padding: "10px 20px", borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 1000,
            border: "1px solid #EF444440",
          }}>
            {toast}
          </div>
        )}
      </div>
    </DndContext>
  );
}
