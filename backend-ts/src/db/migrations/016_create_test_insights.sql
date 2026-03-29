CREATE TABLE test_insights (
  run_id TEXT PRIMARY KEY REFERENCES test_runs(run_id) ON DELETE CASCADE,
  insights TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
