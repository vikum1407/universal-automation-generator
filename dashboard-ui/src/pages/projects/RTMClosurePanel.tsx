import { useState, useEffect, useCallback, useRef } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import {
  fetchRTMSnapshot,
  listClosureJobs, getClosureJob, cancelClosureJob, getClosureIterations,
  type ClosureJob, type ClosureIteration, type CoverageSummarySnapshot,
} from "@/api/rtm";
import { RTMClosureModal } from "./RTMClosureModal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  pending:   "#FFA726",
  running:   "#2196F3",
  completed: "#4CAF50",
  failed:    "#EF5350",
  cancelled: "#9E9E9E",
};

function pct(n: number): string { return `${Math.round(n)}%`; }

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#aaa";
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}44`,
    }}>
      {status === "running" && <span style={{ marginRight: 5 }}>●</span>}
      {status}
    </span>
  );
}

function CoverageBar({
  before, after, target,
}: { before: CoverageSummarySnapshot; after: CoverageSummarySnapshot | null; target: number }) {
  const { BDR: border } = useColors();
  const targetPct = target * 100;
  const afterPct  = after?.requirementsCoveragePercent ?? before.requirementsCoveragePercent;
  const color     = afterPct >= targetPct ? "#4CAF50" : afterPct > before.requirementsCoveragePercent ? "#FFA726" : "#EF5350";

  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
        <span style={{ color: "#9E9E9E" }}>{pct(before.requirementsCoveragePercent)}</span>
        <span style={{ fontWeight: 700, color }}>→ {pct(afterPct)}</span>
        <span style={{ color: "#9E9E9E" }}>target: {pct(targetPct)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: border, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", height: "100%", width: `${afterPct}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
        {/* Target marker */}
        <div style={{ position: "absolute", left: `${targetPct}%`, top: 0, bottom: 0, width: 2, background: "#666", borderRadius: 1 }} />
      </div>
    </div>
  );
}

// ─── Iteration row ────────────────────────────────────────────────────────────

function IterationRow({ iter }: { iter: ClosureIteration }) {
  const { BDR: border, TXT: text, TXT2: muted } = useColors();
  const delta = iter.coverageAfter
    ? iter.coverageAfter.requirementsCoveragePercent - iter.coverageBefore.requirementsCoveragePercent
    : 0;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "9px 14px", borderBottom: `1px solid ${border}`,
      fontSize: 12,
    }}>
      <div style={{ width: 28, textAlign: "center", fontWeight: 700, color: muted }}>
        #{iter.iterationNumber}
      </div>
      <StatusBadge status={iter.status} />
      <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1 }}>
        <span style={{ color: muted }}>{pct(iter.coverageBefore.requirementsCoveragePercent)}</span>
        {iter.coverageAfter && (
          <>
            <span style={{ color: muted }}>→</span>
            <span style={{ fontWeight: 700, color: delta > 0 ? "#4CAF50" : delta < 0 ? "#EF5350" : muted }}>
              {pct(iter.coverageAfter.requirementsCoveragePercent)}
            </span>
            {delta !== 0 && (
              <span style={{ fontSize: 10, color: delta > 0 ? "#4CAF50" : "#EF5350", fontWeight: 700 }}>
                ({delta > 0 ? "+" : ""}{delta.toFixed(1)}%)
              </span>
            )}
          </>
        )}
      </div>
      <div style={{ fontSize: 11, color: muted, textAlign: "right" }}>
        {iter.testsGenerated > 0 && <span style={{ color: "#2196F3", fontWeight: 700 }}>+{iter.testsGenerated} tests</span>}
        {iter.failureReason && <span style={{ color: "#EF5350", marginLeft: 8 }}>{iter.failureReason}</span>}
      </div>
    </div>
  );
}

// ─── Closure job card ─────────────────────────────────────────────────────────

