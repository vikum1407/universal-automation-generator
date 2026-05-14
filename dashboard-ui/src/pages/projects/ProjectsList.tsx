import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { useColors } from "../../hooks/useColors";

const API_BASE = "http://localhost:3000";

const TYPE_COLOR: Record<string, string> = { ui: "#9C27B0", api: "#448AFF" };
const STATUS_COLOR: Record<string, string> = {
  ready: "#00C853", processing: "#FFA726", failed: "#EF5350",
  initializing: "#FFA726", recrawling: "#448AFF",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ─── Rename modal ──────────────────────────────────────────────────────────────
function RenameModal({
  project, onClose, onSave,
}: { project: any; onClose: () => void; onSave: (name: string) => void }) {
  const [value, setValue] = useState(project.name || "");
  const { CARD: surface, BDR: border, TXT: text, P } = useColors();

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 420, padding: 28, borderRadius: 16,
        background: surface, border: `1px solid ${border}`,
        boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: P }}>
          Rename Project
        </div>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
          placeholder="Enter project name…"
          style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 14,
            border: `1px solid ${border}`, background: surface,
            color: text, outline: "none", width: "100%", boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px", borderRadius: 8, border: `1px solid ${border}`,
              background: "transparent", color: text, cursor: "pointer", fontSize: 13, fontWeight: 500,
            }}
          >Cancel</button>
          <button
            onClick={submit}
            disabled={!value.trim()}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "none",
              background: value.trim() ? P : "#ccc",
              color: "#fff", cursor: value.trim() ? "pointer" : "not-allowed",
              fontSize: 13, fontWeight: 700,
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({
  project, onClose, onConfirm,
}: { project: any; onClose: () => void; onConfirm: () => void }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 420, padding: 28, borderRadius: 16,
        background: surface, border: `1px solid ${border}`,
        boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#EF5350" }}>
          🗑️ Delete Project
        </div>
        <p style={{ fontSize: 13, color: textLight, margin: 0, lineHeight: 1.6 }}>
          This will permanently delete <strong style={{ color: text }}>{project.name}</strong> and all
          its generated tests, flows, and data. This action cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px", borderRadius: 8, border: `1px solid ${border}`,
              background: "transparent", color: text, cursor: "pointer", fontSize: 13, fontWeight: 500,
            }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "none",
              background: "#EF5350", color: "#fff", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
            }}
          >Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── 3-dots menu ──────────────────────────────────────────────────────────────
function DotsMenu({
  project, onPin, onRename, onDelete, onOpen,
}: {
  project: any;
  onPin: () => void; onRename: () => void;
  onDelete: () => void; onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, dark } = useColors();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const item = (icon: string, label: string, action: () => void, danger = false) => (
    <button
      key={label}
      onClick={e => { e.stopPropagation(); action(); setOpen(false); }}
      style={{
        width: "100%", padding: "9px 14px", border: "none",
        background: "transparent", textAlign: "left", cursor: "pointer",
        fontSize: 13, fontWeight: 500,
        color: danger ? "#EF5350" : text,
        display: "flex", alignItems: "center", gap: 9,
        transition: "background 0.1s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background =
          danger ? "#EF535015" : (dark ? "#2A1A40" : "#F5EEFF");
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          width: 32, height: 32, borderRadius: 8, border: `1px solid ${border}`,
          background: open ? (dark ? "#2A1A40" : "#EDE4FF") : "transparent",
          color: open ? P : textLight,
          cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center",
          justifyContent: "center", transition: "all 0.12s", fontWeight: 700,
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = dark ? "#2A1A40" : "#EDE4FF";
            (e.currentTarget as HTMLButtonElement).style.color = P;
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = textLight;
          }
        }}
        title="More options"
      >⋮</button>

      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", right: 0,
          minWidth: 180, borderRadius: 10, zIndex: 100,
          background: surface, border: `1px solid ${border}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          overflow: "hidden", padding: "4px 0",
        }}>
          {item("🚀", "Open Project", onOpen)}
          {item(project.pinned ? "📌 Unpin" : "📌", project.pinned ? "Unpin" : "Pin to Top", onPin)}
          {item("✏️", "Rename", onRename)}
          <div style={{ height: 1, background: border, margin: "4px 0" }} />
          {item("🗑️", "Delete", onDelete, true)}
        </div>
      )}
    </div>
  );
}

// ─── Project card ──────────────────────────────────────────────────────────────
function ProjectCard({
  project, onPin, onRename, onDelete,
}: {
  project: any;
  onPin: () => void; onRename: () => void; onDelete: () => void;
}) {
  const navigate = useNavigate();
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P } = useColors();

  const typeColor = TYPE_COLOR[project.type] ?? "#888";
  const statusColor = STATUS_COLOR[project.status] ?? "#888";
  const url = project.type === "ui" ? project.url : project.swaggerUrl;

  const open = () => navigate(`/projects/${project.id}`);

  return (
    <div
      onClick={open}
      style={{
        padding: "20px 20px 16px",
        borderRadius: 16,
        background: surface,
        border: `1px solid ${border}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        cursor: "pointer",
        position: "relative",
        transition: "box-shadow 0.15s ease, transform 0.15s ease",
        display: "flex", flexDirection: "column", gap: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 6px 24px rgba(123,47,247,0.15)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
        el.style.transform = "translateY(0)";
      }}
    >
      {project.pinned && (
        <div title="Pinned" style={{ position: "absolute", top: 12, right: 12, fontSize: 14 }}>📌</div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{
          padding: "2px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: `${typeColor}22`, color: typeColor,
        }}>{project.type.toUpperCase()}</span>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: P, marginBottom: 4, paddingRight: 28 }}>
        {project.name}
      </div>

      {url && (
        <div style={{
          fontSize: 11, color: textLight, marginBottom: 12,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }} title={url}>
          {url}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: statusColor, flexShrink: 0,
            boxShadow: `0 0 6px ${statusColor}88`,
          }} />
          <span style={{ color: text, fontWeight: 500 }}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        </div>

        <div style={{ fontSize: 12, color: textLight }}>
          Coverage: <strong style={{ color: text }}>{project.coverage ?? 0}%</strong>
          {project.tests > 0 && (
            <span style={{ marginLeft: 8, color: textLight }}>· {project.tests} test{project.tests !== 1 ? "s" : ""}</span>
          )}
        </div>

        {project.createdAt && (
          <div style={{ fontSize: 11, color: textLight }}>
            Created {fmtDate(project.createdAt)}
          </div>
        )}

        {project.lastRun && (
          <div style={{ fontSize: 11, color: textLight }}>
            Last run {fmtDate(project.lastRun)}
          </div>
        )}
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={open}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 10, border: "none",
            background: P, color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
            transition: "opacity 0.12s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          Open Project
        </button>

        <DotsMenu
          project={project}
          onOpen={open}
          onPin={onPin}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

