import { useState, useEffect, type ReactNode } from "react";
import { useColors } from "@/hooks/useColors";
import { RtmVersionProvider, useRtmVersion } from "../state/rtmVersionStore";
import { RTMVersionSelector } from "./RTMVersionSelector";
import { RTMImportModal } from "./RTMImportModal";
import { listRTMEnabledFrameworks, type RegisteredFramework } from "@/framework/api/framework";

interface Props {
  projectId: string;
  title:     string;
  subtitle?: string;
  actions?:  ReactNode;
  children:  (versionId: string, frameworkId?: string) => ReactNode;
}

function InnerLayout({ projectId, title, subtitle, actions, children }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P } = useColors();
  const { snapshot, loading, reload } = useRtmVersion();
  const [importOpen,  setImportOpen]  = useState(false);
  const [frameworks,  setFrameworks]  = useState<RegisteredFramework[]>([]);
  const [frameworkId, setFrameworkId] = useState<string>("");

  useEffect(() => {
    listRTMEnabledFrameworks(projectId)
      .then(list => {
        setFrameworks(list);
        if (list.length > 0 && !frameworkId) setFrameworkId(list[0].id);
      })
      .catch(() => {});
  }, [projectId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {importOpen && (
        <RTMImportModal
          projectId={projectId}
          onClose={() => setImportOpen(false)}
          onDone={reload}
        />
      )}

      {/* ── Workspace header bar ── */}
      <div style={{
        background: surface, border: `1px solid ${border}`, borderRadius: 12,
        padding: "12px 20px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: text }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{subtitle}</div>}
        </div>

        {/* Framework selector — only shown when RTM-enabled frameworks exist */}
        {frameworks.length > 0 && (
          <select
            value={frameworkId}
            onChange={e => setFrameworkId(e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: `1px solid ${border}`, background: surface, color: text,
              cursor: "pointer",
            }}
          >
            <option value="">All frameworks</option>
            {frameworks.map(fw => (
              <option key={fw.id} value={fw.id}>
                {fw.name} ({fw.frameworkType}/{fw.language})
              </option>
            ))}
          </select>
        )}

        {/* Version selector */}
        <RTMVersionSelector />

        {/* Extra actions slot */}
        {actions}

        {/* Import button */}
        <button
          onClick={() => setImportOpen(true)}
          style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: `1px solid ${border}`, background: "transparent", color: muted, cursor: "pointer",
          }}
        >
          ↑ Import RTM
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48, color: muted, fontSize: 13 }}>
          Loading…
        </div>
      ) : !snapshot ? (
        <div style={{
          background: surface, border: `1px solid ${border}`, borderRadius: 12,
          padding: "48px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.25 }}>◈</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 6 }}>No RTM initialized</div>
          <div style={{ fontSize: 12, color: muted, marginBottom: 20 }}>
            Initialize a domain model first to start managing requirements.
          </div>
          <button
            onClick={() => setImportOpen(true)}
            style={{ padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", background: P, color: "#fff", cursor: "pointer" }}
          >
            Initialize RTM
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {children(snapshot.versionId, frameworkId || undefined)}
        </div>
      )}
    </div>
  );
}

export function RTMWorkspaceLayout(props: Props) {
  return (
    <RtmVersionProvider projectId={props.projectId}>
      <InnerLayout {...props} />
    </RtmVersionProvider>
  );
}
