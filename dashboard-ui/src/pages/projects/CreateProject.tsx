import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../theme";

export default function CreateProject() {
  const [type, setType] = useState<"ui" | "api">("ui");
  const [form, setForm] = useState<any>({});
  const navigate = useNavigate();

  const update = (k: string, v: any) =>
    setForm((f: any) => ({ ...f, [k]: v }));

  const create = async () => {
    const endpoint = type === "ui" ? "/projects/ui" : "/projects/api";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const project = await res.json();
    navigate(`/projects/${project.id}`);
  };

  return (
    <div style={{ padding: theme.spacing.xl }}>
      <h1 style={{ color: theme.colors.primary }}>Create Project</h1>

      {/* Project Type */}
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

      {/* UI Project Form */}
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

      {/* API Project Form */}
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

      {/* Submit */}
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
