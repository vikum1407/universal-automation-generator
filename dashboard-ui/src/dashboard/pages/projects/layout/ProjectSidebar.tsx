import { theme } from "../../../../theme";
import { useColors } from "@/hooks/useColors";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabId =
  | "overview"
  | "flows"
  | "rtm"
  | "rtm-requirements"
  | "rtm-journeys"
  | "rtm-endpoints"
  | "rtm-coverage"
  | "rtm-gaps"
  | "rtm-closure"
  | "coverage"
  | "insights"
  | "readiness"
  | "heatmap"
  | "forecast"
  | "suggestions"
  | "tests"
  | "test-data"
  | "autoheal"
  | "replay"
  | "history"
  | "story"
  | "releases"
  | "budgets"
  | "workflow"
  | "graph"
  | "framework"
  | "settings";

// ─── Tab groups ───────────────────────────────────────────────────────────────

interface TabDef { id: TabId; label: string; icon: React.ReactNode; }

const GROUPS: { label: string; tabs: TabDef[] }[] = [
  {
    label: "Analyze",
    tabs: [
      { id: "overview",     label: "Overview",         icon: <IconGrid /> },
      { id: "flows",        label: "Flows & Endpoints", icon: <IconNetwork /> },
      // RTM sub-tabs rendered separately (see RTM_GROUP below)
      { id: "coverage",     label: "Coverage",         icon: <IconCoverage /> },
      { id: "insights",     label: "Insights",         icon: <IconInsight /> },
      { id: "readiness",    label: "Readiness",        icon: <IconReadiness /> },
      { id: "heatmap",      label: "HeatMap",          icon: <IconHeatMap /> },
      { id: "graph",        label: "Knowledge Graph",  icon: <IconGraph /> },
    ],
  },
  {
    label: "Improve",
    tabs: [
      { id: "framework",    label: "Framework",        icon: <IconFramework /> },
      { id: "suggestions",  label: "Suggestions",      icon: <IconBulb /> },
      { id: "tests",        label: "Tests",            icon: <IconPlay /> },
      { id: "test-data",    label: "Test Data",        icon: <IconTestData /> },
      { id: "autoheal",     label: "Auto‑Heal",        icon: <IconHeal /> },
      { id: "replay",       label: "Replay",           icon: <IconReplay /> },
    ],
  },
  {
    label: "Monitor",
    tabs: [
      { id: "history",      label: "History",          icon: <IconHistory /> },
      { id: "story",        label: "Story",            icon: <IconStory /> },
      { id: "workflow",     label: "Dev Workflow",     icon: <IconWorkflow /> },
    ],
  },
  {
    label: "Predict",
    tabs: [
      { id: "forecast",     label: "Forecast",         icon: <IconTrend /> },
    ],
  },
  {
    label: "Release",
    tabs: [
      { id: "releases",     label: "Releases",         icon: <IconRelease /> },
    ],
  },
  {
    label: "Configure",
    tabs: [
      { id: "budgets",      label: "Quality Budgets",  icon: <IconBudget /> },
      { id: "settings",     label: "Settings",         icon: <IconSettings /> },
    ],
  },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function Svg({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  );
}

function IconGraph() {
  return <Svg><circle cx="8" cy="2.5" r="1.8" stroke="currentColor" strokeWidth="1.3" fill="none"/><circle cx="2.5" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.3" fill="none"/><circle cx="13.5" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.3" fill="none"/><circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M8 4.3V6.2M6.5 9.2l-2.6 2.1M9.5 9.2l2.6 2.1M4.3 8H6.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></Svg>;
}

function IconHeatMap() {
  return <Svg><rect x="1" y="1" width="4" height="4" rx="1" fill="currentColor" opacity=".4"/><rect x="6" y="1" width="4" height="4" rx="1" fill="currentColor" opacity=".7"/><rect x="11" y="1" width="4" height="4" rx="1" fill="currentColor"/><rect x="1" y="6" width="4" height="4" rx="1" fill="currentColor" opacity=".7"/><rect x="6" y="6" width="4" height="4" rx="1" fill="currentColor" opacity=".9"/><rect x="11" y="6" width="4" height="4" rx="1" fill="currentColor" opacity=".5"/><rect x="1" y="11" width="4" height="4" rx="1" fill="currentColor"/><rect x="6" y="11" width="4" height="4" rx="1" fill="currentColor" opacity=".6"/><rect x="11" y="11" width="4" height="4" rx="1" fill="currentColor" opacity=".3"/></Svg>;
}

function IconReadiness() {
  return <Svg><path d="M8 2L2 5v4c0 3.3 2.5 5.8 6 6.5 3.5-.7 6-3.2 6-6.5V5L8 2z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/><path d="M5.5 8.5l1.8 1.8L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

function IconInsight() {
  return <Svg><circle cx="8" cy="7" r="4" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M6 11.5h4M7 13h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M6.5 7.5L7.5 6l1 1.5L9.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

function IconGrid() {
  return <Svg><rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity=".9"/><rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity=".9"/><rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity=".9"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity=".9"/></Svg>;
}

function IconNetwork() {
  return <Svg><circle cx="8" cy="3" r="2" fill="currentColor"/><circle cx="3" cy="13" r="2" fill="currentColor"/><circle cx="13" cy="13" r="2" fill="currentColor"/><path d="M8 5L3 11M8 5L13 11M3 11v.1M13 11v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></Svg>;
}

function IconList() {
  return <Svg><rect x="1" y="3" width="14" height="2" rx="1" fill="currentColor"/><rect x="1" y="7" width="10" height="2" rx="1" fill="currentColor"/><rect x="1" y="11" width="12" height="2" rx="1" fill="currentColor"/></Svg>;
}

function IconCoverage() {
  return <Svg><path d="M2 14 L2 6 L6 6 L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 14 L6 3 L10 3 L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 14 L10 8 L14 8 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></Svg>;
}

function IconBulb() {
  return <Svg><path d="M8 2C5.8 2 4 3.8 4 6c0 1.6.9 3 2.2 3.7V11h3.6V9.7C11.1 9 12 7.6 12 6c0-2.2-1.8-4-4-4z" fill="currentColor" opacity=".85"/><rect x="5.5" y="12" width="5" height="1.5" rx=".75" fill="currentColor"/></Svg>;
}

function IconPlay() {
  return <Svg><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 5.5l5 2.5-5 2.5V5.5z" fill="currentColor"/></Svg>;
}

function IconHeal() {
  return <Svg><path d="M6 2h4v4h4v4h-4v4H6v-4H2V6h4V2z" fill="currentColor" opacity=".85"/></Svg>;
}

function IconReplay() {
  return <Svg><path d="M3.5 8A4.5 4.5 0 108 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 1.5L5.5 4 8 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

function IconFramework() {
  return <Svg><rect x="1" y="2" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/><rect x="9" y="2" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/><rect x="1" y="9" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M12 7v2M12 9h-3M12 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="1.5" fill="currentColor" opacity=".7"/></Svg>;
}

function IconWorkflow() {
  return <Svg><circle cx="4" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="4" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M4 5.8v4.4M5.8 4h1.7a2.5 2.5 0 012.5 2.5V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></Svg>;
}

function IconTestData() {
  return <Svg><ellipse cx="8" cy="4" rx="5" ry="1.8" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M3 4v3c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V4" stroke="currentColor" strokeWidth="1.3"/><path d="M3 7v3c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V7" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 13.5l1.5-1.5-1.5-1.5M12 12H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

function IconHistory() {
  return <Svg><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

function IconStory() {
  return <Svg><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></Svg>;
}

function IconTrend() {
  return <Svg><polyline points="2,12 5,8 8,10 11,5 14,7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="14" cy="7" r="1.5" fill="currentColor"/></Svg>;
}

function IconRelease() {
  return <Svg><path d="M8 2L2 5.5v5L8 14l6-3.5v-5L8 2z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/><circle cx="8" cy="8" r="2" fill="currentColor" opacity=".85"/></Svg>;
}

function IconSettings() {
  return <Svg><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.3 3.3l.85.85M11.85 11.85l.85.85M3.3 12.7l.85-.85M11.85 4.15l.85-.85" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></Svg>;
}

function IconBudget() {
  return <Svg><rect x="1" y="10" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/><rect x="1" y="6" width="9" height="3" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/><rect x="1" y="2" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/><line x1="12" y1="3.5" x2="12" y2="8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="10" y1="5.5" x2="14" y2="5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></Svg>;
}

function IconChevronLeft() {
  return <Svg size={14}><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>;
}

function IconChevronRight() {
  return <Svg size={14}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>;
}

function IconJourney() {
  return <Svg><path d="M2 8h3l2-4 2 8 2-4h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></Svg>;
}

function IconEndpoint() {
  return <Svg><rect x="1" y="4" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M5 8h6M9 6l2 2-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

function IconGap() {
  return <Svg><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="8" r="1" fill="currentColor" opacity=".4"/></Svg>;
}

function IconClosure() {
  return <Svg><path d="M3.5 8A4.5 4.5 0 008 12.5 4.5 4.5 0 0012.5 8 4.5 4.5 0 008 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M5.5 6L8 3.5 10.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 8.5l1.5 1.5L11 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

// ─── RTM sub-group ────────────────────────────────────────────────────────────

const RTM_GROUP: TabDef[] = [
  { id: "rtm-requirements", label: "Requirements", icon: <IconList /> },
  { id: "rtm-journeys",     label: "Journeys",     icon: <IconJourney /> },
  { id: "rtm-endpoints",    label: "Endpoints",    icon: <IconEndpoint /> },
  { id: "rtm-coverage",     label: "Coverage",     icon: <IconCoverage /> },
  { id: "rtm-gaps",         label: "Gaps",         icon: <IconGap /> },
  { id: "rtm-closure",      label: "Closure Jobs", icon: <IconClosure /> },
];

function isRtmTab(id: TabId): boolean {
  return id === "rtm" || id.startsWith("rtm-");
}

// ─── Tooltip (collapsed mode) ─────────────────────────────────────────────────

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: "absolute", left: "calc(100% + 10px)", top: "50%",
          transform: "translateY(-50%)", zIndex: 100,
          background: "#1a1a2e", color: "#fff", padding: "5px 10px",
          borderRadius: 6, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
          pointerEvents: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        }}>
          {label}
          <div style={{
            position: "absolute", right: "100%", top: "50%",
            transform: "translateY(-50%)", width: 0, height: 0,
            borderTop: "5px solid transparent", borderBottom: "5px solid transparent",
            borderRight: "6px solid #1a1a2e",
          }} />
        </div>
      )}
    </div>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  ui:     "#7B2FF7",
  api:    "#448AFF",
  hybrid: "#FF9800",
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function ProjectSidebar({
  project,
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}: {
  project: any;
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const { P, BDR, CARD: BG, TXT, TXT2 } = useColors();
  const APP_BG = BG;
  const rtmActive = isRtmTab(activeTab);
  const [rtmOpen, setRtmOpen] = useState(rtmActive);

  const projectName: string = project.name || project.title || (
    project.type === "ui" ? "UI Project" : "API Project"
  );
  const projectType: string = project.type ?? "ui";
  const typeColor = TYPE_COLOR[projectType] ?? P;

  return (
    <div style={{
      width: collapsed ? 64 : 224,
      minWidth: collapsed ? 64 : 224,
      transition: "width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s cubic-bezier(.4,0,.2,1)",
      background: BG,
      borderRight: `1px solid ${BDR}`,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
      zIndex: 5,
      flexShrink: 0,
    }}>

      {/* ── Project header ─────────────────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? "16px 0" : "18px 16px 14px",
        borderBottom: `1px solid ${BDR}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 72,
        boxSizing: "border-box",
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        {/* Avatar / type icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${typeColor}18`,
          border: `1.5px solid ${typeColor}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          color: typeColor, fontSize: 12, fontWeight: 800, letterSpacing: "0.04em",
        }}>
          {projectType.toUpperCase().slice(0, 2)}
        </div>

        {!collapsed && (
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: TXT,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}>
              {projectName}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 6px",
                borderRadius: 4, letterSpacing: "0.06em",
                background: `${typeColor}18`, color: typeColor,
              }}>
                {projectType.toUpperCase()}
              </span>
              {project.status && project.status !== "ready" && (
                <span style={{ fontSize: 10, color: TXT2, fontStyle: "italic" }}>
                  {project.status}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: collapsed ? "10px 8px" : "10px 10px",
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        {GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginTop: gi > 0 ? 10 : 0 }}>

            {/* Group label */}
            {!collapsed && (
              <div style={{
                fontSize: 10, fontWeight: 700, color: TXT2,
                textTransform: "uppercase", letterSpacing: "0.1em",
                padding: "4px 8px 6px", opacity: 0.7,
              }}>
                {group.label}
              </div>
            )}
            {collapsed && gi > 0 && (
              <div style={{ height: 1, background: BDR, margin: "6px 4px 8px" }} />
            )}

            {/* Tab buttons */}
            {group.tabs.filter(t => t.id !== "rtm").map(tab => {
              const active = tab.id === activeTab;
              const btn = (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={collapsed ? tab.label : undefined}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: collapsed ? "9px 0" : "9px 10px",
                    borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    transition: "background 0.15s, color 0.15s",
                    background: active ? `${P}14` : "transparent",
                    color: active ? P : TXT2,
                    position: "relative", whiteSpace: "nowrap",
                    overflow: "hidden", textAlign: "left",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = `${P}09`; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {active && (
                    <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: "0 3px 3px 0", background: P }} />
                  )}
                  <span style={{ color: active ? P : TXT2, display: "flex", alignItems: "center", transition: "color 0.15s" }}>
                    {tab.icon}
                  </span>
                  {!collapsed && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                      {tab.label}
                    </span>
                  )}
                </button>
              );
              return collapsed ? <Tip key={tab.id} label={tab.label}>{btn}</Tip> : btn;
            })}

            {/* ── RTM expandable section (injected into Analyze group) ── */}
            {group.label === "Analyze" && (() => {
              const showSubs = rtmOpen || rtmActive;
              const parentBtn = (
                <button
                  onClick={() => {
                    if (rtmActive) {
                      setRtmOpen(v => !v);
                    } else {
                      setRtmOpen(true);
                      setActiveTab("rtm-requirements");
                    }
                  }}
                  title={collapsed ? "RTM" : undefined}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: collapsed ? "9px 0" : "9px 10px",
                    borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: rtmActive ? 600 : 400,
                    background: rtmActive ? `${P}14` : "transparent",
                    color: rtmActive ? P : TXT2,
                    position: "relative", whiteSpace: "nowrap", overflow: "hidden", textAlign: "left",
                  }}
                  onMouseEnter={e => { if (!rtmActive) (e.currentTarget as HTMLElement).style.background = `${P}09`; }}
                  onMouseLeave={e => { if (!rtmActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {rtmActive && (
                    <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: "0 3px 3px 0", background: P }} />
                  )}
                  <span style={{ color: rtmActive ? P : TXT2, display: "flex", alignItems: "center" }}>
                    <IconList />
                  </span>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1 }}>RTM</span>
                      <span style={{ fontSize: 9, opacity: 0.6 }}>{showSubs ? "▾" : "▸"}</span>
                    </>
                  )}
                </button>
              );

              return (
                <div key="rtm-section">
                  {collapsed ? <Tip label="RTM">{parentBtn}</Tip> : parentBtn}

                  {/* Sub-tabs — expanded sidebar */}
                  {showSubs && !collapsed && (
                    <div style={{ paddingLeft: 10, display: "flex", flexDirection: "column", gap: 1, marginTop: 1 }}>
                      {RTM_GROUP.map(tab => {
                        const active = tab.id === activeTab;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 8,
                              padding: "7px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                              fontSize: 12, fontWeight: active ? 600 : 400,
                              background: active ? `${P}14` : "transparent",
                              color: active ? P : TXT2, position: "relative",
                            }}
                            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = `${P}09`; }}
                            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            {active && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2, borderRadius: "0 2px 2px 0", background: P }} />}
                            <span style={{ color: active ? P : TXT2, display: "flex", alignItems: "center" }}>{tab.icon}</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Sub-tabs — collapsed sidebar (icons only) */}
                  {showSubs && collapsed && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 1 }}>
                      {RTM_GROUP.map(tab => {
                        const active = tab.id === activeTab;
                        return (
                          <Tip key={tab.id} label={tab.label}>
                            <button
                              onClick={() => setActiveTab(tab.id)}
                              style={{
                                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                                padding: "7px 0", borderRadius: 7, border: "none", cursor: "pointer",
                                background: active ? `${P}14` : "transparent",
                                color: active ? P : TXT2,
                              }}
                            >
                              <span style={{ color: active ? P : TXT2, display: "flex" }}>{tab.icon}</span>
                            </button>
                          </Tip>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
      </nav>

      {/* ── Collapse toggle ─────────────────────────────────────────────────── */}
      <div style={{ padding: "10px 8px", borderTop: `1px solid ${BDR}` }}>
        {collapsed
          ? <Tip label="Expand sidebar">
              <button onClick={() => setCollapsed(false)} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                padding: "8px 0", border: "none", borderRadius: 8, background: "transparent",
                cursor: "pointer", color: TXT2,
              }}>
                <IconChevronRight />
              </button>
            </Tip>
          : <button onClick={() => setCollapsed(true)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end",
              gap: 6, padding: "7px 8px", border: "none", borderRadius: 8, background: "transparent",
              cursor: "pointer", color: TXT2, fontSize: 12, fontWeight: 500,
            }}>
              <IconChevronLeft />
              Collapse
            </button>
        }
      </div>
    </div>
  );
}
