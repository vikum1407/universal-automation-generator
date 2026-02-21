import Sidebar from "./Sidebar";

export default function AppLayout({ children, colors }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar colors={colors} />

      <div
        style={{
          flex: 1,
          background: colors.bg,
          padding: "20px",
          overflowY: "auto"
        }}
      >
        {children}
      </div>
    </div>
  );
}
