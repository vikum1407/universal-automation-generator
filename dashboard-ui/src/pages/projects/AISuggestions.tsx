import { useEffect, useState, useCallback, useRef } from "react";
import { theme } from "@/theme";
import toast from "react-hot-toast";
import type { Suggestion, SuggestionsAnalytics } from "@/api/suggestions";
import {
  fetchSuggestions,
  generateSuggestions,
  updateSuggestionStatus,
  applySuggestion,
} from "@/api/suggestions";
import SuggestionsDashboard from "./SuggestionsDashboard";
import SuggestionsTable from "./SuggestionsTable";
import SuggestionDeepView from "./SuggestionDeepView";

// ── Analysis steps shown while the engine runs ────────────────────────────────

const ANALYSIS_STEPS = [
  { icon: "🔍", message: "Scanning RTM requirements and coverage data…" },
  { icon: "🧪", message: "Analyzing existing test files and spec coverage…" },
  { icon: "⚡", message: "Identifying endpoint and UI flow gaps…" },
  { icon: "🎯", message: "Calculating risk scores and impact levels…" },
  { icon: "🛡️", message: "Evaluating stability and release readiness…" },
  { icon: "🧠", message: "Generating AI recommendations…" },
  { icon: "✅", message: "Ranking and finalizing suggestions…" },
];

// ── Action labels shown during apply ─────────────────────────────────────────

const ACTION_IN_PROGRESS: Record<string, string> = {
  "generate-test": "Generating test file…",
  "heal":          "Auto-healing test…",
  "regenerate":    "Regenerating test…",
  "rewrite":       "Rewriting requirement…",
  "refactor":      "Refactoring test…",
  "apply":         "Applying…",
};

const ACTION_SUCCESS: Record<string, string> = {
  "generate-test": "Test file generated and added to the project.",
  "heal":          "Test has been auto-healed with updated selectors.",
  "regenerate":    "Test regenerated from current project state.",
  "rewrite":       "Requirement rewritten and saved to RTM.",
  "refactor":      "Test refactored successfully.",
  "apply":         "Action applied successfully.",
};

// ── Analysis progress panel ───────────────────────────────────────────────────

