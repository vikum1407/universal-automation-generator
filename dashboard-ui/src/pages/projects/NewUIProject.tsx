import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/form/Input";
import { Button } from "../../components/ui/form/Button";
import { FormField } from "../../components/ui/form/FormField";

import { socket } from "../../socket";
import ProgressModal from "../../components/ProgressModal";

// ─── Framework definitions (UI-only — no REST Assured) ────────────────────────

const UI_FRAMEWORKS = [
  { id: "selenium",    label: "Selenium",    tagline: "Cross-browser UI automation", color: "#E25C1D", langs: ["Java", "Python", "TypeScript", "C#"],          comingSoon: false },
  { id: "playwright",  label: "Playwright",  tagline: "Modern web testing",           color: "#7B5FFF", langs: ["TypeScript", "JavaScript", "Python", "Java"],   comingSoon: false },
  { id: "cypress",     label: "Cypress",     tagline: "Fast component & E2E tests",   color: "#17B26A", langs: ["TypeScript", "JavaScript"],                     comingSoon: false },
  { id: "webdriverio", label: "WebdriverIO", tagline: "Flexible WDIO automation",     color: "#E8A000", langs: ["TypeScript", "JavaScript"],                     comingSoon: false },
  { id: "appium",      label: "Appium",      tagline: "Mobile & cross-platform",      color: "#2563EB", langs: ["Java", "Python", "TypeScript", "C#"],           comingSoon: true  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewUIProject() {
  const navigate = useNavigate();

  const [selectedFramework, setSelectedFramework] = useState("");
  const selectedFrameworkRef = useRef("");

  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [crawlDepth, setCrawlDepth] = useState(2);
  const [env, setEnv] = useState("production");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [progress, setProgress] = useState({
    open: false,
    percent: 0,
    step: "Starting…"
  });

  const projectIdRef = useRef<string | null>(null);
  const navigatedRef = useRef(false);

  // Keep ref in sync with state so socket callbacks see the latest value
  useEffect(() => { selectedFrameworkRef.current = selectedFramework; }, [selectedFramework]);

  function doNavigate() {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    const fw  = selectedFrameworkRef.current;
    const pid = projectIdRef.current;
    setTimeout(() => {
      if (fw && pid) {
        navigate(`/framework/start?projectId=${pid}&skipBuilder=1&framework=${fw}`);
      } else {
        navigate(`/projects/${pid}`);
      }
    }, 800);
  }

  useEffect(() => {
    const recrawlHandler = (data: any) => {
      setProgress({ open: true, percent: data.percent ?? 0, step: data.step ?? "Working…" });
    };

    const statusHandler = (data: any) => {
      if (data.progressPercent !== undefined) {
        setProgress(prev => ({
          ...prev,
          open: true,
          percent: data.progressPercent,
          step: data.progressStep ?? prev.step
        }));
      }
      if (data.status === "ready" || data.status === "failed") {
        setProgress(prev => ({ ...prev, open: false }));
        doNavigate();
      }
    };

    const eventHandler = (data: any) => {
      if (data.event === "recrawl-completed") {
        setProgress({ open: false, percent: 100, step: "Completed" });
        doNavigate();
      }
    };

    socket.on("recrawl-progress", recrawlHandler);
    socket.on("project-status", statusHandler);
    socket.on("recrawl-event", eventHandler);

    return () => {
      socket.off("recrawl-progress", recrawlHandler);
      socket.off("project-status", statusHandler);
      socket.off("recrawl-event", eventHandler);
    };
  }, [navigate]);

  async function handleContinue() {
    setLoading(true);
    setError("");
    navigatedRef.current = false;

    try {
      const res = await fetch("http://localhost:3000/projects/scan-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          username,
          password,
          crawlDepth,
          env,
          framework: selectedFramework,
        })
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        setError(`Server error (${res.status}). Check the backend is running.`);
        setLoading(false);
        return;
      }

      if (!res.ok || !data.projectId) {
        setError(data?.message ?? "Server did not return a project ID. Please try again.");
        setLoading(false);
        return;
      }

      projectIdRef.current = data.projectId;

      socket.emit("join", data.projectId);
      setProgress({ open: true, percent: 0, step: "Starting…" });

    } catch (e: any) {
      const msg = e?.message?.includes("fetch") || e?.message?.includes("network")
        ? "Cannot reach the backend — make sure the server is running on port 3000."
        : "Failed to create project. Please try again.";
      setError(msg);
      setLoading(false);
    }
  }

  const canContinue = !!selectedFramework && url.trim().startsWith("http") && !loading;

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-10">
      <ProgressModal
        open={progress.open}
        percent={progress.percent}
        step={progress.step}
      />

      <h1 className="text-h1 font-semibold text-neutral-dark dark:text-neutral-light">
        UI Automation — Website Setup
      </h1>

      <Card className="space-y-8 p-8">

        {/* ── Framework selector ─────────────────────────────────────────────── */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-mid dark:text-slate-400 mb-3">
            Automation Framework
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {UI_FRAMEWORKS.map(fw => {
              const selected  = selectedFramework === fw.id;
              const disabled  = fw.comingSoon || loading;
              return (
                <button
                  key={fw.id}
                  onClick={() => !disabled && setSelectedFramework(fw.id)}
                  disabled={disabled}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    padding: "12px 14px", borderRadius: 10, textAlign: "left", width: "100%",
                    cursor: disabled ? "not-allowed" : "pointer",
                    border: selected ? `2px solid ${fw.color}` : "1.5px solid var(--card-border, #E5E7EB)",
                    background: selected ? `${fw.color}10` : "transparent",
                    boxShadow: selected ? `0 0 0 3px ${fw.color}18` : "none",
                    opacity: disabled ? 0.5 : 1,
                    transition: "all 0.14s",
                    position: "relative",
                  }}
                >
                  {fw.comingSoon && (
                    <span style={{
                      position: "absolute", top: 7, right: 7,
                      fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
                      background: "#6B728018", color: "#6B7280", border: "1px solid #6B728030",
                      letterSpacing: "0.05em",
                    }}>SOON</span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: fw.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: selected ? fw.color : "var(--fg, #111827)" }}>
                      {fw.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 6, lineHeight: 1.4 }}>{fw.tagline}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {fw.langs.slice(0, 3).map(l => (
                      <span key={l} style={{ fontSize: 8, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: `${fw.color}14`, color: fw.color }}>
                        {l}
                      </span>
                    ))}
                    {fw.langs.length > 3 && (
                      <span style={{ fontSize: 8, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: `${fw.color}14`, color: fw.color }}>
                        +{fw.langs.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {!selectedFramework && (
            <p className="text-xs text-neutral-mid dark:text-slate-500 mt-2">
              Select a framework to continue.
            </p>
          )}
        </div>

        {/* ── Website URL & credentials ──────────────────────────────────────── */}
        <FormField label="Website URL">
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Login Username (optional)">
            <Input
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </FormField>

          <FormField label="Login Password (optional)">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </FormField>
        </div>

        <FormField label={`Crawl Depth: ${crawlDepth}`}>
          <input
            type="range"
            min={1}
            max={5}
            value={crawlDepth}
            onChange={(e) => setCrawlDepth(Number(e.target.value))}
            className="w-full"
            disabled={loading}
          />
        </FormField>

        <FormField label="Environment">
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            disabled={loading}
            className="
              w-full px-3 py-2 rounded border border-[var(--card-border)]
              bg-[var(--card-bg)] text-[var(--fg)]
              focus:outline-none focus:ring-2 focus:ring-brand-primary
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="dev">Development</option>
          </select>
        </FormField>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <div className="pt-4">
          <Button
            disabled={!canContinue}
            onClick={handleContinue}
            className="w-full"
          >
            {loading ? "Creating…" : "Continue"}
          </Button>
        </div>

      </Card>
    </div>
  );
}
