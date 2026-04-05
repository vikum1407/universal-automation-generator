export interface Project {
  id: string;
  type: "ui" | "api";

  // UI fields
  url?: string;
  username?: string;
  password?: string;
  crawlDepth?: number;

  // API fields
  swaggerUrl?: string;
  swaggerFilePath?: string;
  authToken?: string;

  env?: string; // optional in Prisma
  status: string; // Prisma uses plain String
  createdAt: Date;
}
