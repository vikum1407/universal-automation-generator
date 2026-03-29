import { useEffect, useRef, useState } from "react";
import { connectToRunStream } from "../api/ws";

export function useLiveVideo(runId: string) {
  const [videoChunks, setVideoChunks] = useState<Blob[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = connectToRunStream(runId);
    socketRef.current = socket;

    socket.binaryType = "arraybuffer";

    socket.onmessage = (msg) => {
      if (msg.data instanceof ArrayBuffer) {
        const blob = new Blob([msg.data], { type: "video/webm" });
        setVideoChunks((prev) => [...prev, blob]);
      }
    };

    return () => socket.close();
  }, [runId]);

  const videoUrl = videoChunks.length
    ? URL.createObjectURL(new Blob(videoChunks, { type: "video/webm" }))
    : null;

  return { videoUrl };
}
