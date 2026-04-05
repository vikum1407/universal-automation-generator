export default function SkeletonCard({ height = 80 }: { height?: number }) {
  return (
    <div
      style={{
        background: "#F0E8FF",
        borderRadius: "12px",
        height,
        animation: "pulse 1.5s ease-in-out infinite"
      }}
    >
      <style>
        {`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        `}
      </style>
    </div>
  );
}
