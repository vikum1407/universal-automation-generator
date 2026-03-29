CREATE TABLE test_failure_ai (
  run_id TEXT PRIMARY KEY REFERENCES test_runs(run_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
