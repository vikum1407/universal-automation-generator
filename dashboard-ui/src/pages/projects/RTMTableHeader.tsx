import { useColors } from "@/hooks/useColors";

const COLS = [
  { label: "ID", width: 110 },
  { label: "Title / Description", width: "auto" },
  { label: "Type", width: 80 },
  { label: "Priority", width: 90 },
  { label: "Risk", width: 80 },
  { label: "Coverage", width: 110 },
  { label: "AI Conf.", width: 80 },
  { label: "Actions", width: 120 },
];

export default function RTMTableHeader() {
  const { BDR: border, P, dark } = useColors();
  const headerBg = dark ? "#1A1A2E" : "#F5EEFF";

  return (
    <thead>
      <tr style={{ background: headerBg }}>
        {COLS.map((col, i) => (
          <th
            key={i}
            style={{
              padding: "11px 12px",
              borderBottom: `1px solid ${border}`,
              textAlign: "left",
              color: P,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              width: typeof col.width === "number" ? col.width : undefined,
            }}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
