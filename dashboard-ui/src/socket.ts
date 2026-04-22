import { io } from "socket.io-client";

export const socket = io("http://127.0.0.1:3000", {
  transports: ["websocket"],
  path: "/socket.io",
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500
});
