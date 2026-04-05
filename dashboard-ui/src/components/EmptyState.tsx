export default function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "12px",
        background: "#F8F4FF",
        border: "1px solid #E5DAFF",
        textAlign: "center",
        color: "#7B2FF7",
        marginTop: "16px",
        fontSize: "14px",
        fontWeight: 500
      }}
    >
      {message}
    </div>
  );
}
