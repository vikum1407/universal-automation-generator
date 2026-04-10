import { io, Socket } from "socket.io-client";

export const socket: Socket = io("http://localhost:3000", {
  transports: ["websocket"],
});

export function joinProjectRoom(projectId: string) {
  socket.emit("join", projectId);
}
