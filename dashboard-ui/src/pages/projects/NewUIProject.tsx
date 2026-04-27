import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/form/Input";
import { Button } from "../../components/ui/form/Button";
import { FormField } from "../../components/ui/form/FormField";

import { socket } from "../../socket";
import ProgressModal from "../../components/ProgressModal";

export default function NewUIProject() {
  const navigate = useNavigate();

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

  function doNavigate() {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    setTimeout(() => {
      navigate(`/projects/${projectIdRef.current}`);
    }, 800);
  }

  useEffect(() => {
    // recrawl-progress is the main progress stream during pipeline
    const recrawlHandler = (data: any) => {
      setProgress({
        open: true,
        percent: data.percent ?? 0,
        step: data.step ?? "Working…"
      });
    };

    // project-status fires on status changes (processing, ready, failed)
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

    // recrawl-event fires when pipeline fully completes
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
          env
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

      // Join socket room BEFORE showing modal so no events are missed
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

      <Card className="space-y-6 p-8">

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
            disabled={!url.trim().startsWith("http") || loading}
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