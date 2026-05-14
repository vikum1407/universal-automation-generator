import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/form/Input";
import { Button } from "../../components/ui/form/Button";
import { FileUpload } from "../../components/ui/form/FileUpload";
import { FormField } from "../../components/ui/form/FormField";

import { socket } from "../../socket";
import ProgressModal from "../../components/ProgressModal";

// ─── API framework options ─────────────────────────────────────────────────────

const API_FRAMEWORKS = [
  {
    id:       "restassured",
    label:    "REST Assured",
    tagline:  "Swagger-driven Java API test suite",
    color:    "#10B981",
    langs:    ["Java"],
    detail:   "Generates a full Maven project with 100% positive + negative endpoint coverage from your Swagger spec.",
  },
  {
    id:       "playwright",
    label:    "Playwright",
    tagline:  "API testing with request fixtures",
    color:    "#7B5FFF",
    langs:    ["TypeScript", "JavaScript", "Python", "Java"],
    detail:   "Uses Playwright's built-in APIRequestContext — same runner for UI and API tests, with Swagger-driven coverage.",
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function NewAPIProject() {
  const navigate = useNavigate();

  const [selectedFramework, setSelectedFramework] = useState("");
  const selectedFrameworkRef = useRef("");

  const [swaggerUrl,  setSwaggerUrl]  = useState("");
  const [swaggerFile, setSwaggerFile] = useState<File | null>(null);
  const [authToken,   setAuthToken]   = useState("");
  const [env,         setEnv]         = useState("production");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const [progress, setProgress] = useState({ open: false, percent: 0, step: "Starting…" });

  const projectIdRef = useRef<string | null>(null);
  const navigatedRef = useRef(false);

  // Keep ref in sync so socket callbacks always see latest selection
  useEffect(() => { selectedFrameworkRef.current = selectedFramework; }, [selectedFramework]);

  function doNavigate() {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    const fw  = selectedFrameworkRef.current;
    const pid = projectIdRef.current;
    setTimeout(() => {
      if (fw && pid) {
        const params = new URLSearchParams({ projectId: pid, skipBuilder: "1", framework: fw });
        // For Playwright arriving from API wizard, pre-select API mode
        if (fw === "playwright") params.set("playwrightMode", "api");
        navigate(`/framework/start?${params.toString()}`);
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
        setProgress(prev => ({ ...prev, open: true, percent: data.progressPercent, step: data.progressStep ?? prev.step }));
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
    socket.on("project-status",   statusHandler);
    socket.on("recrawl-event",    eventHandler);

    return () => {
      socket.off("recrawl-progress", recrawlHandler);
      socket.off("project-status",   statusHandler);
      socket.off("recrawl-event",    eventHandler);
    };
  }, [navigate]);

  async function handleContinue() {
    setLoading(true);
    setError("");
    navigatedRef.current = false;

    try {
      const res = await fetch("http://localhost:3000/projects/scan-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swaggerUrl, authToken, env, framework: selectedFramework }),
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

  const hasSpec    = !!swaggerUrl.trim() || !!swaggerFile;
  const canContinue = !!selectedFramework && hasSpec && !loading;

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-10">
      <ProgressModal open={progress.open} percent={progress.percent} step={progress.step} />

      <h1 className="text-h1 font-semibold text-neutral-dark dark:text-neutral-light">
        API Automation — Swagger Setup
      </h1>

      <Card className="space-y-8 p-8">

        {/* ── Framework selector ─────────────────────────────────────────────── */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-mid dark:text-slate-400 mb-3">
            Automation Framework
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {API_FRAMEWORKS.map(fw => {
              const selected = selectedFramework === fw.id;
              return (
                <button
                  key={fw.id}
                  onClick={() => !loading && setSelectedFramework(fw.id)}
                  disabled={loading}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    padding: "14px 16px", borderRadius: 10, textAlign: "left", width: "100%",
                    cursor: loading ? "not-allowed" : "pointer",
                    border: selected ? `2px solid ${fw.color}` : "1.5px solid var(--card-border, #E5E7EB)",
                    background: selected ? `${fw.color}10` : "transparent",
                    boxShadow: selected ? `0 0 0 3px ${fw.color}18` : "none",
                    opacity: loading ? 0.6 : 1,
                    transition: "all 0.14s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: fw.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: selected ? fw.color : "var(--fg, #111827)" }}>
                      {fw.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 7, lineHeight: 1.5 }}>{fw.tagline}</div>
                  <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8, lineHeight: 1.5, opacity: 0.8 }}>{fw.detail}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {fw.langs.map(l => (
                      <span key={l} style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: `${fw.color}14`, color: fw.color }}>
                        {l}
                      </span>
                    ))}
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

        {/* ── Swagger spec ────────────────────────────────────────────────────── */}
        <FormField label="Swagger URL (optional)">
          <Input
            placeholder="https://example.com/swagger.json"
            value={swaggerUrl}
            onChange={(e) => setSwaggerUrl(e.target.value)}
            disabled={loading}
          />
        </FormField>

        <FormField label="Upload Swagger File (optional)">
          <FileUpload
            accept=".json,.yaml,.yml"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setSwaggerFile(file);
            }}
          />
          {swaggerFile && (
            <div className="text-sm text-neutral-mid dark:text-slate-400 mt-1">
              Selected: {swaggerFile.name}
            </div>
          )}
        </FormField>

        {!hasSpec && (
          <p className="text-xs text-neutral-mid dark:text-slate-500 -mt-4">
            Provide a Swagger URL or upload a file to continue.
          </p>
        )}

        <FormField label="Auth Token (optional)">
          <Input
            placeholder="Bearer abc123..."
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
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

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div className="pt-4">
          <Button onClick={handleContinue} disabled={!canContinue} className="w-full">
            {loading ? "Creating…" : "Continue"}
          </Button>
        </div>

      </Card>
    </div>
  );
}
