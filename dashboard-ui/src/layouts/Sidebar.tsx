import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

/* ---------- Types ---------- */

type AICommandResponse =
  | { intent: "navigate"; target: string; params?: Record<string, any> }
  | { intent: "action"; action: string; projectId?: string; payload?: Record<string, any> }
  | { intent: "search"; results: { type: string; id: string; label: string; target?: string }[] };

type Command = { label: string; action: () => void };

function fuzzyMatch(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

/* ---------- Command Palette ---------- */

function CommandPalette({
  open, setOpen, localCommands,
}: {
  open: boolean; setOpen: (v: boolean) => void; localCommands: Command[];
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [aiResults, setAiResults] = useState<Command[]>([]);
  const [loading, setLoading] = useState(false);

  const localFiltered = useMemo(
    () => localCommands.filter((c) => fuzzyMatch(c.label, query)),
    [localCommands, query]
  );
  const combined = [...localFiltered, ...aiResults];

  useEffect(() => {
    if (!open) { setQuery(""); setIndex(0); setAiResults([]); setLoading(false); }
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) { setAiResults([]); setLoading(false); return; }
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch("/ai/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (!res.ok) return;
        const data: AICommandResponse = await res.json();
        if (data.intent === "search") {
          setAiResults((data.results || []).map((r) => ({
            label: `${r.label} (${r.type})`,
            action: () => { if (r.target) navigate(r.target); },
          })));
        } else if (data.intent === "navigate") {
          setAiResults([{ label: `Go to ${data.target}`, action: () => navigate(data.target) }]);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(handle);
  }, [open, query, navigate]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, combined.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); combined[index]?.action(); setOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, combined, index, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-start justify-center pt-32">
      <div className="w-[500px] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl overflow-hidden">
        <input
          autoFocus
          placeholder="Search or type a command…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
          className="w-full px-4 py-3 bg-transparent border-b border-[var(--card-border)] outline-none text-lg"
        />
        <div className="max-h-[320px] overflow-y-auto">
          {combined.map((cmd, i) => (
            <div
              key={cmd.label + i}
              className={`px-4 py-3 cursor-pointer transition ${i === index ? "bg-brand-primary/20" : "hover:bg-neutral-light dark:hover:bg-slate-700"}`}
              onClick={() => { cmd.action(); setOpen(false); }}
            >
              {cmd.label}
            </div>
          ))}
          {loading && <div className="px-4 py-3 text-gray-500 text-sm">Searching…</div>}
          {!loading && !combined.length && <div className="px-4 py-3 text-gray-500 text-sm">No results</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Nav Item ---------- */

function NavItem({ to, label, icon, open, exact = false }: {
  to: string; label: string; icon: string; open: boolean; exact?: boolean;
}) {
  const location = useLocation();
  const path = location.pathname.replace(/\/+$/, "");
  const isActive = exact ? path === to : path === to || path.startsWith(to + "/");

  return (
    <Link
      to={to}
      title={!open ? label : undefined}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
        ${isActive
          ? "bg-brand-primary/15 text-brand-primary"
          : "text-gray-600 dark:text-slate-400 hover:bg-neutral-light dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
        }
      `}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-primary rounded-r" />
      )}

      <span className={`text-lg flex-shrink-0 transition-transform duration-150 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
        {icon}
      </span>

      <span className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
        {label}
      </span>

      {/* Tooltip when collapsed */}
      {!open && (
        <span className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-gray-900 dark:bg-slate-700 text-white text-xs whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
          {label}
        </span>
      )}
    </Link>
  );
}

/* ---------- Section Label ---------- */

function SectionLabel({ label, open }: { label: string; open: boolean }) {
  return (
    <div className={`px-3 pt-5 pb-1.5 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
        {label}
      </span>
    </div>
  );
}

/* ---------- Divider ---------- */

function Divider() {
  return <div className="mx-3 my-2 border-t border-[var(--card-border)]" />;
}

/* ---------- Sidebar ---------- */

export default function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const localCommands: Command[] = useMemo(() => [
    { label: "All Projects", action: () => navigate("/projects") },
    { label: "Execution Timeline", action: () => navigate("/execution") },
    { label: "Release Readiness", action: () => navigate("/release") },
  ], [navigate]);

  return (
    <>
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} localCommands={localCommands} />

      <aside
        className={`
          fixed left-0 top-0 h-full z-30 flex flex-col
          bg-[var(--card-bg)] border-r border-[var(--card-border)]
          transition-all duration-300
          ${open ? "w-60" : "w-[60px]"}
        `}
      >
        {/* ── Logo + Toggle ── */}
        <div className="h-14 flex items-center px-3 gap-3 border-b border-[var(--card-border)] flex-shrink-0">
          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-light dark:hover:bg-slate-700 transition flex-shrink-0 text-gray-600 dark:text-slate-300"
            title="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="3.5" width="16" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="1" y="8.25" width="16" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="1" y="13" width="16" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </button>

          <span className={`font-bold text-base text-brand-primary whitespace-nowrap transition-all duration-200 ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
            Qlitz
          </span>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4">

          {/* WORKSPACE */}
          <SectionLabel label="Workspace" open={open} />
          <NavItem to="/projects" label="All Projects" icon="🗂️" open={open} exact />

          <Divider />

          {/* EXECUTION */}
          <SectionLabel label="Execution" open={open} />
          <NavItem to="/execution" label="Timeline" icon="⏱️" open={open} exact />
          <NavItem to="/execution/trends" label="Trends" icon="📈" open={open} />
          <NavItem to="/execution/insights" label="Insights" icon="💡" open={open} />

          <Divider />

          {/* RELEASE */}
          <SectionLabel label="Release" open={open} />
          <NavItem to="/release" label="Readiness" icon="🚦" open={open} exact />
          <NavItem to="/release/heatmap" label="Heatmap" icon="🔥" open={open} />
          <NavItem to="/release/story" label="Story" icon="📘" open={open} />
        </nav>

        {/* ── Bottom: Cmd+K hint ── */}
        <div className={`px-3 py-3 border-t border-[var(--card-border)] flex-shrink-0 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 dark:text-slate-500 hover:bg-neutral-light dark:hover:bg-slate-700 transition"
          >
            <span className="flex-1 text-left">Search commands</span>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 font-mono text-[10px] border border-gray-200 dark:border-slate-600">
              ⌘K
            </kbd>
          </button>
        </div>
      </aside>
    </>
  );
}
