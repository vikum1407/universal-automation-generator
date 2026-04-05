CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  url TEXT,
  username TEXT,
  password TEXT,
  crawlDepth INTEGER,
  swaggerUrl TEXT,
  swaggerFilePath TEXT,
  authToken TEXT,
  env TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL
);
