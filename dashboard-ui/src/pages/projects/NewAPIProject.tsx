import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/form/Input";
import { Button } from "../../components/ui/form/Button";
import { FileUpload } from "../../components/ui/form/FileUpload";
import { FormField } from "../../components/ui/form/FormField";

import { socket } from "../../socket";
import ProgressModal from "../../components/ProgressModal";

export default function NewAPIProject() {
  const navigate = useNavigate();

  const [swaggerUrl, setSwaggerUrl] = useState("");
  const [swaggerFile, setSwaggerFile] = useState<File | null>(null);
  const [authToken, setAuthToken] = useState("");
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

  function doNavigate() {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    setTimeout(() => {
      navigate(`/projects/${projectIdRef.current}`);
    }, 800);
  }

  useEffect(() => {
    const recrawlHandler = (data: any) => {
      setProgress({
        open: true,
        percent: data.percent ?? 0,
        step: data.step ?? "Working…"
      });
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
      const res = await fetch("http://localhost:3000/projects/scan-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swaggerUrl,
          authToken,
          env
        })
      });

      const data = await res.json();

      if (!data.projectId) {
        setError("Server did not return a project ID. Please try again.");
        setLoading(false);
        return;
      }

      projectIdRef.current = data.projectId;

      socket.emit("join", data.projectId);

      setProgress({ open: true, percent: 0, step: "Starting…" });

    } catch (e) {
      setError("Failed to create project. Please try again.");
      setLoading(false);
    }
  }

  const isValid = !!swaggerUrl || !!swaggerFile;

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-10">
      <ProgressModal
        open={progress.open}
        percent={progress.percent}
        step={progress.step}
      />

      <h1 className="text-h1 font-semibold text-neutral-dark dark:text-neutral-light">
        API Automation — Swagger Setup
      </h1>

      <Card className="space-y-8 p-8">

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

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <div className="pt-4">
          <Button
            onClick={handleContinue}
            disabled={!isValid || loading}
            className="w-full"
          >
            {loading ? "Creating…" : "Continue"}
          </Button>
        </div>

      </Card>
    </div>
  );
}