import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../theme";
import { socket } from "@/socket";
import ProgressModal from "@/components/ProgressModal";

export default function CreateProject() {
  const [type, setType] = useState<"ui" | "api">("ui");
  const [form, setForm] = useState<any>({});
  const [progress, setProgress] = useState({
    open: false,
    percent: 0,
    step: "Starting…"
  });
  const navigate = useNavigate();

  useEffect(() => {
    const statusHandler = (data: any) => {
      if (data.progressPercent === undefined) return;
      if (data.progressPercent === 0 && data.progressStep === "Starting…") return;

      setProgress({
        open: data.progressPercent < 100,
        percent: data.progressPercent,
        step: data.progressStep
      });
    };

    const progressHandler = (data: any) => {
      setProgress({
        open: true,
        percent: data.percent,
        step: data.step
      });
    };

    const eventHandler = () => {
      setProgress({
        open: false,
        percent: 100,
        step: "Completed"
      });
    };

    socket.on("project-status", statusHandler);
    socket.on("recrawl-progress", progressHandler);
    socket.on("recrawl-event", eventHandler);

    return () => {
      socket.off("project-status", statusHandler);
      socket.off("recrawl-progress", progressHandler);
      socket.off("recrawl-event", eventHandler);
    };
  }, []);

  const update = (k: string, v: any) =>
    setForm((f: any) => ({ ...f, [k]: v }));

  const create = async () => {
    setProgress({ open: true, percent: 0, step: "Starting…" });

    const res = await fetch("http://localhost:3000/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type })
    });

    const project = await res.json();

    socket.emit("join", project.id);

    setTimeout(() => navigate(`/projects/${project.id}`), 1200);
  };

  return (
    <div style={{ padding: theme.spacing.xl }}>
      <ProgressModal open={progress.open} percent={progress.percent} step={progress.step} />

      <h1 style={{ color: theme.colors.primary }}>Create Project</h1>

      <div style={{ marginTop: theme.spacing.md }}>
        <label>Project Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as any)}
          style={{
            marginLeft: theme.spacing.sm,
            padding: theme.spacing.sm,
            borderRadius: theme.radii.md
          }}
        >
          <option value="ui">UI Project</option>
          <option value="api">API Project</option>
        </select>
      </div>

      {type === "ui" && (
        <div style={{ marginTop: theme.spacing.lg }}>
          <label>URL</label>
          <input
            type="text"
            onChange={e => update("url", e.target.value)}
            style={{ display: "block", marginTop: theme.spacing.sm }}
          />

          <label>Username</label>
          <input
            type="text"
            onChange={e => update("username", e.target.value)}
            style={{ display: "block", marginTop: theme.spacing.sm }}
          />

          <label>Password</label>
          <input
            type="password"
            onChange={e => update("password", e.target.value)}
            style={{ display: "block", marginTop: theme.spacing.sm }}
          />

          <label>Crawl Depth</label>
          <input
            type="number"
            onChange={e => update("crawlDepth", Number(e.target.value))}
            style={{ display: "block", marginTop: theme.spacing.sm }}
          />

          <label>Environment</label>
          <input
            type="text"
            onChange={e => update("env", e.target.value)}
            style={{ display: "block", marginTop: theme.spacing.sm }}
          />
        </div>
      )}

      {type === "api" && (
        <div style={{ marginTop: theme.spacing.lg }}>
          <label>Swagger URL</label>
          <input
            type="text"
            onChange={e => update("swaggerUrl", e.target.value)}
            style={{ display: "block", marginTop: theme.spacing.sm }}
          />

          <label>Swagger File Path</label>
          <input
            type="text"
            onChange={e => update("swaggerFilePath", e.target.value)}
            style={{ display: "block", marginTop: theme.spacing.sm }}
          />

          <label>Auth Token</label>
          <input
            type="text"
            onChange={e => update("authToken", e.target.value)}
            style={{ display: "block", marginTop: theme.spacing.sm }}
          />

          <label>Environment</label>
          <input
            type="text"
            onChange={e => update("env", e.target.value)}
            style={{ display: "block", marginTop: theme.spacing.sm }}
          />
        </div>
      )}

      <button
        onClick={create}
        style={{
          marginTop: theme.spacing.xl,
          padding: "10px 16px",
          borderRadius: theme.radii.md,
          background: theme.colors.secondary,
          border: "none",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        Generate Framework
      </button>
    </div>
  );
}
