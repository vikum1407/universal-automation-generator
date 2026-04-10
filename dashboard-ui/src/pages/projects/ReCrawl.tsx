import { useEffect, useState } from "react";
import Button from "../../dashboard/components/Button";
import { socket, joinProjectRoom } from "@/ai/ws";
import { toast } from "react-hot-toast";

const API_BASE = "http://localhost:3000";

export default function ReCrawl({ projectId }: { projectId: string }) {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    joinProjectRoom(projectId);

    const handler = (msg: any) => {
      if (msg.event === "recrawl-completed" || msg.event === "recrawl-failed") {
        setRunning(false);
      }
    };

    socket.on("recrawl-event", handler);

    return () => {
      socket.off("recrawl-event", handler);
    };
  }, [projectId]);

  const run = async () => {
    setRunning(true);
    toast("Re‑crawl requested");

    await fetch(`${API_BASE}/projects/${projectId}/recrawl`, {
      method: "POST",
    });
  };

  return (
    <div style={{ marginTop: "32px" }}>
      <h3 style={{ color: "#7B2FF7" }}>Self‑Updating Selectors</h3>

      <Button onClick={run} disabled={running} style={{ marginTop: 8 }}>
        {running ? "Re‑Crawling..." : "Re‑Crawl UI"}
      </Button>
    </div>
  );
}
