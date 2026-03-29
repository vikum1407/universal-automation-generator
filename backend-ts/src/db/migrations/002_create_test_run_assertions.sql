CREATE TABLE test_run_assertions (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  message TEXT NOT NULL
);

CREATE INDEX idx_assertions_run_id ON test_run_assertions(run_id);
