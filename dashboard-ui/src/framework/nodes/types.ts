import type { FrameworkNodeModel } from "../context/FrameworkContext";

// ─── DnD payload ──────────────────────────────────────────────────────────────

export interface PaletteNodeDragData {
  type: "palette-node";
  node: FrameworkNodeModel;
}

// ─── Category metadata ────────────────────────────────────────────────────────

export const CATEGORY_META: Record<string, { label: string; color: string; order: number; singleInstance: boolean }> = {
  architecture: { label: "Architecture",  color: "#7B5FFF", order: 0, singleInstance: true  },
  testRunner:   { label: "Test Runner",   color: "#3B82F6", order: 1, singleInstance: true  },
  reporting:    { label: "Reporting",     color: "#EC4899", order: 2, singleInstance: false },
  data:         { label: "Data",          color: "#F97316", order: 3, singleInstance: false },
  ci:           { label: "CI / CD",       color: "#10B981", order: 4, singleInstance: true  },
  logging:      { label: "Logging",       color: "#14B8A6", order: 5, singleInstance: true  },
  distributed:  { label: "Distributed",  color: "#6366F1", order: 6, singleInstance: false },
  utilities:    { label: "Utilities",     color: "#6B7280", order: 7, singleInstance: false },
  ai:           { label: "AI",            color: "#A78BFA", order: 8, singleInstance: false },
};

export type StyleTokens = {
  bg: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentSoft: string;
};

export const DARK_TOKENS: StyleTokens = {
  bg:         "#0D0F14",
  card:       "#13151E",
  border:     "#1F2333",
  text:       "#E2E6F0",
  textMuted:  "#6B7280",
  textDim:    "#3E4255",
  accent:     "#7B5FFF",
  accentSoft: "#7B5FFF14",
};

export const LIGHT_TOKENS: StyleTokens = {
  bg:         "#F8F9FC",
  card:       "#FFFFFF",
  border:     "#E5E7EB",
  text:       "#111827",
  textMuted:  "#6B7280",
  textDim:    "#9CA3AF",
  accent:     "#6D4FF0",
  accentSoft: "#6D4FF012",
};
