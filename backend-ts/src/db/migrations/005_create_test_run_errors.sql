CREATE TABLE test_run_errors (
  run_id TEXT PRIMARY KEY REFERENCES test_runs(run_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  stack TEXT NOT NULL
);
