import { NavLink, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { useTheme } from "../hooks/useTheme";

export default function DashboardLayout({ children }: { children?: ReactNode }) {
  const { theme, toggle } = useTheme();

  // Your project name from run files
  const project = "my-app";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 dark:text-slate-200">
      
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 p-4">
        <h1 className="text-xl font-bold mb-6">Qlitz Dashboard</h1>

        <nav className="space-y-2">
          <NavItem to="/journeys" label="Projects" />

          <NavItem to="/execution" label="Execution Timeline" />
          <NavItem to="/execution/trends" label="Execution Trends" />
          <NavItem to="/execution/insights" label="Execution Insights" />

          <NavItem to="/release" label="Release Readiness" />
          <NavItem to="/release/heatmap" label="Release Heatmap" />
          <NavItem to="/release/story" label="Release Story" />

          <NavItem
            to={`/release/${project}/requirements`}
            label="Requirements"
          />
          <NavItem
            to={`/release/${project}/self-healing`}
            label="Self‑Healing"
          />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-6">
          <div className="font-semibold">Qlitz</div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-slate-700 text-sm"
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>

            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600" />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  const exactRoutes = ["/journeys", "/execution", "/release"];
  const useExact = exactRoutes.includes(to);

  return (
    <NavLink
      to={to}
      end={useExact}
      className={({ isActive }) =>
        `block px-3 py-2 rounded transition ${
          isActive
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
            : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
