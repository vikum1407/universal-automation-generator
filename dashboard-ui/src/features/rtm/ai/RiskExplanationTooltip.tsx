import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import type { AIRiskScore } from "@/api/rtm";

interface Props {
  score:   AIRiskScore;
  trigger?: React.ReactNode;
}

const RISK_COLOR: Record<string, string> = { high: "#EF4444", medium: "#FFA726", low: "#4CAF50" };

export function RiskExplanationTooltip({ score, trigger }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted } = useColors();
  const [open, setOpen] = useState(false);

  const color = RISK_COLOR[score.risk] ?? "#9E9E9E";
  const pct   = Math.round(score.score * 100);

  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{ cursor: "pointer" }}
      >
        {trigger ?? (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
            background: `${color}18`, color, border: `1px solid ${color}44`,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            ✦ {score.risk} {pct}
          </span>
        )}
      </span>

      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: surface, border: `1px solid ${border}`, borderRadius: 10,
          padding: "12px 14px", width: 260, zIndex: 200,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          pointerEvents: "none",
        }}>
          {/* Risk level + score bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 6,
              background: `${color}18`, color, border: `1px solid ${color}44`,
              textTransform: "capitalize",
            }}>
              {score.risk} risk
            </span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: `${color}22`, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28 }}>{pct}</span>
          </div>

          {/* Explanation */}
          <div style={{ fontSize: 11, color: text, lineHeight: 1.6 }}>
            {score.explanation}
          </div>

          <div style={{ fontSize: 10, color: muted, marginTop: 8, fontStyle: "italic" }}>
            AI-assessed risk · may differ from manual rating
          </div>

          {/* Arrow */}
          <div style={{
            position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
            width: 10, height: 10, background: surface,
            border: `1px solid ${border}`, borderTop: "none", borderLeft: "none",
            rotate: "45deg",
          }} />
        </div>
      )}
    </span>
  );
}
