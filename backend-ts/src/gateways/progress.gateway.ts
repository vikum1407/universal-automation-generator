import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { progressService } from "../services/ProgressService";

@WebSocketGateway({
  cors: { origin: "*" }
})
export class ProgressGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("join")
  handleJoin(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket
  ) {
    client.join(projectId);

    const p = progressService.get(projectId);

    if (!p) return;

    client.emit("project-status", {
      status: p.status,
      progressPercent: p.percent,
      progressStep: p.step
    });
  }

  emitProjectStatus(projectId: string) {
    const p = progressService.get(projectId);
    if (!p) return;

    this.server.to(projectId).emit("project-status", {
      status: p.status,
      progressPercent: p.percent,
      progressStep: p.step
    });
  }

  emitRecrawlProgress(projectId: string, percent: number, step: string) {
    this.server.to(projectId).emit("recrawl-progress", {
      percent,
      step
    });
  }

  emitRecrawlEvent(projectId: string) {
    this.server.to(projectId).emit("recrawl-event", {
      event: "recrawl-completed",
      projectId
    });
  }
}