function AnalysisProgress({ step }: { step: number }) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const bg = isDark ? theme.colors.darkBackground : "#f5f5f8";

  const current = ANALYSIS_STEPS[Math.min(step, ANALYSIS_STEPS.length - 1)];
  const progress = Math.round(((step + 1) / ANALYSIS_STEPS.length) * 100);

  return (
    <div style={{
      margin: "24px 0", padding: "28px 32px", borderRadius: 16,
      background: surface, border: `1px solid ${border}`,
      boxShadow: theme.shadow.card,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `${theme.colors.primary}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          {current.icon}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: text }}>
            AI Analysis in Progress
          </div>
          <div style={{ fontSize: 12, color: textLight, marginTop: 2 }}>
            {current.message}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 6, borderRadius: 4,
        background: isDark ? "#2a2a3a" : "#eee",
        overflow: "hidden", marginBottom: 14,
      }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${theme.colors.primary}, #a855f7)`,
          borderRadius: 4,
          transition: "width 0.6s ease",
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ANALYSIS_STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                opacity: i > step ? 0.35 : 1,
                transition: "opacity 0.3s",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                background: done ? "#66BB6A" : active ? theme.colors.primary : bg,
                border: `2px solid ${done ? "#66BB6A" : active ? theme.colors.primary : (isDark ? "#444" : "#ddd")}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "#fff", fontWeight: 800,
                transition: "all 0.3s",
              }}>
                {done ? "✓" : active ? "●" : ""}
              </div>
              <span style={{
                fontSize: 12,
                color: active ? theme.colors.primary : done ? "#66BB6A" : textLight,
                fontWeight: active ? 600 : 400,
              }}>
                {s.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AISuggestions({ projectId }: { projectId: string }) {
  const isDark = theme.mode === "dark";
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analytics, setAnalytics] = useState<SuggestionsAnalytics | null>(null);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);

  // Analysis progress
  const [generating, setGenerating] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Per-action loading: maps suggId → actionType
  const [applyingMap, setApplyingMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const data = await fetchSuggestions(projectId);
      setSuggestions(data.suggestions || []);
      setAnalytics(data.analytics || null);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  }, []);

  const startAnalysis = async () => {
    if (generating) return;
    setGenerating(true);
    setAnalysisStep(0);

    // Advance through steps every 700ms while the API call runs
    let step = 0;
    stepTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, ANALYSIS_STEPS.length - 1);
      setAnalysisStep(step);
    }, 700);

    try {
      const data = await generateSuggestions(projectId);
      setSuggestions(data.suggestions || []);
      setAnalytics(data.analytics || null);
      setSelected(null);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);

      const count = data.suggestions?.length ?? 0;
      if (count > 0) {
        toast.success(`Found ${count} suggestion${count !== 1 ? "s" : ""} — review them below.`, {
          duration: 4000,
          icon: "🧠",
        });
      } else {
        toast("No suggestions found. Your project looks clean!", {
          icon: "✅",
          duration: 4000,
        });
      }
    } catch (err) {
      toast.error("AI analysis failed. Check that the project has been scanned first.", {
        duration: 5000,
      });
    } finally {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setGenerating(false);
      setAnalysisStep(0);
    }
  };

  const handleApply = async (suggestion: Suggestion, actionType: string, payload?: any) => {
    setApplyingMap(prev => ({ ...prev, [suggestion.id]: actionType }));

    const toastId = toast.loading(ACTION_IN_PROGRESS[actionType] ?? "Applying…", {
      style: { fontSize: 13 },
    });

    try {
      await applySuggestion(projectId, suggestion.id, actionType, payload);

      setSuggestions(prev =>
        prev.map(s => s.id === suggestion.id ? { ...s, status: "applied" } : s)
      );
      if (selected?.id === suggestion.id) {
        setSelected(prev => prev ? { ...prev, status: "applied" } : null);
      }

      toast.success(ACTION_SUCCESS[actionType] ?? "Done.", {
        id: toastId,
        duration: 4000,
      });

      await load();
    } catch {
      toast.error("Action failed — please check the project output directory.", {
        id: toastId,
        duration: 5000,
      });
    } finally {
      setApplyingMap(prev => {
        const next = { ...prev };
        delete next[suggestion.id];
        return next;
      });
    }
  };

  const handleDismiss = async (suggestion: Suggestion) => {
    try {
      await updateSuggestionStatus(projectId, suggestion.id, "dismissed");
      setSuggestions(prev =>
        prev.map(s => s.id === suggestion.id ? { ...s, status: "dismissed" } : s)
      );
      if (selected?.id === suggestion.id) setSelected(null);
      toast("Suggestion dismissed.", { icon: "🗑️", duration: 2500 });
      await load();
    } catch {
      toast.error("Failed to dismiss suggestion.");
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <div style={{ textAlign: "center", color: textLight, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
          Loading AI suggestions…
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%", minWidth: 0 }}>

      {/* Page header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12, marginBottom: 24,
      }}>
        <div>
          <h2 style={{ margin: 0, color: theme.colors.primary, fontSize: 20, fontWeight: 800 }}>
            AI Suggestions
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: textLight, maxWidth: 480 }}>
            The AI intelligence layer — detects gaps, predicts failures, and recommends what to fix next.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {suggestions.length > 0 && (
            <button
              onClick={startAnalysis}
              disabled={generating}
              style={{
                padding: "9px 18px", borderRadius: 10,
                border: `1px solid ${border}`, background: "transparent",
                color: text, fontSize: 13, fontWeight: 600,
                cursor: generating ? "not-allowed" : "pointer",
                opacity: generating ? 0.5 : 1, transition: "opacity 0.12s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {generating ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>↻</span>
                  Analyzing…
                </>
              ) : "↺ Re-analyze"}
            </button>
          )}

          <button
            onClick={startAnalysis}
            disabled={generating}
            style={{
              padding: "9px 18px", borderRadius: 10, border: "none",
              background: generating ? "#9e7de0" : theme.colors.primary,
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: generating ? "not-allowed" : "pointer",
              transition: "opacity 0.12s, background 0.2s",
              display: "flex", alignItems: "center", gap: 6,
            }}
            onMouseEnter={e => {
              if (!generating) (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
          >
            <span>🧠</span>
            {generating ? "Analyzing…" : suggestions.length > 0 ? "Run AI Analysis" : "Run AI Analysis"}
          </button>
        </div>
      </div>

      {/* Analysis progress (shown while generating) */}
      {generating && <AnalysisProgress step={analysisStep} />}

      {/* No suggestions empty state */}
      {!generating && suggestions.length === 0 && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "60px 20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
          <h3 style={{ margin: "0 0 8px", color: theme.colors.primary }}>No Suggestions Yet</h3>
          <p style={{ color: textLight, fontSize: 13, maxWidth: 380, margin: "0 0 24px", lineHeight: 1.6 }}>
            Run the AI analysis engine to detect coverage gaps, predict failures, and get actionable recommendations.
          </p>
          <button
            onClick={startAnalysis}
            style={{
              padding: "11px 28px", borderRadius: 10, border: "none",
              background: theme.colors.primary, color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span>🧠</span> Run AI Analysis
          </button>
        </div>
      )}

      {/* Dashboard + Table */}
      {!generating && suggestions.length > 0 && (
        <>
          {analytics && <SuggestionsDashboard analytics={analytics} />}

          <SuggestionsTable
            suggestions={suggestions}
            selectedId={selected?.id ?? null}
            applyingMap={applyingMap}
            onSelect={s => setSelected(prev => prev?.id === s.id ? null : s)}
            onApply={handleApply}
            onDismiss={handleDismiss}
          />
        </>
      )}

      {/* Deep view drawer */}
      {selected && (
        <SuggestionDeepView
          suggestion={selected}
          applyingAction={applyingMap[selected.id] ?? null}
          onClose={() => setSelected(null)}
          onApply={(s, actionType, payload) => handleApply(s, actionType, payload)}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}
