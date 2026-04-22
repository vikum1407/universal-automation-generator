import { useEffect } from "react";
import { useProjectProgress } from "@/hooks/useProjectProgress";

export default function ProjectProgressModal() {
  const { isOpen, percent, step, closeProgress } = useProjectProgress();

  useEffect(() => {
    if (percent >= 100) {
      const t = setTimeout(() => closeProgress(), 800);
      return () => clearTimeout(t);
    }
  }, [percent, closeProgress]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 24,
          width: 420,
          maxWidth: "90%",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center" }}>
          {step}
        </div>

        <div
          style={{
            width: "100%",
            height: 10,
            borderRadius: 999,
            background: "#eee",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background: "#2563eb",
              transition: "width 0.3s ease"
            }}
          />
        </div>

        <div
          style={{
            fontSize: 13,
            textAlign: "center",
            color: "#555"
          }}
        >
          {percent}% complete
        </div>
      </div>
    </div>
  );
}
