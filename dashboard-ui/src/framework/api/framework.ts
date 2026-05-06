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
