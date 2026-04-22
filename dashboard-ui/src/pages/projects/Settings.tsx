import { theme } from "@/theme";
import ReCrawl from "@/pages/projects/ReCrawl";
import RefactorPanel from "@/pages/projects/RefactorPanel";
import CloudSync from "@/pages/projects/CloudSync";
import FeaturesModal from "@/components/FeaturesModal";
import Tooltip from "@/components/Tooltip";
import InfoIcon from "@/components/icons/InfoIcon";
import { useState } from "react";

interface SettingsProps {
  project: any;
  navigate: (path: string) => void;
}

export default function Settings({ project, navigate }: SettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.xl }}>

      {/* FEATURES */}
      <section
        style={{
          padding: theme.spacing.lg,
          borderRadius: theme.radii.lg,
          border: `1px solid ${theme.colors.border}`,
          background: theme.colors.background
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h2
            style={{
              color: theme.colors.primary,
              marginBottom: theme.spacing.md,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            Features
            <Tooltip text="Core automation capabilities available for this project.">
              <span style={{ color: theme.colors.textLight, cursor: "help" }}>
                <InfoIcon size={16} />
              </span>
            </Tooltip>
          </h2>

          <button
            onClick={() => setOpen(true)}
            style={{
              padding: "6px 10px",
              fontSize: 13,
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.background,
              cursor: "pointer"
            }}
          >
            What’s Included
          </button>
        </div>

        <ReCrawl projectId={project.id} />
        <RefactorPanel projectId={project.id} />
      </section>

      {/* INTEGRATIONS */}
      <section
        style={{
          padding: theme.spacing.lg,
          borderRadius: theme.radii.lg,
          border: `1px solid ${theme.colors.border}`,
          background: theme.colors.background
        }}
      >
        <h2
          style={{
            color: theme.colors.primary,
            marginBottom: theme.spacing.md,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          Integrations
          <Tooltip text="External services and cloud features connected to this project.">
            <span style={{ color: theme.colors.textLight, cursor: "help" }}>
              <InfoIcon size={16} />
            </span>
          </Tooltip>
        </h2>

        <CloudSync projectId={project.id} />
      </section>

      {/* DANGER ZONE */}
      <section>
        <button
          style={{
            padding: "12px 16px",
            background: theme.colors.danger,
            color: "#fff",
            border: "none",
            borderRadius: theme.radii.md,
            cursor: "pointer",
            fontWeight: 600,
            width: "100%"
          }}
          onClick={async () => {
            await fetch(`http://localhost:3000/projects/${project.id}`, {
              method: "DELETE"
            });
            navigate("/projects");
          }}
        >
          Delete Project
        </button>
      </section>

      <FeaturesModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
