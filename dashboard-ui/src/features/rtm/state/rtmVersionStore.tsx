import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  fetchRTMSnapshot, listRTMVersions, activateRTMVersion,
  type RTMSnapshot, type RtmVersion,
} from "@/api/rtm";

// ─── State shape ──────────────────────────────────────────────────────────────

interface RtmVersionState {
  snapshot:      RTMSnapshot | null;
  versions:      RtmVersion[];
  versionId:     string | null;
  loading:       boolean;
  reload:        () => void;
  switchVersion: (versionId: string) => Promise<void>;
}

const Ctx = createContext<RtmVersionState | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RtmVersionProvider({ projectId, children }: { projectId: string; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<RTMSnapshot | null>(null);
  const [versions, setVersions] = useState<RtmVersion[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [snap, vers] = await Promise.all([
        fetchRTMSnapshot(projectId).catch(() => null),
        listRTMVersions(projectId).catch(() => []),
      ]);
      setSnapshot(snap);
      setVersions(vers);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const switchVersion = useCallback(async (vId: string) => {
    await activateRTMVersion(projectId, vId);
    await load();
  }, [projectId, load]);

  return (
    <Ctx.Provider value={{
      snapshot,
      versions,
      versionId: snapshot?.versionId ?? null,
      loading,
      reload:        load,
      switchVersion,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRtmVersion(): RtmVersionState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRtmVersion must be used inside RtmVersionProvider");
  return ctx;
}