// ─── Projects list ─────────────────────────────────────────────────────────────
export default function ProjectsList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [renameTarget, setRenameTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { TXT2: textLight, P } = useColors();

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      const data: any[] = await res.json();

      const enriched = await Promise.all(
        data.map(async p => {
          try {
            const ar = await fetch(`${API_BASE}/projects/${p.id}/analytics`);
            const a = await ar.json();
            return { ...p, coverage: a.coverage ?? 0, tests: a.tests ?? 0, lastRun: a.lastRun ?? null };
          } catch {
            return { ...p, coverage: 0, tests: 0 };
          }
        })
      );

      setProjects(enriched);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pin = async (project: any) => {
    const newPinned = !project.pinned;
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, pinned: newPinned } : p));
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: newPinned }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(newPinned ? "Project pinned" : "Project unpinned");
      load();
    } catch {
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, pinned: !newPinned } : p));
      toast.error("Failed to update pin status");
    }
  };

  const rename = async (project: any, name: string) => {
    const oldName = project.name;
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, name } : p));
    setRenameTarget(null);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Project renamed");
      load();
    } catch {
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, name: oldName } : p));
      toast.error("Failed to rename project");
    }
  };

  const deleteProject = async (project: any) => {
    setDeleteTarget(null);
    setProjects(prev => prev.filter(p => p.id !== project.id));
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
      load();
    }
  };

  if (loading) return <Loader />;

  if (!projects.length) {
    navigate("/projects/new", { replace: true });
    return null;
  }

  const pinned = projects.filter(p => p.pinned);
  const rest = projects.filter(p => !p.pinned);

  return (
    <div style={{ padding: 32 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ color: P, margin: 0 }}>Projects</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => navigate("/framework/start")}
            style={{
              padding: "10px 18px", borderRadius: 10,
              background: "transparent", border: `1.5px solid ${P}`,
              fontWeight: 700, cursor: "pointer", color: P, fontSize: 13,
              display: "flex", alignItems: "center", gap: 7,
              transition: "background 0.12s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${P}10`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            ⬡ Framework Generator
          </button>
          <button
            onClick={() => navigate("/projects/new")}
            style={{
              padding: "10px 20px", borderRadius: 10,
              background: P, border: "none",
              fontWeight: 700, cursor: "pointer", color: "white", fontSize: 14,
              transition: "opacity 0.12s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            + New Project
          </button>
        </div>
      </div>

      {!projects.length && <EmptyState message="No projects yet. Create your first project." />}

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: textLight,
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            📌 Pinned ({pinned.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {pinned.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onPin={() => pin(p)}
                onRename={() => setRenameTarget(p)}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All projects */}
      {rest.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <div style={{
              fontSize: 11, fontWeight: 700, color: textLight,
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
            }}>
              All Projects ({rest.length})
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {rest.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onPin={() => pin(p)}
                onRename={() => setRenameTarget(p)}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
          </div>
        </div>
      )}

      {renameTarget && (
        <RenameModal
          project={renameTarget}
          onClose={() => setRenameTarget(null)}
          onSave={name => rename(renameTarget, name)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteProject(deleteTarget)}
        />
      )}
    </div>
  );
}
