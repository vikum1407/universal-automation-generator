import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Sidebar({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [project, setProject] = useState("my-app");
  const projects = ["my-app", "qlitz-demo", "enterprise-suite"];

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-30 flex flex-col
        bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700
        transition-all duration-300
        ${open ? "w-64" : "w-20"}
      `}
    >
      <div className="h-14 border-b dark:border-slate-700 flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(!open)}
          className="text-2xl px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
        >
          ☰
        </button>

        <span
          className={`
            font-semibold text-base whitespace-nowrap overflow-hidden
            transition-all duration-300 delay-150
            ${open ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"}
          `}
        >
          Qlitz Dashboard
        </span>
      </div>

      <div className="p-4 border-b dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">📁</span>

          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className={`
              bg-gray-100 dark:bg-slate-700 rounded px-2 py-1 text-sm w-full
              transition-opacity duration-300
              ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
          >
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-2">
        <NavItem to="/journeys" label="Projects" icon="📁" open={open} />

        <NavItem to="/execution" label="Execution Timeline" icon="⏱️" open={open} />
        <NavItem to="/execution/trends" label="Execution Trends" icon="📈" open={open} />
        <NavItem to="/execution/insights" label="Execution Insights" icon="💡" open={open} />

        <NavItem to="/release" label="Release Readiness" icon="🚦" open={open} />
        <NavItem to="/release/heatmap" label="Release Heatmap" icon="🔥" open={open} />
        <NavItem to="/release/story" label="Release Story" icon="📘" open={open} />
        <NavItem
          to={`/release/${project}/requirements`}
          label="Requirements"
          icon="📋"
          open={open}
        />
        <NavItem
          to={`/release/${project}/self-healing`}
          label="Self‑Healing"
          icon="🛠️"
          open={open}
        />
      </nav>
    </aside>
  );
}

function NavItem({
  to,
  label,
  icon,
  open
}: {
  to: string;
  label: string;
  icon: string;
  open: boolean;
}) {
  const location = useLocation();
  const path = location.pathname.replace(/\/+$/, "");

  // ✅ FIX: Simple exact match for all items — each tab highlights only itself
  const isActive = path === to;

  return (
    <Link
      to={to}
      className={`
        group relative flex items-center gap-3 px-3 py-2 rounded transition border-l-4
        ${
          isActive
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-500"
            : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border-transparent"
        }
      `}
    >
      <span className="text-xl">{icon}</span>

      <span
        className={`
          whitespace-nowrap transition-opacity duration-300
          ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        {label}
      </span>

      {!open && (
        <span
          className="
            absolute left-full ml-2 px-2 py-1 rounded bg-gray-800 text-white text-xs
            opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap
          "
        >
          {label}
        </span>
      )}
    </Link>
  );
}