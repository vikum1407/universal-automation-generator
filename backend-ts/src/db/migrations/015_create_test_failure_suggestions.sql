CREATE TABLE test_failure_suggestions (
  run_id TEXT PRIMARY KEY REFERENCES test_runs(run_id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  code_snippet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
