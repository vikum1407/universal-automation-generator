CREATE TABLE test_run_network (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  method TEXT NOT NULL,
  status INT,
  request_body TEXT,
  response_body TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL,
  duration_ms INT NOT NULL
);

CREATE INDEX idx_network_run_id ON test_run_network(run_id);
