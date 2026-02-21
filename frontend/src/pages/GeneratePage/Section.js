export default function Section({ title, id, openSection, toggle, colors, children }) {
  const isOpen = openSection === id;

  return (
    <div
      style={{
        marginBottom: "20px",
        borderRadius: "8px",
        border: `1px solid ${colors.border}`,
        background: colors.card,
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        overflow: "hidden",
        transition: "all 0.3s ease"
      }}
    >
      <div
        onClick={() => toggle(id)}
        style={{
          padding: "14px 18px",
          background: colors.header,
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "15px",
          color: colors.text,
          borderBottom: isOpen ? `1px solid ${colors.border}` : "none",
          userSelect: "none"
        }}
      >
        {title}
      </div>

      <div
        style={{
          maxHeight: isOpen ? "1000px" : "0px",
          opacity: isOpen ? 1 : 0,
          padding: isOpen ? "18px" : "0px 18px",
          background: colors.card,
          color: colors.text,
          overflow: "hidden",
          transition: "all 0.35s ease"
        }}
      >
        {children}
      </div>
    </div>
  );
}
