import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import ProjectLayout from "./layout/ProjectLayout";

// ⭐ FIXED: import the component AND the type separately
import ProjectSidebar from "./layout/ProjectSidebar";
import type { TabId } from "./layout/ProjectSidebar";

import ProjectTabs from "./layout/ProjectTabs";

const API_BASE = "http://localhost:3000";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/projects/${id}`)
      .then(res => res.json())
      .then(p => {
        if (!p || p.id === "temp-id") {
          navigate("/projects");
          return;
        }
        setProject(p);
        setLoading(false);
      })
      .catch(() => navigate("/projects"));
  }, [id]);

  if (loading || !project) return null;

  return (
    <ProjectLayout
      sidebar={
        <ProjectSidebar
          project={project}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      }
      content={<ProjectTabs project={project} activeTab={activeTab} />}
    />
  );
}
