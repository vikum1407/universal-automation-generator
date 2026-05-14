import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useColors } from "@/hooks/useColors";
import {
  getProjectFrameworks,
  type PersistedFramework,
} from "@/framework/api/framework";
import RegenerateModal from "./RegenerateModal";

// ─── Colour maps ──────────────────────────────────────────────────────────────

const FW_COLORS: Record<string, string> = {
  selenium:    "#E25C1D",
  playwright:  "#7B5FFF",
  cypress:     "#17B26A",
  webdriverio: "#E8A000",
  restassured: "#EF4444",
  appium:      "#2563EB",
};

const LANG_COLORS: Record<string, string> = {
  java:        "#E76F00",
  typescript:  "#3178C6",
  javascript:  "#C4A000",
  python:      "#3B82F6",
  csharp:      "#9B59B6",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectFrameworkTab({
  projectId,
  projectName,
}: {
  projectId:   string;
  projectName: string;
}) {
  const navigate = useNavigate();
  const { P, BDR, CARD, TXT, TXT2 } = useColors();

  const [frameworks, setFrameworks] = useState<PersistedFramework[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // Regenerate modal
  const [regenTarget, setRegenTarget] = useState<PersistedFramework | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjectFrameworks(projectId);
      setFrameworks(data);
    } catch {
      setError("Failed to load frameworks for this project.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const goToGenerator = () => {
    navigate(`/framework/start?projectId=${encodeURIComponent(projectId)}&projectName=${encodeURIComponent(projectName)}`);
  };

  return (
    <>
      <div style={{ padding: "28px 32px", maxWidth: 860 }}>

        {/* ── Header row ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TXT }}>Generated Frameworks</div>
            <div style={{ fontSize: 12, color: TXT2, marginTop: 4 }}>
              Automation frameworks generated for this project via the Framework Generator.
            </div>
          </div>
          <button
            onClick={goToGenerator}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 8,
              background: P, color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}
          >
            + Generate New Framework
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ color: TXT2, fontSize: 13, padding: "32px 0", textAlign: "center" }}>
            Loading frameworks…
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: "14px 18px", borderRadius: 10,
            background: "#EF444412", border: "1px solid #EF444440",
            color: "#EF4444", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && frameworks.length === 0 && (
          <div style={{
            padding: "48px 32px", borderRadius: 14,
            background: CARD, border: `1px dashed ${BDR}`,
            textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <div style={{ fontSize: 32, opacity: 0.25 }}>⬡</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TXT }}>No frameworks yet</div>
            <div style={{ fontSize: 12, color: TXT2, maxWidth: 320, lineHeight: 1.6 }}>
              Generate your first automation framework for this project using the Framework Generator.
            </div>
            <button
              onClick={goToGenerator}
              style={{
                marginTop: 4, padding: "9px 22px", borderRadius: 8,
                background: P, color: "#fff", border: "none",
                cursor: "pointer", fontSize: 13, fontWeight: 700,
              }}
            >
              Open Framework Generator
            </button>
          </div>
        )}

        {!loading && !error && frameworks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {frameworks.map(fw => (
              <FrameworkCard
                key={fw.id}
                fw={fw}
                onRegenerate={() => setRegenTarget(fw)}
                P={P} BDR={BDR} CARD={CARD} TXT={TXT} TXT2={TXT2}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Regenerate modal ───────────────────────────────────────────── */}
      {regenTarget && (
        <RegenerateModal
          fw={regenTarget}
          onClose={() => setRegenTarget(null)}
          onSuccess={() => {
            setRegenTarget(null);
            load();
          }}
        />
      )}
    </>
  );
}

// ─── Framework card ───────────────────────────────────────────────────────────

function FrameworkCard({
  fw, onRegenerate, P, BDR, CARD, TXT, TXT2,
}: {
  fw:          PersistedFramework;
  onRegenerate: () => void;
  P: string; BDR: string; CARD: string; TXT: string; TXT2: string;
}) {
  const fwColor   = FW_COLORS[fw.frameworkType] ?? P;
  const langColor = LANG_COLORS[fw.language]    ?? P;

  const latestVersion = fw.versions[0];
  const generatedAt   = latestVersion?.generatedAt ?? fw.updatedAt;
  const fileCount     = latestVersion?.fileCount ?? 0;
  const downloadUrl   = fw.artifactLocation;

  return (
    <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        padding: "14px 18px", borderBottom: `1px solid ${BDR}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
          background: `${fwColor}18`, color: fwColor,
          border: `1px solid ${fwColor}30`, textTransform: "capitalize",
        }}>
          {fw.frameworkType}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
          background: `${langColor}18`, color: langColor,
          border: `1px solid ${langColor}30`, textTransform: "capitalize",
        }}>
          {fw.language}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
          background: `${P}14`, color: P, marginLeft: 2,
        }}>
          v{fw.versionNumber}
        </span>
        {latestVersion?.label && (
          <span style={{ fontSize: 11, color: TXT2, fontStyle: "italic" }}>
            "{latestVersion.label}"
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
          background: fw.status === "generated" ? "#10B98118" : "#F59E0B18",
          color: fw.status === "generated" ? "#10B981" : "#F59E0B",
          textTransform: "capitalize",
        }}>
          {fw.status}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ display: "flex", gap: 20, flex: 1 }}>
          <Stat label="Files"     value={fileCount > 0 ? `${fileCount}` : "—"} TXT={TXT} TXT2={TXT2} />
          <Stat label="Versions"  value={`${fw.versionNumber}`}                 TXT={TXT} TXT2={TXT2} />
          <Stat label="Generated" value={formatDate(generatedAt)}               TXT={TXT} TXT2={TXT2} />
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              style={{
                padding: "7px 14px", borderRadius: 8,
                background: "#10B98118", color: "#10B981",
                border: "1px solid #10B98130",
                fontSize: 12, fontWeight: 700, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              ↓ Download
            </a>
          )}
          <button
            onClick={onRegenerate}
            style={{
              padding: "7px 14px", borderRadius: 8,
              background: `${P}14`, color: P,
              border: `1px solid ${P}40`,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            ↺ Regenerate
          </button>
        </div>
      </div>

      {/* Version history pills */}
      {fw.versions.length > 1 && (
        <div style={{
          borderTop: `1px solid ${BDR}`, padding: "10px 18px",
          display: "flex", gap: 8, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.07em", alignSelf: "center" }}>
            History
          </span>
          {fw.versions.map(v => (
            <span key={v.id} style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 6,
              background: `${P}0a`, color: TXT2, border: `1px solid ${BDR}`,
            }}>
              v{v.versionNumber}{v.label ? ` · ${v.label}` : ""} · {formatDate(v.generatedAt)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stat({ label, value, TXT, TXT2 }: { label: string; value: string; TXT: string; TXT2: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: TXT2, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: TXT, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}
