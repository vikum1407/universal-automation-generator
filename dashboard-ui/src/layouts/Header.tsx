import { useTheme } from "../hooks/useTheme";
import Breadcrumbs from "./Breadcrumbs";

export default function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="h-14 border-b border-[var(--card-border)] bg-[var(--card-bg)] flex items-center justify-between px-4 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-brand-primary rounded-md" />
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search…"
            className="px-3 py-1.5 rounded bg-neutral-light dark:bg-slate-700 text-sm focus:outline-none w-64"
          />
          <span className="absolute right-2 top-1.5 text-neutral-mid text-xs">
            ⌘K
          </span>
        </div>

        <button
          onClick={toggle}
          className="px-3 py-1 rounded bg-neutral-light dark:bg-slate-700 text-sm"
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <div className="w-8 h-8 rounded-full bg-neutral-light dark:bg-slate-600 cursor-pointer" />
      </div>
    </header>
  );
}
