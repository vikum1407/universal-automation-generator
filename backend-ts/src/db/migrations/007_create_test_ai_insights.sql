CREATE TABLE test_ai_insights (
  test_id TEXT PRIMARY KEY,
  key_findings TEXT[] NOT NULL,
  suggested_fixes TEXT[] NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('P0', 'P1', 'P2'))
);
