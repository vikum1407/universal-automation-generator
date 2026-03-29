CREATE TABLE test_flakiness (
  test_id TEXT PRIMARY KEY,
  total_runs INT NOT NULL DEFAULT 0,
  failed_runs INT NOT NULL DEFAULT 0,
  flaky_runs INT NOT NULL DEFAULT 0,
  flakiness_score NUMERIC NOT NULL DEFAULT 0
);