function JobCard({
  job, projectId, versionId, onRefresh,
}: {
  job: ClosureJob; projectId: string; versionId: string; onRefresh: () => void;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P } = useColors();
  const [expanded,   setExpanded]   = useState(false);
  const [iterations, setIterations] = useState<ClosureIteration[]>([]);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (expanded) {
      getClosureIterations(projectId, versionId, job.id).then(setIterations);
    }
  }, [expanded, job.id, projectId, versionId]);

  const lastIter = job.iterations?.at(-1) ?? null;
  const beforeSnap = lastIter?.coverageBefore ?? { requirementsCoveragePercent: 0 } as any;
  const afterSnap  = lastIter?.coverageAfter ?? null;

  async function handleCancel() {
    if (!confirm("Cancel this closure job?")) return;
    setCancelling(true);
    try {
      await cancelClosureJob(projectId, versionId, job.id);
      toast.success("Job cancelled");
      onRefresh();
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header row */}
      <div
        style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ fontSize: 14 }}>{expanded ? "▼" : "▶"}</div>
        <StatusBadge status={job.status} />
        <div style={{ flex: 1, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: muted }}>
            <span style={{ fontWeight: 700, color: text }}>{job.framework}</span> / {job.language}
            {job.dryRun && <span style={{ marginLeft: 6, padding: "1px 7px", background: "#607D8B18", color: "#607D8B", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>DRY RUN</span>}
          </div>
          <CoverageBar before={beforeSnap} after={afterSnap} target={job.targetRequirementCoverage} />
          <div style={{ fontSize: 11, color: muted, whiteSpace: "nowrap" }}>
            Iter {job.currentIteration}/{job.maxIterations}
            {job.testsGeneratedTotal > 0 && <span style={{ marginLeft: 6, color: "#2196F3", fontWeight: 700 }}>+{job.testsGeneratedTotal} tests</span>}
          </div>
        </div>
        {job.status === "running" && (
          <button onClick={e => { e.stopPropagation(); handleCancel(); }} disabled={cancelling}
            style={{ padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: `1px solid #EF5350`, background: "#EF535012", color: "#EF5350", cursor: "pointer" }}>
            {cancelling ? "…" : "Cancel"}
          </button>
        )}
        {job.failureReason && (
          <div style={{ fontSize: 11, color: "#EF5350", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.failureReason}
          </div>
        )}
        <div style={{ fontSize: 10, color: muted, whiteSpace: "nowrap" }}>
          {new Date(job.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Iterations */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${border}` }}>
          {iterations.length === 0
            ? <div style={{ padding: "16px", fontSize: 12, color: muted }}>No iterations yet</div>
            : iterations.map(it => <IterationRow key={it.id} iter={it} />)
          }
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface Props { projectId: string }

export function RTMClosurePanel({ projectId }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P } = useColors();

  const [versionId,   setVersionId]   = useState<string | null>(null);
  const [jobs,        setJobs]        = useState<ClosureJob[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const pollingRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve versionId
  useEffect(() => {
    fetchRTMSnapshot(projectId)
      .then(snap => { if (snap) setVersionId(snap.versionId); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const loadJobs = useCallback(async (vid: string) => {
    const list = await listClosureJobs(projectId, vid);
    setJobs(list);
    return list;
  }, [projectId]);

  useEffect(() => {
    if (!versionId) return;
    loadJobs(versionId);
  }, [versionId, loadJobs]);

  // Poll while any job is running
  useEffect(() => {
    if (!versionId) return;
    const hasRunning = jobs.some(j => j.status === "running");

    if (hasRunning && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        loadJobs(versionId).then(list => {
          if (!list.some(j => j.status === "running")) {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
          }
        });
      }, 3000);
    }

    if (!hasRunning && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, [jobs, versionId, loadJobs]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 48, fontSize: 13, color: muted }}>
      Loading…
    </div>
  );

  if (!versionId) return (
    <div style={{ textAlign: "center", color: muted, fontSize: 13, padding: "48px 0" }}>
      No RTM domain model found. Initialize RTM first.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {showModal && (
        <RTMClosureModal
          projectId={projectId}
          versionId={versionId}
          onClose={() => setShowModal(false)}
          onStarted={() => loadJobs(versionId)}
        />
      )}

      {/* Header */}
      <div style={{
        background: surface, border: `1px solid ${border}`, borderRadius: 12,
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: text }}>Coverage Closure Loop</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
            Automatically generates tests until coverage targets are met
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            marginLeft: "auto", padding: "9px 22px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            border: "none", background: P, color: "#fff", cursor: "pointer",
          }}
        >
          ⟳ Close Coverage Gaps
        </button>
      </div>

      {/* How it works */}
      <div style={{
        background: `${P}08`, border: `1px solid ${P}22`, borderRadius: 12,
        padding: "12px 18px", display: "flex", gap: 24, flexWrap: "wrap",
      }}>
        {[
          { step: "1", label: "Measure", desc: "Recompute coverage" },
          { step: "2", label: "Analyse", desc: "Find gaps + plan" },
          { step: "3", label: "Generate", desc: "Write test files" },
          { step: "4", label: "Repeat", desc: "Until target met" },
        ].map(s => (
          <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${P}22`, color: P, fontWeight: 900, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s.step}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{s.label}</div>
              <div style={{ fontSize: 10, color: muted }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      {jobs.length === 0 ? (
        <div style={{
          background: surface, border: `1px solid ${border}`, borderRadius: 12,
          padding: "40px", textAlign: "center", fontSize: 13, color: muted,
        }}>
          No closure jobs yet. Click <strong style={{ color: P }}>Close Coverage Gaps</strong> to start the loop.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {jobs.map(j => (
            <JobCard
              key={j.id}
              job={j}
              projectId={projectId}
              versionId={versionId}
              onRefresh={() => loadJobs(versionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
