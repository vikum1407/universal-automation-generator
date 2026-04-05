export default function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    ready: "#2FF7D1",
    initializing: "#FFD93D",
    failed: "#FF4F4F",
  };

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "8px",
        background: colors[status] || "#ccc",
        color: "#000",
        fontWeight: 600,
        fontSize: "12px",
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}
