import { useEffect, useRef, useState } from "react";
import type { TimelineEvent } from "../api/types";
import { connectToRunStream } from "../api/ws";

export function useLiveLogs(runId: string) {
  const [logEvents, setLogEvents] = useState<TimelineEvent[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = connectToRunStream(runId);
    socketRef.current = socket;

    socket.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as TimelineEvent;
        if (event.event_type === "stdout") {
          setLogEvents((prev) => [...prev, event]);
        }
      } catch (_) {}
    };

    return () => socket.close();
  }, [runId]);

  return { logEvents };
}
