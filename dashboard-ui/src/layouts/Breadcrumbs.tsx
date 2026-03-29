import { Link, useLocation } from "react-router-dom";

const CRUMB_MAP: Record<string, { label: string; icon: string }> = {
  journeys: { label: "Journeys", icon: "📁" },
  execution: { label: "Execution", icon: "⏱️" },
  trends: { label: "Trends", icon: "📈" },
  insights: { label: "Insights", icon: "💡" },
  compare: { label: "Compare", icon: "🆚" },
  release: { label: "Release", icon: "🚦" },
  heatmap: { label: "Heatmap", icon: "🔥" },
  story: { label: "Story", icon: "📘" },
  requirements: { label: "Requirements", icon: "📋" },
  "self-healing": { label: "Self‑Healing", icon: "🛠️" }
};

function formatCrumb(seg: string) {
  if (/^REQ/i.test(seg)) return { label: `Requirement ${seg}`, icon: "📄" };
  if (/^\d+$/.test(seg)) return { label: `Run ${seg}`, icon: "🔎" };
  return (
    CRUMB_MAP[seg] || {
      label: seg.charAt(0).toUpperCase() + seg.slice(1),
      icon: "📁"
    }
  );
}

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
      <Link to="/" className="flex items-center gap-1 hover:text-neutral-dark">
        <span className="text-base">🏠</span>
        <span className="font-medium">Qlitz</span>
      </Link>

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
