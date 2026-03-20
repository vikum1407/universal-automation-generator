CREATE TABLE IF NOT EXISTS risk_trends (
  id SERIAL PRIMARY KEY,
  project TEXT NOT NULL,
  increasing_streak INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
