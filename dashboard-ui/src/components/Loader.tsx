export default function Loader() {
  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          border: "4px solid #E0D4FF",
          borderTop: "4px solid #7B2FF7",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }}
      />

      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `}
      </style>
    </div>
  );
}
