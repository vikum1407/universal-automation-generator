import { useColors } from "@/hooks/useColors";
import type { RTMInsights as RTMInsightsType, RTMRequirement } from "@/api/rtm";

const RISK_COLOR: Record<string, string> = {
  critical: "#EF5350", high: "#FF7043", medium: "#FFA726", low: "#66BB6A",
};
const TYPE_COLOR: Record<string, string> = {
  api: "#448AFF", ui: "#9C27B0", hybrid: "#FF7043",
  performance: "#00BCD4", security: "#EF5350", business: "#66BB6A",
};

function InsightCard({
  icon, title, count, color, children,
}: {
  icon: string; title: string; count: number; color: string;
  children: React.ReactNode;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();

  return (
    <div style={{
      padding: "16px 18px", borderRadius: 14,
      background: surface, border: `1px solid ${border}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: text }}>
            {title}
          </div>
        </div>
        <span style={{
          padding: "2px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700,
          background: count > 0 ? `${color}22` : "#00C85322",
          color: count > 0 ? color : "#00C853"
        }}>{count}</span>
      </div>
      {count === 0
        ? <div style={{ fontSize: 12, color: textLight }}>None found — all clear!</div>
        : children
      }
    </div>
  );
}

function ReqChip({ req, onSelect }: { req: RTMRequirement; onSelect: () => void }) {
  const { BDR: border, TXT: text, TXT2: textLight, dark } = useColors();

  return (
    <div
      onClick={onSelect}
      style={{
        padding: "8px 12px", borderRadius: 8, cursor: "pointer",
        border: `1px solid ${border}`, marginBottom: 6,
        display: "flex", alignItems: "center", gap: 8,
        transition: "background 0.12s ease"
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = dark ? "#2A1A40" : "#EDE4FF";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      <span style={{
        padding: "1px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700,
        background: `${TYPE_COLOR[req.type] ?? "#888"}22`,
        color: TYPE_COLOR[req.type] ?? "#888"
      }}>{req.type.toUpperCase()}</span>
      <span style={{ flex: 1, fontSize: 12, color: text, fontWeight: 500 }}>{req.title}</span>
      {req.riskLevel !== "low" && (
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: RISK_COLOR[req.riskLevel] ?? "#FFA726"
        }}>⚠ {req.riskLevel}</span>
      )}
      <span style={{ fontSize: 10, color: textLight }}>→</span>
    </div>
  );
}

export default function RTMInsights({
  insights,
  onSelectReq,
}: {
  insights: RTMInsightsType;
  onSelectReq: (req: RTMRequirement) => void;
}) {
  const { TXT: text, TXT2: textLight, BDR: border } = useColors();

  const totalIssues = insights.highRiskUncovered.length +
    insights.duplicateSuspects.length +
    insights.needsRewrite.length;

  if (!totalIssues) {
    return (
      <div style={{
        marginTop: 24, textAlign: "center", padding: "32px 0",
        color: textLight
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#00C853" }}>All clear!</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>No AI insights found — RTM is healthy.</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: text }}>
          AI Insights
        </div>
        <div style={{ fontSize: 12, color: textLight, marginTop: 3 }}>
          {totalIssues} issue{totalIssues !== 1 ? "s" : ""} detected — click any item to view details
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>

        {/* High-risk uncovered */}
        <InsightCard
          icon="🔴"
          title="High-Risk Uncovered Requirements"
          count={insights.highRiskUncovered.length}
          color="#EF5350"
        >
          {insights.highRiskUncovered.slice(0, 5).map(r => (
            <ReqChip key={r.id} req={r} onSelect={() => onSelectReq(r)} />
          ))}
          {insights.highRiskUncovered.length > 5 && (
            <div style={{ fontSize: 11, color: textLight, marginTop: 4 }}>
              +{insights.highRiskUncovered.length - 5} more
            </div>
          )}
        </InsightCard>

        {/* Duplicate suspects */}
        <InsightCard
          icon="🔁"
          title="Possible Duplicate Requirements"
          count={insights.duplicateSuspects.length}
          color="#FFA726"
        >
          {insights.duplicateSuspects.slice(0, 4).map((d, i) => (
            <div key={i} style={{
              padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${border}`, marginBottom: 6
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "#FFA726", fontWeight: 700 }}>
                  {d.similarity}% similar
                </span>
              </div>
              <div style={{ fontSize: 11, color: text, marginBottom: 2 }}>{d.titles[0]}</div>
              <div style={{ fontSize: 11, color: textLight }}>{d.titles[1]}</div>
            </div>
          ))}
        </InsightCard>

        {/* Needs rewrite */}
        <InsightCard
          icon="✍️"
          title="Requirements Needing Better Description"
          count={insights.needsRewrite.length}
          color="#9C27B0"
        >
          {insights.needsRewrite.slice(0, 5).map(r => (
            <ReqChip key={r.id} req={r} onSelect={() => onSelectReq(r)} />
          ))}
          {insights.needsRewrite.length > 5 && (
            <div style={{ fontSize: 11, color: textLight, marginTop: 4 }}>
              +{insights.needsRewrite.length - 5} more
            </div>
          )}
        </InsightCard>

        {/* Failing tests */}
        <InsightCard
          icon="❌"
          title="Requirements with Failing Tests"
          count={insights.withFailingTests.length}
          color="#EF5350"
        >
          {insights.withFailingTests.slice(0, 5).map(r => (
            <ReqChip key={r.id} req={r} onSelect={() => onSelectReq(r)} />
          ))}
        </InsightCard>

        {/* Flaky tests */}
        <InsightCard
          icon="⚡"
          title="Requirements with Flaky Tests"
          count={insights.withFlakyTests.length}
          color="#FFA726"
        >
          {insights.withFlakyTests.slice(0, 5).map(r => (
            <ReqChip key={r.id} req={r} onSelect={() => onSelectReq(r)} />
          ))}
        </InsightCard>

      </div>
    </div>
  );
}
