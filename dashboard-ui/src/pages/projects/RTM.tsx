import { useEffect, useState } from "react";
import { theme } from "@/theme";
import { fetchRTM } from "@/api/rtm";
import type { RTMRequirementView, RTMResponse } from "@/api/rtm";

interface RTMProps {
  projectId: string;
}

type Filter = "all" | "covered" | "not-covered";

export default function RTM({ projectId }: RTMProps) {
  const [data, setData] = useState<RTMResponse | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchRTM(projectId)
      .then(res => {
        if (mounted) setData(res);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [projectId]);

  const filteredRequirements =
    data?.requirements.filter(r => {
      if (filter === "all") return true;
      if (filter === "covered") return r.coverageStatus === "covered";
      if (filter === "not-covered") return r.coverageStatus === "not-covered";
      return true;
    }) || [];

  return (
    <div style={{ padding: theme.spacing.lg }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: theme.spacing.lg
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: theme.colors.primary }}>
            Requirements Traceability Matrix
          </h2>

          {data && (
            <p style={{ margin: 0, color: theme.colors.textDark }}>
              {data.summary.coveredRequirements}/{data.summary.totalRequirements} requirements
              covered ({data.summary.coveragePercent}%)
            </p>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: theme.spacing.sm }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "6px 10px",
              borderRadius: theme.radii.sm,
              border: "1px solid " + theme.colors.border,
              background: filter === "all" ? theme.colors.secondary : "transparent",
              color: filter === "all" ? "#fff" : theme.colors.textDark,
              cursor: "pointer"
            }}
          >
            All
          </button>

          <button
            onClick={() => setFilter("covered")}
            style={{
              padding: "6px 10px",
              borderRadius: theme.radii.sm,
              border: "1px solid " + theme.colors.border,
              background: filter === "covered" ? theme.colors.secondary : "transparent",
              color: filter === "covered" ? "#fff" : theme.colors.textDark,
              cursor: "pointer"
            }}
          >
            Covered
          </button>

          <button
            onClick={() => setFilter("not-covered")}
            style={{
              padding: "6px 10px",
              borderRadius: theme.radii.sm,
              border: "1px solid " + theme.colors.border,
              background: filter === "not-covered" ? theme.colors.secondary : "transparent",
              color: filter === "not-covered" ? "#fff" : theme.colors.textDark,
              cursor: "pointer"
            }}
          >
            Not Covered
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <div>Loading RTM…</div>}

      {/* Empty */}
      {!loading && filteredRequirements.length === 0 && (
        <div style={{ color: theme.colors.textDark }}>No requirements found.</div>
      )}

      {/* Table */}
      {!loading && filteredRequirements.length > 0 && (
        <div
          style={{
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border}`,
            overflow: "hidden"
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14
            }}
          >
            <thead
              style={{
                background: theme.colors.background,
                borderBottom: `1px solid ${theme.colors.border}`
              }}
            >
              <tr>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>ID</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Title</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Type</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Source</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Coverage</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Tests</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequirements.map((r: RTMRequirementView) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                >
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{r.id}</td>

                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ fontWeight: 500 }}>{r.title}</div>
                    {r.description && (
                      <div style={{ fontSize: 12, color: theme.colors.textDark }}>
                        {r.description}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: "8px 10px" }}>{r.type.toUpperCase()}</td>

                  <td style={{ padding: "8px 10px", fontSize: 12 }}>
                    {r.source?.pageUrl && <div>Page: {r.source.pageUrl}</div>}
                    {r.source?.endpointPath && (
                      <div>
                        Endpoint: {r.source.method?.toUpperCase()} {r.source.endpointPath}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: "8px 10px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        background:
                          r.coverageStatus === "covered"
                            ? "rgba(34,197,94,0.1)"
                            : "rgba(239,68,68,0.1)",
                        color:
                          r.coverageStatus === "covered"
                            ? "rgb(22,163,74)"
                            : "rgb(220,38,38)"
                      }}
                    >
                      {r.coverageStatus === "covered" ? "Covered" : "Not Covered"}
                    </span>
                  </td>

                  <td style={{ padding: "8px 10px", fontSize: 12 }}>
                    {r.tests.length === 0 && <div>No tests</div>}
                    {r.tests.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {r.tests.map(t => (
                          <li key={t.file + t.name}>
                            <span>{t.name}</span>{" "}
                            <span
                              style={{
                                marginLeft: 4,
                                fontSize: 11,
                                padding: "1px 6px",
                                borderRadius: 999,
                                background:
                                  t.status === "passed"
                                    ? "rgba(34,197,94,0.1)"
                                    : t.status === "failed"
                                    ? "rgba(239,68,68,0.1)"
                                    : t.status === "flaky"
                                    ? "rgba(234,179,8,0.1)"
                                    : "rgba(148,163,184,0.1)",
                                color:
                                  t.status === "passed"
                                    ? "rgb(22,163,74)"
                                    : t.status === "failed"
                                    ? "rgb(220,38,38)"
                                    : t.status === "flaky"
                                    ? "rgb(202,138,4)"
                                    : "rgb(100,116,139)"
                              }}
                            >
                              {t.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
