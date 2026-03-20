import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { href: "/release", label: "Overview" },
    { href: "/release/sync", label: "Sync" },
    { href: "/release/evolution", label: "Evolution" },
  ];

  return (
    <div className="w-56 bg-white border-r p-4 space-y-2">
      {links.map((l) => (
        <Link key={l.href} to={l.href}>
          <div
            className={`p-2 rounded cursor-pointer ${
              location.pathname === l.href ? "bg-blue-100" : "hover:bg-gray-100"
            }`}
          >
            {l.label}
          </div>
        </Link>
      ))}
    </div>
  );
}
