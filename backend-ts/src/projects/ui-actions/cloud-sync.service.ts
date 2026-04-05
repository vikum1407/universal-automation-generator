import { Injectable } from "@nestjs/common";

@Injectable()
export class CloudSyncService {
  async sync(projectId: string) {
    return { success: true };
  }
}
