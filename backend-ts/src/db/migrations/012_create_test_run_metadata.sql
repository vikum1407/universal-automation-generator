CREATE TABLE test_run_metadata (
  run_id TEXT PRIMARY KEY REFERENCES test_runs(run_id) ON DELETE CASCADE,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  device TEXT,
  project TEXT,
  worker_index INT,
  retry INT,
  parallel_index INT
);
