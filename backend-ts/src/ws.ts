import { Server } from "socket.io";
import { progressService } from "./services/ProgressService";

export function initWebSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("join", (projectId) => {
      socket.join(projectId);

      const p = progressService.get(projectId);
      if (p) {
        socket.emit("project-status", {
          status: p.status,
          progressPercent: p.percent,
          progressStep: p.step,
        });
      }
    });
  });

  return io;
}
