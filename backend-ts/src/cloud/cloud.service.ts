import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { cloudConfig } from "./cloud.config";

@Injectable()
export class CloudService {
  private s3 = new S3Client({
    region: cloudConfig.region,
    credentials: {
      accessKeyId: cloudConfig.key,
      secretAccessKey: cloudConfig.secret
    }
  });

  private async retry<T>(fn: () => Promise<T>, retries = cloudConfig.retries): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 0) throw err;
      return this.retry(fn, retries - 1);
    }
  }

  async uploadDir(bucket: string, prefix: string, dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        await this.uploadDir(bucket, `${prefix}/${file}`, full);
        continue;
      }

      await this.retry(() =>
        this.s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: `${prefix}/${file}`,
            Body: fs.readFileSync(full)
          })
        )
      );
    }
  }

  async downloadDir(bucket: string, prefix: string, dir: string) {
    const list = await this.retry(() =>
      this.s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix
        })
      )
    );

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (const obj of list.Contents || []) {
      if (!obj.Key) continue;

      const rel = obj.Key.replace(prefix + "/", "");
      const dest = path.join(dir, rel);

      const data = await this.retry(() =>
        this.s3.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: obj.Key
          })
        )
      );

      const folder = path.dirname(dest);
      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

      const stream = await data.Body?.transformToByteArray();
      fs.writeFileSync(dest, Buffer.from(stream || []));
    }
  }
}
