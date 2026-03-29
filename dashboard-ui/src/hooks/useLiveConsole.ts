import { useEffect, useRef, useState } from "react";
import type { TimelineEvent } from "../api/types";
import { connectToRunStream } from "../api/ws";

export function useLiveConsole(runId: string) {
  const [consoleEvents, setConsoleEvents] = useState<TimelineEvent[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = connectToRunStream(runId);
    socketRef.current = socket;

    socket.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as TimelineEvent;
        if (event.event_type === "console") {
          setConsoleEvents((prev) => [...prev, event]);
        }
      } catch (_) {}
    };

    return () => socket.close();
  }, [runId]);

  return { consoleEvents };
}
