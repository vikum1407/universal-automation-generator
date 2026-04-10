import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ProjectGateway {
  @WebSocketServer()
  server: Server;

  emitRecrawlEvent(projectId: string, event: string, payload: any = {}) {
    this.server.to(projectId).emit('recrawl-event', {
      projectId,
      event,
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  emitStatus(projectId: string, status: string) {
    this.server.to(projectId).emit('project-status', {
      projectId,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}
