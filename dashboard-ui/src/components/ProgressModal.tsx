import type { CSSProperties } from "react";

interface ProgressModalProps {
  open: boolean;
  percent: number;
  step: string;
}

export default function ProgressModal({ open, percent, step }: ProgressModalProps) {
  if (!open) return null;

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  };

  const modalStyle: CSSProperties = {
    background: "#1e293b",
    borderRadius: 16,
    padding: "32px 28px",
    width: 440,
    maxWidth: "90%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    gap: 20
  };

  const titleStyle: CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    color: "#f1f5f9",
    letterSpacing: "0.01em"
  };

  const stepStyle: CSSProperties = {
    fontSize: 13,
    textAlign: "center",
    color: "#94a3b8"
  };

  const barOuterStyle: CSSProperties = {
    width: "100%",
    height: 8,
    borderRadius: 999,
    background: "#334155",
    overflow: "hidden"
  };

  const barInnerStyle: CSSProperties = {
    width: `${percent}%`,
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #6366f1)",
    borderRadius: 999,
    transition: "width 0.4s ease"
  };

  const percentStyle: CSSProperties = {
    fontSize: 12,
    textAlign: "center",
    color: "#64748b"
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={titleStyle}>Generating Project</div>
        <div style={stepStyle}>{step}</div>

        <div style={barOuterStyle}>
          <div style={barInnerStyle} />
        </div>

        <div style={percentStyle}>{percent}% complete</div>
      </div>
    </div>
  );
}