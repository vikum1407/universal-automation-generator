CREATE VIEW test_latest_run AS
SELECT DISTINCT ON (test_id)
  test_id,
  run_id,
  status,
  started_at,
  finished_at,
  duration_ms
FROM test_runs
ORDER BY test_id, started_at DESC;
