export const cloudConfig = {
  region: process.env.S3_REGION!,
  key: process.env.S3_KEY!,
  secret: process.env.S3_SECRET!,
  bucket: process.env.S3_BUCKET || "qlitz",
  timeout: 15000,
  retries: 3
};
