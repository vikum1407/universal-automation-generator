import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type {
  StabilitySnapshot,
  TestStability,
  HealingSignal,
} from "@/types/StabilitySnapshot";
import TestMatrixRow from "./components/TestMatrixRow";

type TestSortKey =
  | "testId"
  | "title"
  | "status"
  | "passRate"
  | "recentFailures";

export default function TestStabilityMatrix({
  snapshot,
}: {
  snapshot: StabilitySnapshot;
}) {
  const [sortKey, setSortKey] = useState<TestSortKey>("testId");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const tests = (snapshot.tests ?? []) as TestStability[];
  const healingSignals = (snapshot.selfHealing ?? []) as HealingSignal[];

  const sorted = useMemo(() => {
    const copy = [...tests];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [tests, sortKey, sortDir]);

  const toggleSort = (key: TestSortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  return (
    <div className="p-4 bg-white dark:bg-slate-900 shadow rounded space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="text-lg font-semibold">Test Stability Matrix</div>
        <div className="text-xs text-slate-500">
          {tests.length} tests · {healingSignals.length} healing signals
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 sticky top-0 z-10">
          <button className="col-span-3 text-left" onClick={() => toggleSort("testId")}>
            Test
          </button>

          <button className="col-span-3 text-left" onClick={() => toggleSort("title")}>
            Title
          </button>

          <button className="col-span-2 text-left" onClick={() => toggleSort("status")}>
            Status
          </button>

          <button className="col-span-2 text-left" onClick={() => toggleSort("passRate")}>
            Pass rate
          </button>

          <button
            className="col-span-1 text-right"
            onClick={() => toggleSort("recentFailures")}
          >
            Failures
          </button>

          <div className="col-span-1 text-right">Healing</div>
        </div>

        <div ref={parentRef} className="h-[320px] overflow-auto bg-white dark:bg-slate-900">
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const test = sorted[virtualRow.index];

              return (
                <div
                  key={virtualRow.key}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TestMatrixRow
                    test={test}
                    healingSignals={healingSignals}
                    index={virtualRow.index}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
