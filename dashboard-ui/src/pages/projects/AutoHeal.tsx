import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { theme } from "@/theme";
import { useColors } from "@/hooks/useColors";
import type { AutoHealItem, AutoHealSummary, HealType, HealStatus } from "@/api/auto-heal";
import {
  fetchAutoHeal, fetchAutoHealSummary, scanAutoHeal,
  applyHeal, validateHeal, ignoreHeal,
  TYPE_LABEL, TYPE_COLOR, STATUS_COLOR, STATUS_LABEL,
} from "@/api/auto-heal";

// ── Shared helpers ────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
      background: `${color}22`, color,
    }}>{label}</span>
  );
}

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: border }}>
        <div style={{ height: "100%", width: `${Math.round(value * 100)}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 28 }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

function formatTestName(name: string): string {
  if (!name) return name;
  if (name.includes(" ") && !name.includes(".spec.ts")) return name;
  return name.replace(/\.spec\.ts$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim();
}

// ── Summary tiles ─────────────────────────────────────────────────────────────

function SummaryTile({
  icon, label, value, sub, color,
}: { icon: string; label: string; value: number | string; sub?: string; color?: string }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();
  return (
    <div style={{
      flex: "1 1 130px", minWidth: 0, padding: "14px 16px", borderRadius: 14,
      background: surface, border: `1px solid ${border}`, boxShadow: theme.shadow.card,
    }}>
      <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color ?? P, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: text, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: textLight, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SummaryBar({
  summary, scanning, scannedAt, onScan,
}: {
  summary: AutoHealSummary;
  scanning: boolean;
  scannedAt: string;
  onScan: () => void;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Scan bar */}
      <div style={{
        padding: "10px 16px", borderRadius: 12, marginBottom: 12,
        background: surface, border: `1px solid ${border}`,
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}>
        <button
          onClick={onScan}
          disabled={scanning}
          style={{
            padding: "8px 20px", borderRadius: 9, border: "none",
            background: scanning ? "#9e7de0" : P,
            color: "#fff", fontWeight: 700, fontSize: 13,
            cursor: scanning ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <span>{scanning ? "⏳" : "🔍"}</span>
          {scanning ? "Scanning…" : "Re-Scan Tests"}
        </button>
        {scannedAt && (
          <span style={{ fontSize: 12, color: textLight }}>
            Last scan: {new Date(scannedAt).toLocaleString()}
          </span>
        )}
        {scanning && (
          <span style={{ fontSize: 12, color: P, fontWeight: 500 }}>
            Analyzing tests for healable patterns…
          </span>
        )}
      </div>

      {/* Tiles */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
        <SummaryTile icon="🩹" label="Healable Tests" value={summary.totalHealable}
          sub="Pending in queue" color="#FFA726" />
        <SummaryTile icon="✅" label="Healed (7 days)" value={summary.autoHealedLast7Days}
          color="#66BB6A" sub="Auto-applied patches" />
        <SummaryTile icon="📈" label="Success Rate" value={`${summary.healingSuccessRate}%`}
          color={summary.healingSuccessRate >= 75 ? "#66BB6A" : "#FFA726"}
          sub="Applied vs failed heals" />
        <SummaryTile icon="⚡" label="Flaky Reduced" value={summary.flakyReduced}
          color="#42A5F5" sub="Timing heals applied" />
        <SummaryTile icon="🔥" label="High-Risk Unhealed" value={summary.highRiskUnhealed}
          color={summary.highRiskUnhealed > 0 ? "#EF5350" : "#66BB6A"}
          sub="Impact ≥ 75%" />
      </div>
    </div>
  );
}

// ── Heal queue table ──────────────────────────────────────────────────────────

function HealQueue({
  heals, selectedId, loadingId, typeFilter, statusFilter, search,
  onSelect, onApply, onValidate, onIgnore,
}: {
  heals: AutoHealItem[];
  selectedId: string | null;
  loadingId: string | null;
  typeFilter: HealType | "all";
  statusFilter: HealStatus | "all";
  search: string;
  onSelect: (h: AutoHealItem) => void;
  onApply: (h: AutoHealItem) => void;
  onValidate: (h: AutoHealItem) => void;
  onIgnore: (h: AutoHealItem) => void;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  const filtered = heals.filter(h => {
    if (typeFilter !== "all" && h.type !== typeFilter) return false;
    if (statusFilter !== "all" && h.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!h.testId.toLowerCase().includes(q) &&
          !h.testFileName.toLowerCase().includes(q) &&
          !(h.requirement ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: textLight, fontSize: 13 }}>
        No heal candidates match the current filters.
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: surface, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            {["Test", "Type", "Status", "Confidence", "Impact", "Auto", "Last Failed", "Actions"].map(h => (
              <th key={h} style={{
                padding: "10px 14px", textAlign: "left",
                fontSize: 10, fontWeight: 700, color: textLight,
                textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(h => {
            const selected = h.id === selectedId;
            const isLoading = loadingId?.startsWith(h.id) ?? false;
            const typeColor = TYPE_COLOR[h.type];
            const statusColor = STATUS_COLOR[h.status];
            const isPending = h.status === "pending";

            return (
              <tr
                key={h.id}
                onClick={() => onSelect(h)}
                style={{
                  cursor: "pointer",
                  background: selected ? (`${P}15`) : "transparent",
                  borderLeft: `3px solid ${selected ? P : "transparent"}`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => {
                  if (!selected) (e.currentTarget as HTMLTableRowElement).style.background =
                    bg;
                }}
                onMouseLeave={e => {
                  if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                }}
              >
                {/* Test */}
                <td style={{ padding: "11px 14px", maxWidth: 200 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180,
                  }} title={formatTestName(h.testId)}>{formatTestName(h.testId)}</div>
                  <div style={{ fontSize: 10, color: textLight, fontFamily: "monospace", marginTop: 1 }}>
                    {h.testFileName}
                  </div>
                </td>
                {/* Type */}
                <td style={{ padding: "11px 14px" }}>
                  <Badge label={TYPE_LABEL[h.type]} color={typeColor} />
                </td>
                {/* Status */}
                <td style={{ padding: "11px 14px" }}>
                  <Badge label={STATUS_LABEL[h.status]} color={statusColor} />
                  {h.validated && (
                    <span style={{ fontSize: 9, color: "#42A5F5", marginLeft: 4 }}>✓ validated</span>
                  )}
                </td>
                {/* Confidence */}
                <td style={{ padding: "11px 14px", minWidth: 100 }}>
                  <ConfidenceBar value={h.confidence}
                    color={h.confidence >= 0.8 ? "#66BB6A" : h.confidence >= 0.6 ? "#FFA726" : "#EF5350"} />
                </td>
                {/* Impact */}
                <td style={{ padding: "11px 14px", minWidth: 100 }}>
                  <ConfidenceBar value={h.impact}
                    color={h.impact >= 0.75 ? "#EF5350" : h.impact >= 0.5 ? "#FFA726" : "#66BB6A"} />
                </td>
                {/* Auto-applicable */}
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ fontSize: 14 }}>{h.autoApplicable ? "⚡" : "👤"}</span>
                </td>
                {/* Last failed */}
                <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                  {h.lastFailed
                    ? <span style={{ fontSize: 11, color: "#EF5350" }}>{new Date(h.lastFailed).toLocaleDateString()}</span>
                    : <span style={{ color: border, fontSize: 11 }}>—</span>
                  }
                </td>
                {/* Actions */}
                <td style={{ padding: "11px 14px" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {isPending && h.autoApplicable && (
                      <button
                        onClick={() => !isLoading && onApply(h)}
                        disabled={isLoading}
                        style={{
                          padding: "4px 9px", borderRadius: 6, border: "none",
                          background: isLoading ? "#9e7de0" : P,
                          color: "#fff", fontSize: 10, fontWeight: 700,
                          cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        {isLoading ? "⏳" : "⚡ Apply"}
                      </button>
                    )}
                    {isPending && (
                      <button
                        onClick={() => !isLoading && onValidate(h)}
                        disabled={isLoading}
                        style={{
                          padding: "4px 8px", borderRadius: 6,
                          border: `1px solid ${border}`, background: "transparent",
                          color: text, fontSize: 10, cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        ✓ Test
                      </button>
                    )}
                    <button
                      onClick={() => onSelect(h)}
                      style={{
                        padding: "4px 8px", borderRadius: 6,
                        border: `1px solid ${border}`, background: "transparent",
                        color: text, fontSize: 10, cursor: "pointer",
                      }}
                    >
                      View →
                    </button>
                    {isPending && (
                      <button
                        onClick={() => !isLoading && onIgnore(h)}
                        disabled={isLoading}
                        style={{
                          padding: "4px 8px", borderRadius: 6,
                          border: `1px solid ${border}`, background: "transparent",
                          color: textLight, fontSize: 10, cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Code diff viewer ──────────────────────────────────────────────────────────

function DiffViewer({ before, after }: { before: string; after: string }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();
  const codeBg = dark ? "#0d0d1a" : "#f8f8ff";

  return (
    <div style={{ borderRadius: 10, border: `1px solid ${border}`, overflow: "hidden", fontSize: 11, fontFamily: "monospace" }}>
      {/* Before */}
      <div style={{ background: dark ? "#1a0000" : "#fff5f5", borderBottom: `1px solid ${border}` }}>
        <div style={{ padding: "4px 10px", background: dark ? "#2a0000" : "#ffebee", fontSize: 10, fontWeight: 700, color: "#EF5350" }}>
          − Before
        </div>
        <pre style={{ margin: 0, padding: "10px 14px", color: "#EF5350", whiteSpace: "pre-wrap", lineHeight: 1.6, background: dark ? "#1a0000" : "#fff5f5" }}>
          {before || "—"}
        </pre>
      </div>
      {/* After */}
      <div style={{ background: dark ? "#001a00" : "#f5fff5" }}>
        <div style={{ padding: "4px 10px", background: dark ? "#002a00" : "#e8f5e9", fontSize: 10, fontWeight: 700, color: "#66BB6A" }}>
          + After
        </div>
        <pre style={{ margin: 0, padding: "10px 14px", color: "#66BB6A", whiteSpace: "pre-wrap", lineHeight: 1.6, background: dark ? "#001a00" : "#f5fff5" }}>
          {after || "—"}
        </pre>
      </div>
    </div>
  );
}

// ── Heal detail panel ─────────────────────────────────────────────────────────

function HealDetailPanel({
  heal, loadingId, onClose, onApply, onValidate, onIgnore,
}: {
  heal: AutoHealItem | null;
  loadingId: string | null;
  onClose: () => void;
  onApply: (h: AutoHealItem) => void;
  onValidate: (h: AutoHealItem) => void;
  onIgnore: (h: AutoHealItem) => void;
}) {
  if (!heal) return null;

  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  const typeColor = TYPE_COLOR[heal.type];
  const statusColor = STATUS_COLOR[heal.status];
  const isPending = heal.status === "pending";
  const isLoading = !!loadingId?.startsWith(heal.id);

  const confColor = heal.confidence >= 0.8 ? "#66BB6A" : heal.confidence >= 0.6 ? "#FFA726" : "#EF5350";
  const impactColor = heal.impact >= 0.75 ? "#EF5350" : heal.impact >= 0.5 ? "#FFA726" : "#66BB6A";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.2)" }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 460, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 28px rgba(0,0,0,0.12)",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              <Badge label={TYPE_LABEL[heal.type]} color={typeColor} />
              <Badge label={STATUS_LABEL[heal.status]} color={statusColor} />
              {heal.autoApplicable && <Badge label="Auto-Applicable" color="#66BB6A" />}
            </div>
            <button onClick={onClose} style={{
              border: "none", background: "transparent",
              cursor: "pointer", fontSize: 17, color: textLight, padding: "2px 6px",
            }}>✕</button>
          </div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: P, lineHeight: 1.4 }}>
            {formatTestName(heal.testId)}
          </h3>
          <div style={{ fontSize: 11, color: textLight, marginTop: 4, fontFamily: "monospace" }}>
            {heal.testFileName}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Confidence + Impact */}
          <div style={{ padding: "14px 16px", borderRadius: 10, background: bg }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
              Confidence &amp; Impact
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: textLight }}>Confidence</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: confColor }}>{Math.round(heal.confidence * 100)}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: border }}>
                <div style={{ height: "100%", width: `${heal.confidence * 100}%`, background: confColor, borderRadius: 3 }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: textLight }}>Impact</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: impactColor }}>{Math.round(heal.impact * 100)}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: border }}>
                <div style={{ height: "100%", width: `${heal.impact * 100}%`, background: impactColor, borderRadius: 3 }} />
              </div>
            </div>
          </div>

          {/* Linked requirement */}
          {heal.requirement && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                Linked Requirement
              </div>
              <div style={{
                padding: "8px 12px", borderRadius: 8, background: bg,
                border: `1px solid ${border}`, fontSize: 12, color: text,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>📋</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{heal.requirement}</span>
              </div>
            </div>
          )}

          {/* Root cause */}
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: dark ? "#1a0a00" : "#fff8f0",
            border: `1px solid ${dark ? "#3a1500" : "#FFE0B2"}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#FF9800", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
              🔍 Root Cause
            </div>
            <div style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>{heal.rootCause}</div>
          </div>

          {/* AI reasoning */}
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: dark ? "#0a0a1a" : "#f5f0ff",
            border: `1px solid ${dark ? "#1e1040" : "#D1C4E9"}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
              🧠 AI Reasoning
            </div>
            <div style={{ fontSize: 12, color: text, lineHeight: 1.7 }}>{heal.aiReasoning}</div>
          </div>

          {/* Proposed patch */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              Proposed Patch
            </div>
            <DiffViewer before={heal.patch.before} after={heal.patch.after} />
            <div style={{ fontSize: 10, color: textLight, marginTop: 5, fontFamily: "monospace" }}>
              {heal.patch.filePath.split(/[/\\]/).pop()}
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {heal.lastFailed && (
              <div style={{ fontSize: 11, color: "#EF5350" }}>
                Last failed: {new Date(heal.lastFailed).toLocaleString()}
              </div>
            )}
            {heal.healedAt && (
              <div style={{ fontSize: 11, color: "#66BB6A" }}>
                Healed: {new Date(heal.healedAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              Actions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

              {isPending && heal.autoApplicable && (
                <button
                  onClick={() => !isLoading && onApply(heal)}
                  disabled={isLoading}
                  style={{
                    padding: "10px 16px", borderRadius: 10, border: "none",
                    background: isLoading ? "#9e7de0" : P,
                    color: "#fff", fontWeight: 600, fontSize: 13,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    opacity: isLoading ? 0.8 : 1,
                  }}
                >
                  <span>⚡</span>
                  Apply Patch
                </button>
              )}

              {isPending && (
                <button
                  onClick={() => !isLoading && onValidate(heal)}
                  disabled={isLoading}
                  style={{
                    padding: "10px 16px", borderRadius: 10,
                    border: `1px solid ${border}`, background: "transparent",
                    color: text, fontWeight: 600, fontSize: 13,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    opacity: isLoading ? 0.4 : 1,
                  }}
                >
                  <span>✓</span>
                  Validate Patch
                </button>
              )}

              {heal.status === "validated" && (
                <button
                  onClick={() => !isLoading && onApply(heal)}
                  disabled={isLoading}
                  style={{
                    padding: "10px 16px", borderRadius: 10, border: "none",
                    background: "#66BB6A",
                    color: "#fff", fontWeight: 600, fontSize: 13,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <span>⚡</span>
                  Apply Validated Patch
                </button>
              )}

              {isPending && (
                <button
                  onClick={() => !isLoading && onIgnore(heal)}
                  disabled={isLoading}
                  style={{
                    padding: "10px 16px", borderRadius: 10,
                    border: `1px solid ${border}`, background: "transparent",
                    color: textLight, fontWeight: 600, fontSize: 13,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    opacity: isLoading ? 0.4 : 1,
                  }}
                >
                  <span>✕</span>
                  Ignore
                </button>
              )}
            </div>

            {isLoading && (
              <div style={{
                marginTop: 10, padding: "9px 12px", borderRadius: 8,
                background: `${P}15`,
                border: `1px solid ${P}33`,
                fontSize: 12, color: P, fontWeight: 500,
              }}>
                ⏳ Processing… please wait.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AutoHeal({ projectId }: { projectId: string }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  const [heals, setHeals] = useState<AutoHealItem[]>([]);
  const [summary, setSummary] = useState<AutoHealSummary | null>(null);
  const [scannedAt, setScannedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<AutoHealItem | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<HealType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<HealStatus | "all">("pending");

  const load = useCallback(async () => {
    try {
      const [store, sum] = await Promise.all([
        fetchAutoHeal(projectId),
        fetchAutoHealSummary(projectId),
      ]);
      setHeals(Array.isArray(store.heals) ? store.heals : []);
      setScannedAt(store.scannedAt || "");
      setSummary(sum);
    } catch {
      setHeals([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleScan = async () => {
    setScanning(true);
    const tid = toast.loading("Scanning tests for healable patterns…");
    try {
      const store = await scanAutoHeal(projectId);
      setHeals(Array.isArray(store.heals) ? store.heals : []);
      setScannedAt(store.scannedAt || "");
      const sum = await fetchAutoHealSummary(projectId);
      setSummary(sum);
      toast.success(`Found ${store.heals.length} heal candidate${store.heals.length !== 1 ? "s" : ""}.`, { id: tid, duration: 4000 });
    } catch {
      toast.error("Scan failed.", { id: tid });
    } finally {
      setScanning(false);
    }
  };

  const handleApply = async (heal: AutoHealItem) => {
    setLoadingId(`${heal.id}-apply`);
    const tid = toast.loading(`Applying patch to "${formatTestName(heal.testId)}"…`);
    try {
      const res = await applyHeal(projectId, heal.id);
      if (res.ok) {
        toast.success("Patch applied successfully.", { id: tid, duration: 4000 });
        await load();
        setSelected(prev => heals.find(h => h.id === prev?.id) ?? null);
      } else {
        toast.error(res.message ?? "Apply failed.", { id: tid });
      }
    } catch {
      toast.error("Apply failed.", { id: tid });
    } finally {
      setLoadingId(null);
    }
  };

  const handleValidate = async (heal: AutoHealItem) => {
    setLoadingId(`${heal.id}-validate`);
    const tid = toast.loading(`Validating patch for "${formatTestName(heal.testId)}"…`);
    try {
      const res = await validateHeal(projectId, heal.id);
      if (res.passed) {
        toast.success(res.message, { id: tid, duration: 4000 });
      } else {
        toast.error(res.message, { id: tid, duration: 5000 });
      }
      await load();
      setSelected(prev => heals.find(h => h.id === prev?.id) ?? null);
    } catch {
      toast.error("Validation failed.", { id: tid });
    } finally {
      setLoadingId(null);
    }
  };

  const handleIgnore = async (heal: AutoHealItem) => {
    setLoadingId(`${heal.id}-ignore`);
    try {
      await ignoreHeal(projectId, heal.id);
      toast.success("Heal marked as ignored.", { duration: 2500 });
      await load();
      if (selected?.id === heal.id) setSelected(null);
    } catch {
      toast.error("Failed to ignore heal.");
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <div style={{ textAlign: "center", color: textLight, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🩹</div>
          Loading Auto-Heal…
        </div>
      </div>
    );
  }

  const visibleCount = heals.filter(h => {
    if (typeFilter !== "all" && h.type !== typeFilter) return false;
    if (statusFilter !== "all" && h.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!h.testId.toLowerCase().includes(q) &&
          !h.testFileName.toLowerCase().includes(q) &&
          !(h.requirement ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  }).length;

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: P, fontSize: 20, fontWeight: 800 }}>
          Auto-Heal
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: textLight }}>
          AI-powered self-repair engine — detect, diagnose, and patch failing tests automatically.
        </p>
      </div>

      {/* Summary */}
      {summary && (
        <SummaryBar
          summary={summary}
          scanning={scanning}
          scannedAt={scannedAt}
          onScan={handleScan}
        />
      )}

      {/* No heals state */}
      {heals.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          color: textLight, fontSize: 13,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🩹</div>
          <h3 style={{ margin: "0 0 8px", color: P }}>No Heal Candidates</h3>
          <p style={{ maxWidth: 360, margin: "0 auto 20px", lineHeight: 1.6 }}>
            No tests with spec files found in this project yet. Generate tests first, or run a scan after test failures.
          </p>
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: P, color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: scanning ? "not-allowed" : "pointer",
            }}
          >
            {scanning ? "⏳ Scanning…" : "🔍 Scan Now"}
          </button>
        </div>
      )}

      {/* Queue */}
      {heals.length > 0 && (
        <>
          {/* Toolbar */}
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
            marginBottom: 14,
          }}>
            <input
              placeholder="Search tests or requirements…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: "1 1 180px", padding: "7px 12px", borderRadius: 8,
                border: `1px solid ${border}`, background: dark ? surface : "#fff",
                color: text, fontSize: 12, outline: "none",
              }}
            />

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as HealType | "all")}
              style={{
                padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`,
                background: dark ? surface : "#fff", color: text, fontSize: 12,
              }}
            >
              <option value="all">All Types</option>
              <option value="selector">Selector</option>
              <option value="timing">Timing</option>
              <option value="api-schema">API Schema</option>
              <option value="status-code">Status Code</option>
              <option value="url">URL</option>
              <option value="flow">Flow</option>
              <option value="data-contract">Data Contract</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as HealStatus | "all")}
              style={{
                padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`,
                background: dark ? surface : "#fff", color: text, fontSize: 12,
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="validated">Validated</option>
              <option value="applied">Applied</option>
              <option value="ignored">Ignored</option>
              <option value="failed">Failed</option>
            </select>

            <span style={{ fontSize: 12, color: textLight, whiteSpace: "nowrap" }}>
              {visibleCount} of {heals.length} heal{heals.length !== 1 ? "s" : ""}
            </span>
          </div>

          <HealQueue
            heals={heals}
            selectedId={selected?.id ?? null}
            loadingId={loadingId}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            search={search}
            onSelect={h => setSelected(prev => prev?.id === h.id ? null : h)}
            onApply={handleApply}
            onValidate={handleValidate}
            onIgnore={handleIgnore}
          />
        </>
      )}

      {/* Detail panel */}
      {selected && (
        <HealDetailPanel
          heal={selected}
          loadingId={loadingId}
          onClose={() => setSelected(null)}
          onApply={handleApply}
          onValidate={handleValidate}
          onIgnore={handleIgnore}
        />
      )}
    </div>
  );
}
