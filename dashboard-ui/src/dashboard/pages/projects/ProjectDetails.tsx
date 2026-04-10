import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import ProjectLayout from "./layout/ProjectLayout";
import ProjectSidebar from "./layout/ProjectSidebar";
import type { TabId } from "./layout/ProjectSidebar";
import ProjectTabs from "./layout/ProjectTabs";

import { socket, joinProjectRoom } from "@/ai/ws";
import { toast } from "react-hot-toast";

function ProgressOverlay({
  title,
  step,
  percent,
}: {
  title: string;
  step: string;
  percent: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-10 py-8 shadow-xl max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">
          {title}
        </h2>

        <p className="text-sm text-neutral-mid dark:text-slate-400 mb-4">
          {step}
        </p>

        <div className="w-full bg-neutral-light dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-brand-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-2 text-xs text-neutral-mid dark:text-slate-400">
          {percent}% complete
        </div>
      </div>
    </div>
  );
}

const API_BASE = "http://localhost:3000";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [collapsed, setCollapsed] = useState(false);

  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStep, setProgressStep] = useState("Working…");

  const loadProject = () => {
    fetch(`${API_BASE}/projects/${id}`)
      .then((res) => res.json())
      .then((p) => {
        if (!p || p.id === "temp-id") {
          navigate("/projects");
          return;
        }

        setProject(p);

        if (p.progressPercent) setProgressPercent(p.progressPercent);
        if (p.progressStep) setProgressStep(p.progressStep);

        setLoading(false);
      })
      .catch(() => navigate("/projects"));
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    joinProjectRoom(id);

    socket.on("project-status", (msg: any) => {
      setProject((prev: any) => ({
        ...prev,
        status: msg.status,
      }));

      if (msg.progressPercent !== undefined) {
        setProgressPercent(msg.progressPercent);
      }
      if (msg.progressStep) {
        setProgressStep(msg.progressStep);
      }
    });

    socket.on("recrawl-progress", (msg: any) => {
      setProject((prev: any) => ({
        ...prev,
        status: "recrawling",
      }));
      setProgressPercent(msg.percent ?? 0);
      setProgressStep(msg.step ?? "Working…");
    });

    socket.on("recrawl-event", (msg: any) => {
      if (msg.event === "recrawl-completed") {
        toast.success("Re‑crawl completed");
        loadProject();
      }
    });

    return () => {
      socket.off("project-status");
      socket.off("recrawl-progress");
      socket.off("recrawl-event");
    };
  }, [id]);

  if (loading || !project) return null;

  const isInitializing = project.status === "initializing";
  const isRecrawling = project.status === "recrawling";

  return (
    <>
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

      {(isInitializing || isRecrawling) && (
        <ProgressOverlay
          title={isInitializing ? "Setting Up Your Project" : "Re‑Crawling UI"}
          step={progressStep}
          percent={progressPercent}
        />
      )}
    </>
  );
}
