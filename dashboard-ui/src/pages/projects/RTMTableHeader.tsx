import { theme } from "@/theme";

export default function RTMTableHeader() {
  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const headerBg = theme.mode === "dark" ? "#1F1F1F" : "#F2ECFF";

  const headers = [
    "ID",
    "Title",
    "Type",
    "Page",
    "Tags",
    "Priority",
    "Risk",
    "Actions"
  ];

  return (
    <thead>
      <tr style={{ background: headerBg }}>
        {headers.map((h, i) => (
          <th
            key={i}
            style={{
              padding: "12px",
              borderBottom: `1px solid ${border}`,
              textAlign: "left",
              color: theme.colors.primary,
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: "0.03em"
            }}
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}
