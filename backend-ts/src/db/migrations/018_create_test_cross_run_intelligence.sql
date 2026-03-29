CREATE TABLE test_cross_run_intelligence (
  test_id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  clusters JSONB NOT NULL,
  trend TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
