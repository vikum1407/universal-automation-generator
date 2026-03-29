import {
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class PlaywrightGateway {
  @WebSocketServer()
  server: Server;

  emitEvent(runId: string, event: any) {
    this.server.to(runId).emit("event", event);
  }

  joinRoom(client: any, runId: string) {
    client.join(runId);
  }
}
