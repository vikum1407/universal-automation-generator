CREATE TABLE test_run_logs (
  id SERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_logs_run_id ON test_run_logs(run_id);
CREATE INDEX idx_logs_timestamp ON test_run_logs(timestamp);
