import { useState, useRef, useEffect } from "react";
import { theme } from "@/theme";

export default function Tooltip({
  text,
  children
}: {
  text: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (show && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
    }
  }, [show]);

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {show && (
        <div
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            transform: "translateX(-50%)",
            background: theme.mode === "dark" ? theme.colors.darkSurface : "#fff",
            color: theme.colors.text,
            padding: "8px 12px",
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadow.card,
            whiteSpace: "nowrap",
            zIndex: 9999,
            fontSize: 12,
            animation: "fadeIn 0.15s ease"
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
