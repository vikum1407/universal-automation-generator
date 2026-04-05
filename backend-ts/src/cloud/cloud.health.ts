import { Injectable } from "@nestjs/common";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

@Injectable()
export class CloudHealthService {
  private s3 = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_KEY!,
      secretAccessKey: process.env.S3_SECRET!
    }
  });

  async check() {
    try {
      await this.s3.send(new ListBucketsCommand({}));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}
