export default function Spinner() {
  return (
    <div
      style={{
        width: "16px",
        height: "16px",
        border: "2px solid rgba(255,255,255,0.4)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
        marginRight: "8px"
      }}
    />
  );
}
