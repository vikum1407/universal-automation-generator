import { useTheme } from "../hooks/useTheme";
import Breadcrumbs from "./Breadcrumbs";

export default function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="h-14 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4">

      {/* LEFT: Logo + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-blue-600 rounded-md" />
        <Breadcrumbs />
      </div>

      {/* RIGHT: Search + Dark Mode + Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search…"
            className="px-3 py-1.5 rounded bg-gray-100 dark:bg-slate-700 text-sm focus:outline-none w-64"
          />
          <span className="absolute right-2 top-1.5 text-gray-500 dark:text-slate-400 text-xs">
            ⌘K
          </span>
        </div>

        <button
          onClick={toggle}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-slate-700 text-sm"
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 cursor-pointer" />
      </div>
    </header>
  );
}
