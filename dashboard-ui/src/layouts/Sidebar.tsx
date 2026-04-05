import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

/* ---------- Types ---------- */

type AICommandResponse =
  | {
      intent: "navigate";
      target: string;
      params?: Record<string, any>;
    }
  | {
      intent: "action";
      action: string;
      projectId?: string;
      payload?: Record<string, any>;
    }
  | {
      intent: "search";
      results: { type: string; id: string; label: string; target?: string }[];
    };

type Command = {
  label: string;
  action: () => void;
};

/* ---------- Utils ---------- */

function fuzzyMatch(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

/* ---------- Command Palette (AI + local) ---------- */

function CommandPalette({
  open,
  setOpen,
  localCommands
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  localCommands: Command[];
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
    if (!open) {
      setQuery("");
      setIndex(0);
      setAiResults([]);
      setLoading(false);
      return;
    }
  }, [open]);

  // Call backend AI when query changes (debounced)
  useEffect(() => {
    if (!open || !query.trim()) {
      setAiResults([]);
      setLoading(false);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch("/ai/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query })
        });

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data: AICommandResponse = await res.json();

        if (data.intent === "search") {
          setAiResults(
            (data.results || []).map((r) => ({
              label: `${r.label} (${r.type})`,
              action: () => {
                if (r.target) navigate(r.target);
              }
            }))
          );
        } else if (data.intent === "navigate") {
          setAiResults([
            {
              label: `Go to ${data.target}`,
              action: () => navigate(data.target)
            }
          ]);
        } else if (data.intent === "action") {
          setAiResults([
            {
              label: `Run action: ${data.action}`,
              action: () => {
                // You can later wire specific actions here
              }
            }
          ]);
        }
      } catch {
        // fail silently for now
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [open, query, navigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, Math.max(combined.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        combined[index]?.action();
        setOpen(false);
      }
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
          placeholder="Ask Qlitz or type a command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          className="w-full px-4 py-3 bg-transparent border-b border-[var(--card-border)] outline-none text-lg"
        />

        <div className="max-h-[320px] overflow-y-auto">
          {combined.map((cmd, i) => (
            <div
              key={cmd.label + i}
              className={`
                px-4 py-3 cursor-pointer transition
                ${
                  i === index
                    ? "bg-brand-primary/20"
                    : "hover:bg-neutral-light dark:hover:bg-slate-700"
                }
              `}
              onClick={() => {
                cmd.action();
                setOpen(false);
              }}
            >
              {cmd.label}
            </div>
          ))}

          {loading && (
            <div className="px-4 py-3 text-gray-500 text-sm">Thinking…</div>
          )}

          {!loading && !combined.length && (
            <div className="px-4 py-3 text-gray-500 text-sm">No results</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Sidebar v5 ---------- */

export default function Sidebar({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [project, setProject] = useState("my-app");

  const pinned = ["qlitz-demo"];
  const recent = ["my-app", "enterprise-suite"];

  const [search, setSearch] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl + K → open palette
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

  const localCommands: Command[] = useMemo(
    () => [
      { label: "New Project", action: () => navigate("/projects/new") },
      { label: "All Projects", action: () => navigate("/projects") },
      { label: "Execution Timeline", action: () => navigate("/execution") },
      { label: "Release Readiness", action: () => navigate("/release") }
    ],
    [navigate]
  );

  return (
    <>
      <CommandPalette
        open={paletteOpen}
        setOpen={setPaletteOpen}
        localCommands={localCommands}
      />

      <aside
        className={`
          fixed left-0 top-0 h-full z-30 flex flex-col
          bg-[var(--card-bg)] border-r border-[var(--card-border)]
          transition-all duration-300
          ${open ? "w-64" : "w-20"}
        `}
      >
        {/* HEADER */}
        <div className="h-14 border-b border-[var(--card-border)] flex items-center px-4 gap-3">
          <button
            onClick={() => setOpen(!open)}
            className="text-2xl px-2 py-1 rounded hover:bg-neutral-light dark:hover:bg-slate-700 transition"
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

        {/* SEARCH */}
        <div className="p-3 border-b border-[var(--card-border)]">
          <input
            id="sidebar-search"
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`
              bg-neutral-light dark:bg-slate-700 rounded px-3 py-2 text-sm w-full
              transition-all duration-300
              ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
          />
        </div>

        {/* PINNED PROJECTS */}
        <SidebarSection open={open} label="Pinned Projects">
          {pinned.map((p) => (
            <ProjectItem key={p} name={p} open={open} />
          ))}
        </SidebarSection>

        {/* RECENT PROJECTS */}
        <SidebarSection open={open} label="Recent Projects">
          {recent.map((p) => (
            <ProjectItem key={p} name={p} open={open} />
          ))}
        </SidebarSection>

        {/* NAVIGATION */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          <SidebarGroup
            open={open}
            label="Projects"
            items={[
              { to: "/projects", label: "All Projects", icon: "📁" },
              { to: "/projects/new", label: "New Project", icon: "✨" }
            ]}
            search={search}
          />

          <SidebarGroup
            open={open}
            label="Execution"
            items={[
              { to: "/execution", label: "Timeline", icon: "⏱️" },
              { to: "/execution/trends", label: "Trends", icon: "📈" },
              { to: "/execution/insights", label: "Insights", icon: "💡" }
            ]}
            search={search}
          />

          <SidebarGroup
            open={open}
            label="Release"
            items={[
              { to: "/release", label: "Readiness", icon: "🚦" },
              { to: "/release/heatmap", label: "Heatmap", icon: "🔥" },
              { to: "/release/story", label: "Story", icon: "📘" },
              {
                to: `/release/${project}/requirements`,
                label: "Requirements",
                icon: "📋"
              },
              {
                to: `/release/${project}/self-healing`,
                label: "Self‑Healing",
                icon: "🛠️"
              }
            ]}
            search={search}
          />
        </nav>
      </aside>
    </>
  );
}

/* ---------- Section Wrapper ---------- */

function SidebarSection({
  open,
  label,
  children
}: {
  open: boolean;
  label: string;
  children: any;
}) {
  return (
    <div className="border-b border-[var(--card-border)] pb-3 mb-3">
      <div
        className={`
          px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400
          transition-opacity duration-300
          ${open ? "opacity-100" : "opacity-0"}
        `}
      >
        {label}
      </div>
      <div className="space-y-1 px-2">{children}</div>
    </div>
  );
}

/* ---------- Project Item ---------- */

function ProjectItem({ name, open }: { name: string; open: boolean }) {
  const initials = name
    .split("-")
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
        hover:bg-neutral-light dark:hover:bg-slate-700 transition-all
      `}
    >
      <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
        {initials}
      </div>

      <span
        className={`
          text-sm whitespace-nowrap transition-opacity duration-300
          ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        {name}
      </span>
    </div>
  );
}

/* ---------- Collapsible Group ---------- */

function SidebarGroup({
  open,
  label,
  items,
  search
}: {
  open: boolean;
  label: string;
  items: { to: string; label: string; icon: string }[];
  search: string;
}) {
  const location = useLocation();
  const active = items.some((i) => location.pathname.startsWith(i.to));
  const [expanded, setExpanded] = useState(active);

  useEffect(() => {
    if (active) setExpanded(true);
  }, [active]);

  const filtered = items.filter((i) => fuzzyMatch(i.label, search));

  if (!filtered.length) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400"
      >
        <span className={`${open ? "opacity-100" : "opacity-0"} transition-opacity`}>
          {label}
        </span>

        <span
          className={`
            text-sm transition-transform duration-300
            ${expanded ? "rotate-90" : ""}
            ${open ? "opacity-100" : "opacity-0"}
          `}
        >
          ▶
        </span>
      </button>

      {expanded && (
        <div className="mt-1 space-y-1">
          {filtered.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              open={open}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Nav Item ---------- */

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
  const isActive = path === to;

  return (
    <Link
      to={to}
      className={`
        group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all border-l-4
        ${
          isActive
            ? "bg-brand-primary/15 text-brand-primary border-brand-primary shadow-sm"
            : "text-gray-700 dark:text-slate-300 hover:bg-neutral-light dark:hover:bg-slate-700 border-transparent"
        }
      `}
    >
      <span
        className={`
          text-xl transition-transform duration-200
          ${isActive ? "scale-110" : "group-hover:scale-110"}
        `}
      >
        {icon}
      </span>

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
            opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg
          "
        >
          {label}
        </span>
      )}
    </Link>
  );
}
