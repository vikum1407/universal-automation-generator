import { Link, useLocation } from "react-router-dom";

/* ---------------------------------------------
   Static mapping for known route segments
--------------------------------------------- */
const CRUMB_MAP: Record<string, { label: string; icon: string }> = {
  // Core sections
  projects: { label: "Projects", icon: "📁" },
  journeys: { label: "Journeys", icon: "🧭" },
  execution: { label: "Execution", icon: "⏱️" },
  release: { label: "Release", icon: "🚦" },

  // Project creation wizard
  new: { label: "New Project", icon: "✨" },
  ui: { label: "UI Project", icon: "🖥️" },
  api: { label: "API Project", icon: "🔌" },
  summary: { label: "Summary", icon: "📄" },
  initializing: { label: "Initializing", icon: "⚙️" },

  // Execution subpages
  trends: { label: "Trends", icon: "📈" },
  insights: { label: "Insights", icon: "💡" },
  compare: { label: "Compare", icon: "🆚" },

  // Release subpages
  heatmap: { label: "Heatmap", icon: "🔥" },
  story: { label: "Story", icon: "📘" },
  requirements: { label: "Requirements", icon: "📋" },
  "self-healing": { label: "Self‑Healing", icon: "🛠️" },

  // Test intelligence
  test: { label: "Test", icon: "🧪" },
  diff: { label: "Diff", icon: "🔍" },
  flow: { label: "Flow", icon: "🔀" },
  selectors: { label: "Selectors", icon: "🎯" }
};

/* ---------------------------------------------
   Dynamic segment formatter
--------------------------------------------- */
function formatCrumb(seg: string) {
  // Requirement IDs (REQ-123)
  if (/^REQ/i.test(seg)) return { label: seg, icon: "📄" };

  // Numeric execution run IDs
  if (/^\d+$/.test(seg)) return { label: `Run ${seg}`, icon: "🔎" };

  // Project IDs (UUIDs or slugs)
  if (seg.length > 12 && seg.includes("-")) {
    return { label: "Project", icon: "📊" };
  }

  // Test IDs (T-123)
  if (/^T-/i.test(seg)) return { label: seg, icon: "🧪" };

  // Fallback to static map
  return (
    CRUMB_MAP[seg] || {
      label: seg.charAt(0).toUpperCase() + seg.slice(1),
      icon: "📁"
    }
  );
}

/* ---------------------------------------------
   Breadcrumb Component
--------------------------------------------- */
export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const { label, icon } = formatCrumb(seg);
    return { label, icon, path };
  });

  return (
    <nav className="flex items-center gap-2 text-sm text-neutral-mid">
      {/* Home */}
      <Link to="/" className="flex items-center gap-1 hover:text-neutral-dark">
        <span className="text-base">🏠</span>
        <span className="font-medium">Qlitz</span>
      </Link>

      {/* Dynamic crumbs */}
      {crumbs.map((crumb, i) => (
        <div key={crumb.path} className="flex items-center gap-2">
          <span className="text-neutral-light">/</span>

          {i === crumbs.length - 1 ? (
            <span className="flex items-center gap-1 font-semibold text-neutral-dark">
              <span>{crumb.icon}</span>
              <span>{crumb.label}</span>
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="flex items-center gap-1 hover:text-neutral-dark"
            >
              <span>{crumb.icon}</span>
              <span>{crumb.label}</span>
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
