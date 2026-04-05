-- Drop Foreign Keys
ALTER TABLE "CloudSync" DROP CONSTRAINT IF EXISTS "CloudSync_projectId_fkey";
ALTER TABLE "Stability" DROP CONSTRAINT IF EXISTS "Stability_projectId_fkey";
ALTER TABLE "Analytics" DROP CONSTRAINT IF EXISTS "Analytics_projectId_fkey";
ALTER TABLE "History" DROP CONSTRAINT IF EXISTS "History_projectId_fkey";
ALTER TABLE "Release" DROP CONSTRAINT IF EXISTS "Release_projectId_fkey";
ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_projectId_fkey";
ALTER TABLE "Requirement" DROP CONSTRAINT IF EXISTS "Requirement_projectId_fkey";
ALTER TABLE "TestResult" DROP CONSTRAINT IF EXISTS "TestResult_runId_fkey";
ALTER TABLE "TestRun" DROP CONSTRAINT IF EXISTS "TestRun_projectId_fkey";
ALTER TABLE "Endpoint" DROP CONSTRAINT IF EXISTS "Endpoint_flowId_fkey";
ALTER TABLE "Endpoint" DROP CONSTRAINT IF EXISTS "Endpoint_projectId_fkey";
ALTER TABLE "Flow" DROP CONSTRAINT IF EXISTS "Flow_projectId_fkey";

-- Drop Tables
DROP TABLE IF EXISTS "CloudSync";
DROP TABLE IF EXISTS "Stability";
DROP TABLE IF EXISTS "Analytics";
DROP TABLE IF EXISTS "History";
DROP TABLE IF EXISTS "Release";
DROP TABLE IF EXISTS "Suggestion";
DROP TABLE IF EXISTS "Requirement";
DROP TABLE IF EXISTS "TestResult";
DROP TABLE IF EXISTS "TestRun";
DROP TABLE IF EXISTS "Endpoint";
DROP TABLE IF EXISTS "Flow";
DROP TABLE IF EXISTS "Project";

-- Drop Enums
DROP TYPE IF EXISTS "SuggestionStatus";
DROP TYPE IF EXISTS "RequirementStatus";
DROP TYPE IF EXISTS "RunStatus";
DROP TYPE IF EXISTS "ProjectType";
