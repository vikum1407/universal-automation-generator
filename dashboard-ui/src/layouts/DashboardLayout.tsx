import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CommandPalette from "./CommandPalette";
import { usePageTitle } from "../hooks/usePageTitle";
import { useTheme } from "../hooks/useTheme";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const { toggle: toggleTheme } = useTheme();
  usePageTitle();

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 dark:text-slate-200">

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <CommandPalette
        open={paletteOpen}
        setOpen={setPaletteOpen}
        toggleTheme={toggleTheme}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div
        className={`
          h-full flex flex-col transition-all duration-300
          ${sidebarOpen ? "pl-64" : "pl-20"}
        `}
      >
        <Header />

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
