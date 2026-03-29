CREATE TABLE test_daily_trends (
  id SERIAL PRIMARY KEY,
  test_id TEXT NOT NULL,
  day DATE NOT NULL,
  success_rate NUMERIC NOT NULL,
  failure_rate NUMERIC NOT NULL,
  flakiness NUMERIC NOT NULL
);

CREATE UNIQUE INDEX idx_trends_test_day ON test_daily_trends(test_id, day);
