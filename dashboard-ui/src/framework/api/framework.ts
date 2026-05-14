import { api } from "../../utils/api";

// All Framework Generator API calls are isolated here.
// Components never call fetch/axios directly.

export async function getNodes(framework: string, language: string) {
  return api.get(`/framework/nodes?framework=${encodeURIComponent(framework)}&language=${encodeURIComponent(language)}`);
}

export async function getNodeById(id: string) {
  return api.get(`/framework/nodes/${encodeURIComponent(id)}`);
}

export async function getSupportedFrameworks() {
  return api.get("/framework/frameworks/summary");
}

export async function getSupportedLanguages(framework: string) {
  return api.get(`/framework/languages?framework=${encodeURIComponent(framework)}`);
}

export async function validateCombination(framework: string, language: string) {
  return api.get(`/framework/compatibility/validate?framework=${encodeURIComponent(framework)}&language=${encodeURIComponent(language)}`);
}

export async function getLibrarySummary() {
  return api.get("/framework/library/summary");
}

export async function validateBlueprint(blueprint: Record<string, any>) {
  return api.post("/framework/blueprint/validate", blueprint);
}

export async function generateFramework(blueprint: Record<string, any>) {
  return api.post("/framework/generate", blueprint);
}

export function getDownloadUrl(jobId: string): string {
  return `http://localhost:3000/framework/download/${encodeURIComponent(jobId)}`;
}

export async function explainBlueprint(blueprint: Record<string, any>) {
  return api.post("/framework/explain", blueprint);
}

export async function getJobDocs(jobId: string) {
  return api.get(`/framework/job/${encodeURIComponent(jobId)}/docs`);
}

// ─── Persisted framework records ─────────────────────────────────────────────

export interface FrameworkVersion {
  id:               string;
  frameworkId:      string;
  versionNumber:    number;
  blueprint:        any;
  artifactLocation: string | null;
  fileCount:        number;
  projectStructure: string[];
  label:            string | null;
  generatedAt:      string;
}

export interface PersistedFramework {
  id:               string;
  projectId:        string;
  name:             string;
  frameworkType:    string;
  language:         string;
  blueprint:        any;
  artifactLocation: string | null;
  versionNumber:    number;
  status:           string;
  currentVersionId: string | null;
  createdAt:        string;
  updatedAt:        string;
  versions:         FrameworkVersion[];
}

export async function getProjectFrameworks(projectId: string): Promise<PersistedFramework[]> {
  return api.get(`/framework/project/${encodeURIComponent(projectId)}/frameworks`);
}

export async function regeneratePersistedFramework(
  frameworkId: string,
  overrides: { websiteUrl?: string; swaggerUrl?: string; coverageLevel?: string; label?: string } = {},
): Promise<any> {
  return api.post(`/framework/record/${encodeURIComponent(frameworkId)}/regenerate`, overrides);
}

// ─── Framework Registry ───────────────────────────────────────────────────────

export interface RegisteredFramework {
  id:               string;
  projectId:        string;
  name:             string;
  frameworkType:    string;
  language:         string;
  blueprintId:      string | null;
  artifactLocation: string | null;
  isRTMEnabled:     boolean;
  createdAt:        string;
  createdBy:        string | null;
}

export async function listRegisteredFrameworks(projectId: string): Promise<RegisteredFramework[]> {
  return api.get(`/framework/registry?projectId=${encodeURIComponent(projectId)}`);
}

export async function listRTMEnabledFrameworks(projectId: string): Promise<RegisteredFramework[]> {
  return api.get(`/framework/registry/rtm-enabled?projectId=${encodeURIComponent(projectId)}`);
}

export interface RegisterFrameworkPayload {
  projectId:        string;
  name:             string;
  frameworkType:    string;
  language:         string;
  blueprintId?:     string;
  artifactLocation?: string;
  isRTMEnabled?:    boolean;
}

export async function registerFramework(payload: RegisterFrameworkPayload): Promise<RegisteredFramework> {
  return api.post("/framework/registry", payload);
}

export async function updateFramework(id: string, patch: { name?: string; isRTMEnabled?: boolean }): Promise<RegisteredFramework> {
  return api.put(`/framework/registry/${encodeURIComponent(id)}`, patch);
}

export async function deleteFramework(id: string): Promise<void> {
  return api.delete(`/framework/registry/${encodeURIComponent(id)}`);
}

export async function setDefaultFramework(id: string, projectId: string): Promise<{ defaultFrameworkId: string }> {
  return api.post(`/framework/registry/${encodeURIComponent(id)}/set-default`, { projectId });
}
