CREATE TABLE test_distributed_execution (
  run_id TEXT PRIMARY KEY REFERENCES test_runs(run_id) ON DELETE CASCADE,
  machine_id TEXT NOT NULL,
  ci_provider TEXT,
  ci_run_id TEXT,
  ci_job TEXT,
  ci_worker TEXT,
  shard_index INT,
  shard_total INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
