import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";

export default function ProjectCard({ project }: any) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      style={{
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #eee",
        cursor: "pointer",
        background: "white",
        transition: "0.2s",
      }}
    >
      <h2 style={{ margin: 0, color: "#7B2FF7" }}>
        {project.type.toUpperCase()} Project
      </h2>

      <p style={{ margin: "8px 0", color: "#555" }}>
        {project.type === "ui" ? project.url : project.swaggerUrl}
      </p>

      <StatusBadge status={project.status} />
    </div>
  );
}
