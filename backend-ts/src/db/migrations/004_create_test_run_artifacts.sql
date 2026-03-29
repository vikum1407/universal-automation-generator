CREATE TABLE test_run_artifacts (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('screenshot', 'video', 'snapshot', 'diff')),
  url TEXT NOT NULL
);

CREATE INDEX idx_artifacts_run_id ON test_run_artifacts(run_id);
