import { useState } from "react";
import Button from "../../dashboard/components/Button";
import { theme } from "../../theme";

const API_BASE = "http://localhost:3000";

export default function CloudSync({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = async () => {
    setStatus("syncing");
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/cloud-sync`, {
        method: "POST"
      });

      if (!res.ok) throw new Error("Sync failed");

      await res.json();
      setLastSync(new Date().toLocaleString());
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setError(err.message);
    }
  };

  return (
    <div style={{ marginTop: theme.spacing.xl }}>
      <h3 style={{ color: theme.colors.primary }}>Cloud Sync</h3>

      <div
        style={{
          marginTop: theme.spacing.md,
          padding: theme.spacing.lg,
          borderRadius: theme.radii.lg,
          background: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadow.card
        }}
      >
        <Button onClick={sync} disabled={status === "syncing"}>
          {status === "syncing" ? "Syncing…" : "Sync Now"}
        </Button>

        {status === "error" && (
          <div style={{ marginTop: theme.spacing.sm, color: theme.colors.danger }}>
            Sync failed: {error}
          </div>
        )}

        {lastSync && (
          <p style={{ marginTop: theme.spacing.sm, color: theme.colors.textLight }}>
            Last synced: {lastSync}
          </p>
        )}
      </div>
    </div>
  );
}
