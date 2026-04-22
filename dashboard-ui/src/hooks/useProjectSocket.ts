import { useEffect } from "react";
import { socket } from "../socket";

export function useProjectSocket(projectId: string, handlers: {
  onStatus?: (data: any) => void;
  onProgress?: (data: any) => void;
  onEvent?: (data: any) => void;
}) {
  useEffect(() => {
    if (!projectId) return;

    socket.emit("join", projectId);

    if (handlers.onStatus) {
      socket.on("project-status", handlers.onStatus);
    }

    if (handlers.onProgress) {
      socket.on("recrawl-progress", handlers.onProgress);
    }

    if (handlers.onEvent) {
      socket.on("recrawl-event", handlers.onEvent);
    }

    return () => {
      socket.off("project-status");
      socket.off("recrawl-progress");
      socket.off("recrawl-event");
    };
  }, [projectId]);
}
