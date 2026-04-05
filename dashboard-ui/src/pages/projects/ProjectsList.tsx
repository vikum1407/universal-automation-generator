import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import ErrorBoundary from "../../components/ErrorBoundary";
import { theme } from "../../theme";

const API_BASE = "http://localhost:3000";

export default function ProjectsList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/projects`)
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <Loader />;

  return (
    <div style={{ padding: theme.spacing.xl }}>
      <h1 style={{ color: theme.colors.primary }}>Projects</h1>

      <button
        onClick={() => navigate("/projects/new")}
        style={{
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.lg,
          padding: "10px 16px",
          borderRadius: theme.radii.md,
          background: theme.colors.primary,
          border: "none",
          fontWeight: 600,
          cursor: "pointer",
          color: "white"
        }}
      >
        + New Project
      </button>

      {!projects.length && (
        <EmptyState message="No projects created yet." />
      )}

      {projects.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: theme.spacing.lg
          }}
        >
          {projects.map(project => (
            <ErrorBoundary key={project.id}>
              <div
                style={{
                  padding: theme.spacing.lg,
                  borderRadius: theme.radii.lg,
                  background: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  boxShadow: theme.shadow.card
                }}
              >
                <h3
                  style={{
                    color: theme.colors.primary,
                    marginBottom: theme.spacing.sm
                  }}
                >
                  {project.type.toUpperCase()} Project
                </h3>

                <p style={{ fontSize: theme.font.body, color: theme.colors.textLight }}>
                  <strong>ID:</strong> {project.id}
                </p>

                <p style={{ fontSize: theme.font.body, color: theme.colors.textLight }}>
                  <strong>Status:</strong> {project.status}
                </p>

                <p style={{ fontSize: theme.font.body, color: theme.colors.textLight }}>
                  <strong>Coverage:</strong> {project.coverage ?? 0}%
                </p>

                <p style={{ fontSize: theme.font.body, color: theme.colors.textLight }}>
                  <strong>Last Run:</strong>{" "}
                  {project.lastRun
                    ? new Date(project.lastRun).toLocaleString()
                    : "—"}
                </p>

                <button
                  onClick={() => navigate(`/projects/${project.id}`)}
                  style={{
                    marginTop: theme.spacing.md,
                    padding: "10px 16px",
                    borderRadius: theme.radii.md,
                    background: theme.colors.secondary,
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Open Project
                </button>
              </div>
            </ErrorBoundary>
          ))}
        </div>
      )}
    </div>
  );
}
