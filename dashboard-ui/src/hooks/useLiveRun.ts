import { useEffect, useRef, useState } from "react";
import type { TimelineEvent } from "../api/types";
import { connectToRunStream } from "../api/ws";

export function useLiveRun(runId: string) {
  const [liveEvents, setLiveEvents] = useState<TimelineEvent[]>([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = connectToRunStream(runId);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);

    socket.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as TimelineEvent;
        setLiveEvents((prev) => [...prev, event]);
      } catch (_) {}
    };

    socket.onclose = () => setConnected(false);

    return () => socket.close();
  }, [runId]);

  return { liveEvents, connected };
}
