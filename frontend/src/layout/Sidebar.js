import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ colors }) {
  const location = useLocation();

  const linkStyle = (path) => ({
    padding: "12px 16px",
    display: "block",
    color: colors.text,
    textDecoration: "none",
    background: location.pathname === path ? colors.header : "transparent",
    borderRadius: "6px",
    marginBottom: "6px",
    transition: "0.2s"
  });

  return (
    <div
      style={{
        width: "220px",
        background: colors.card,
        padding: "20px",
        borderRight: `1px solid ${colors.border}`,
        minHeight: "100vh",
        boxSizing: "border-box"
      }}
    >
      <h3 style={{ color: colors.text, marginBottom: "20px" }}>
        Framework Generator
      </h3>

      <Link to="/generate" style={linkStyle("/generate")}>
        Generate
      </Link>

      <Link to="/config-manager" style={linkStyle("/config-manager")}>
        Configurations
      </Link>

      {/* Future pages */}
      {/* <Link to="/templates" style={linkStyle("/templates")}>Templates</Link> */}
    </div>
  );
}
