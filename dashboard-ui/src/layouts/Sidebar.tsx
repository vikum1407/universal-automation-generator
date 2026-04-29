import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AICommandResponse =
  | { intent: "navigate"; target: string; params?: Record<string, any> }
  | { intent: "action"; action: string; projectId?: string; payload?: Record<string, any> }
  | { intent: "search"; results: { type: string; id: string; label: string; target?: string }[] };

type Command = { label: string; action: () => void; hint?: string };

// ─── Dark mode hook (watches html.dark class) ─────────────────────────────────

function useDarkMode(): boolean {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Design tokens (light / dark) ─────────────────────────────────────────────

interface Tokens {
  bg:         string;
  bgHover:    string;
  bgActive:   string;
  border:     string;
  accent:     string;
  accentSoft: string;
  accentGlow: string;
  text:       string;
  textMuted:  string;
  textDim:    string;
  logoText:   string;
  searchBg:   string;
}

const DARK: Tokens = {
  bg:         "#0D0F14",
  bgHover:    "#1A1D26",
  bgActive:   "#1E2130",
  border:     "#1F2333",
  accent:     "#7B5FFF",
  accentSoft: "#7B5FFF18",
  accentGlow: "#7B5FFF40",
  text:       "#E2E6F0",
  textMuted:  "#6B7280",
  textDim:    "#3E4255",
  logoText:   "#FFFFFF",
  searchBg:   "#13151E",
};

const LIGHT: Tokens = {
  bg:         "#FFFFFF",
  bgHover:    "#F4F5F9",
  bgActive:   "#EDF0FF",
  border:     "#E5E7EB",
  accent:     "#6D4FF0",
  accentSoft: "#6D4FF012",
  accentGlow: "#6D4FF035",
  text:       "#111827",
  textMuted:  "#6B7280",
  textDim:    "#9CA3AF",
  logoText:   "#111827",
  searchBg:   "#F9FAFB",
};

// ─── SVG icon wrapper ─────────────────────────────────────────────────────────

function Icon({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconProjects() {
  return <Icon>
    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".9"/>
  </Icon>;
}

function IconTimeline() {
  return <Icon>
    <rect x="1" y="3" width="14" height="2" rx="1" fill="currentColor" opacity=".25"/>
    <rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor" opacity=".25"/>
    <rect x="1" y="11" width="14" height="2" rx="1" fill="currentColor" opacity=".25"/>
    <rect x="1" y="3" width="6" height="2" rx="1" fill="currentColor"/>
    <rect x="4" y="7" width="7" height="2" rx="1" fill="currentColor"/>
    <rect x="2" y="11" width="9" height="2" rx="1" fill="currentColor"/>
  </Icon>;
}

function IconTrends() {
  return <Icon>
    <polyline points="1,13 4,9 7,11 10,6 14,4"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="14" cy="4" r="1.5" fill="currentColor"/>
  </Icon>;
}

function IconInsights() {
  return <Icon>
    <path d="M8 2C5.8 2 4 3.8 4 6c0 1.5.8 2.8 2 3.5V11h4V9.5C11.2 8.8 12 7.5 12 6c0-2.2-1.8-4-4-4z"
      fill="currentColor" opacity=".85"/>
    <rect x="5.5" y="12" width="5" height="1.5" rx=".75" fill="currentColor" opacity=".6"/>
    <rect x="6.5" y="13.5" width="3" height="1" rx=".5" fill="currentColor" opacity=".35"/>
  </Icon>;
}

function IconReadiness() {
  return <Icon>
    <path d="M8 1.5L2 4.5v4c0 3.1 2.5 5.5 6 6.2 3.5-.7 6-3.1 6-6.2v-4L8 1.5z"
      stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
    <path d="M5.5 8.2l1.8 1.8L11 6"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Icon>;
}

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Logo mark ────────────────────────────────────────────────────────────────

function LogoMark({ size = 26, accent }: { size?: number; accent: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill={accent}/>
      <path d="M14 6L6 10.5v7L14 22l8-4.5v-7L14 6z"
        stroke="white" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
      <circle cx="14" cy="14" r="2.5" fill="white" opacity=".95"/>
    </svg>
  );
}

// ─── Tooltip (for collapsed mode) ─────────────────────────────────────────────

function Tooltip({ label, children, S }: {
  label: string; children: React.ReactNode; S: Tokens;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: "absolute",
          left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)",
          zIndex: 200,
          background: S.bgActive,
          color: S.text,
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
          pointerEvents: "none",
          border: `1px solid ${S.border}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        }}>
          {label}
          <div style={{
            position: "absolute", right: "100%", top: "50%",
            transform: "translateY(-50%)",
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderRight: `6px solid ${S.bgActive}`,
          }} />
        </div>
      )}
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ to, label, icon, collapsed, exact = false, S }: {
  to: string; label: string; icon: React.ReactNode;
  collapsed: boolean; exact?: boolean; S: Tokens;
}) {
  const location = useLocation();
  const p = location.pathname.replace(/\/+$/, "");
  const isActive = exact ? p === to : p === to || p.startsWith(to + "/");

  const [hovered, setHovered] = useState(false);

  const btn = (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center",
        gap: 10,
        padding: collapsed ? "9px 0" : "8px 11px",
        borderRadius: 9,
        textDecoration: "none",
        color: isActive ? S.accent : hovered ? S.text : S.textMuted,
        background: isActive ? S.bgActive : hovered ? S.bgHover : "transparent",
        fontWeight: isActive ? 600 : 400,
        fontSize: 13.5,
        transition: "background 0.13s, color 0.13s",
        position: "relative",
        justifyContent: collapsed ? "center" : "flex-start",
        whiteSpace: "nowrap",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Active accent bar */}
      {isActive && (
        <div style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 3, height: 18, borderRadius: "0 3px 3px 0",
          background: S.accent,
          boxShadow: `0 0 8px ${S.accentGlow}`,
        }} />
      )}

      {/* Icon */}
      <span style={{
        color: isActive ? S.accent : hovered ? S.text : S.textMuted,
        display: "flex", alignItems: "center", flexShrink: 0,
        transition: "color 0.13s",
      }}>
        {icon}
      </span>

      {/* Label */}
      {!collapsed && (
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </span>
      )}
    </Link>
  );

  return collapsed
    ? <Tooltip label={label} S={S}>{btn}</Tooltip>
    : btn;
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, collapsed, S }: { label: string; collapsed: boolean; S: Tokens }) {
  if (collapsed) {
    return <div style={{ height: 1, background: S.border, margin: "10px 12px 8px" }} />;
  }
  return (
    <div style={{
      padding: "14px 11px 5px",
      fontSize: 10, fontWeight: 800,
      color: S.textDim,
      textTransform: "uppercase", letterSpacing: "0.12em",
    }}>
      {label}
    </div>
  );
}

// ─── Command Palette ──────────────────────────────────────────────────────────

function CommandPalette({ open, setOpen, localCommands, S }: {
  open: boolean; setOpen: (v: boolean) => void; localCommands: Command[]; S: Tokens;
}) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery]         = useState("");
  const [index, setIndex]         = useState(0);
  const [aiResults, setAiResults] = useState<Command[]>([]);
  const [loading, setLoading]     = useState(false);

  const localFiltered = useMemo(
    () => localCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase())),
    [localCommands, query]
  );
  const combined = [...localFiltered, ...aiResults];

  useEffect(() => {
    if (!open) { setQuery(""); setIndex(0); setAiResults([]); setLoading(false); }
    else setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) { setAiResults([]); setLoading(false); return; }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch("/ai/command", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (!res.ok) return;
        const data: AICommandResponse = await res.json();
        if (data.intent === "search") {
          setAiResults((data.results ?? []).map(r => ({
            label: `${r.label} (${r.type})`,
            action: () => { if (r.target) navigate(r.target); },
          })));
        } else if (data.intent === "navigate") {
          setAiResults([{ label: `Go to ${data.target}`, action: () => navigate(data.target) }]);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [open, query, navigate]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") { e.preventDefault(); setIndex(i => Math.min(i + 1, combined.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); combined[index]?.action(); setOpen(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, combined, index, setOpen]);

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(5px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 110,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520, borderRadius: 16, overflow: "hidden",
          background: S.bg,
          border: `1px solid ${S.border}`,
          boxShadow: "0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(109,79,240,0.12)",
        }}
      >
        {/* Search row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 16px", borderBottom: `1px solid ${S.border}`,
        }}>
          <span style={{ color: S.textMuted, display: "flex" }}><IconSearch /></span>
          <input
            ref={inputRef}
            placeholder="Search or jump to…"
            value={query}
            onChange={e => { setQuery(e.target.value); setIndex(0); }}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: S.text, fontSize: 15, caretColor: S.accent,
            }}
          />
          <kbd style={{
            padding: "2px 7px", borderRadius: 6, fontSize: 11, fontFamily: "monospace",
            background: S.bgHover, color: S.textMuted, border: `1px solid ${S.border}`,
          }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          {combined.length === 0 && !loading && (
            <div style={{ padding: "28px 16px", textAlign: "center", color: S.textMuted, fontSize: 13 }}>
              {query ? "No results found." : "Type to search across projects and views."}
            </div>
          )}
          {loading && (
            <div style={{ padding: "14px 16px", color: S.textMuted, fontSize: 13 }}>Searching…</div>
          )}
          {combined.map((cmd, i) => (
            <button
              key={cmd.label + i}
              onClick={() => { cmd.action(); setOpen(false); }}
              onMouseEnter={() => setIndex(i)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 16px", border: "none", textAlign: "left",
                cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: i === index ? S.bgActive : "transparent",
                color: i === index ? S.text : S.textMuted,
                transition: "background 0.1s",
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                background: i === index ? S.accent : S.border,
                transition: "background 0.1s",
              }} />
              {cmd.label}
              {cmd.hint && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: S.textDim }}>{cmd.hint}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const navigate     = useNavigate();
  const dark         = useDarkMode();
  const S            = dark ? DARK : LIGHT;
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl + K
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const localCommands: Command[] = useMemo(() => [
    { label: "All Projects",             action: () => navigate("/projects"),           hint: "Workspace" },
    { label: "Execution Timeline",       action: () => navigate("/execution"),          hint: "Execution" },
    { label: "Trends",                   action: () => navigate("/execution/trends"),   hint: "Execution" },
    { label: "Insights",                 action: () => navigate("/execution/insights"), hint: "Execution" },
    { label: "Release Readiness Center", action: () => navigate("/release"),            hint: "Release"   },
  ], [navigate]);

  const W = open ? 224 : 60;

  return (
    <>
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} localCommands={localCommands} S={S} />

      <aside style={{
        position: "fixed", left: 0, top: 0, height: "100%", zIndex: 30,
        display: "flex", flexDirection: "column",
        width: W, minWidth: W,
        background: S.bg,
        borderRight: `1px solid ${S.border}`,
        transition: "width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s cubic-bezier(.4,0,.2,1), background 0.3s ease, border-color 0.3s ease",
        overflow: "hidden",
      }}>

        {/* ── Logo / toggle ──────────────────────────────────────────────────── */}
        <div style={{
          height: 58, display: "flex", alignItems: "center",
          gap: 10,
          padding: open ? "0 14px" : "0",
          justifyContent: open ? "flex-start" : "center",
          borderBottom: `1px solid ${S.border}`,
          flexShrink: 0,
          transition: "border-color 0.3s ease",
        }}>
          <button
            onClick={() => setOpen(!open)}
            title="Toggle sidebar"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 30, height: 30, borderRadius: 8, border: "none",
              background: "transparent", cursor: "pointer", flexShrink: 0,
              padding: 0,
            }}
          >
            <LogoMark size={26} accent={S.accent} />
          </button>

          {open && (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{
                fontSize: 14, fontWeight: 800, color: S.logoText,
                letterSpacing: "0.01em", lineHeight: 1.2,
              }}>
                Qlitz
              </span>
              <span style={{
                fontSize: 10, color: S.textDim, fontWeight: 500, letterSpacing: "0.04em",
              }}>
                Quality Platform
              </span>
            </div>
          )}
        </div>

        {/* ── Nav ────────────────────────────────────────────────────────────── */}
        <nav style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: open ? "6px 8px" : "6px 6px",
          display: "flex", flexDirection: "column", gap: 1,
        }}>

          {/* WORKSPACE */}
          <div style={{ marginBottom: 2 }}>
            <SectionLabel label="Workspace" collapsed={!open} S={S} />
            <NavItem to="/projects" label="All Projects" icon={<IconProjects />} collapsed={!open} exact S={S} />
          </div>

          {/* EXECUTION */}
          <div style={{ marginBottom: 2 }}>
            <SectionLabel label="Execution" collapsed={!open} S={S} />
            <NavItem to="/execution"          label="Timeline" icon={<IconTimeline />} collapsed={!open} exact S={S} />
            <NavItem to="/execution/trends"   label="Trends"   icon={<IconTrends />}   collapsed={!open} S={S} />
            <NavItem to="/execution/insights" label="Insights" icon={<IconInsights />}  collapsed={!open} S={S} />
          </div>

          {/* RELEASE */}
          <div>
            <SectionLabel label="Release" collapsed={!open} S={S} />
            <NavItem to="/release" label="Readiness Center" icon={<IconReadiness />} collapsed={!open} exact S={S} />
          </div>

        </nav>

        {/* ── Search / Cmd+K ─────────────────────────────────────────────────── */}
        <div style={{
          padding: open ? "10px 10px 12px" : "10px 6px 12px",
          borderTop: `1px solid ${S.border}`,
          flexShrink: 0,
          transition: "border-color 0.3s ease",
        }}>
          {open ? (
            <button
              onClick={() => setPaletteOpen(true)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", borderRadius: 9,
                border: `1px solid ${S.border}`,
                background: S.searchBg,
                color: S.textMuted, fontSize: 12, fontWeight: 500,
                cursor: "pointer", textAlign: "left",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = S.accentGlow;
                (e.currentTarget as HTMLElement).style.background  = S.bgHover;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = S.border;
                (e.currentTarget as HTMLElement).style.background  = S.searchBg;
              }}
            >
              <span style={{ color: S.textDim, display: "flex" }}><IconSearch /></span>
              <span style={{ flex: 1 }}>Search…</span>
              <kbd style={{
                padding: "2px 6px", borderRadius: 5, fontSize: 10, fontFamily: "monospace",
                background: S.bgHover, color: S.textDim, border: `1px solid ${S.border}`,
              }}>⌘K</kbd>
            </button>
          ) : (
            <Tooltip label="Search  ⌘K" S={S}>
              <button
                onClick={() => setPaletteOpen(true)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "9px 0", borderRadius: 9, border: "none",
                  background: "transparent", cursor: "pointer", color: S.textMuted,
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = S.bgHover;
                  (e.currentTarget as HTMLElement).style.color = S.text;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = S.textMuted;
                }}
              >
                <IconSearch />
              </button>
            </Tooltip>
          )}
        </div>

      </aside>
    </>
  );
}
