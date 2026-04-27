const API_BASE = "http://localhost:3000";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EnvironmentConfig {
  id: string;
  name: string;
  type: "dev" | "staging" | "prod" | "custom";
  url: string;
  auth: {
    type: "none" | "basic" | "bearer" | "oauth2";
    username?: string;
    password?: string;
    token?: string;
    clientId?: string;
    clientSecret?: string;
    tokenUrl?: string;
  };
  variables: { key: string; value: string }[];
  isDefault: boolean;
}

export interface ScanSettings {
  ui: {
    maxDepth: number;
    maxPages: number;
    allowedDomains: string[];
    excludedPaths: string[];
    clickableElements: boolean;
    waitForNetwork: boolean;
  };
  api: {
    swaggerUrls: string[];
    excludedEndpoints: string[];
    includeDeprecated: boolean;
    followRedirects: boolean;
  };
  pipeline: {
    autoGenerateTests: boolean;
    autoUpdateRTM: boolean;
    scheduleCron: string;
    notifyOnCompletion: boolean;
  };
}

export interface TestExecutionSettings {
  concurrency: number;
  retries: number;
  timeoutMs: number;
  captureScreenshots: boolean;
  captureVideo: boolean;
  defaultBrowser: "chromium" | "firefox" | "webkit";
  headless: boolean;
  testSelectionStrategy: "all" | "changed" | "failed" | "critical";
  slowMoMs: number;
  parallelWorkers: number;
}

export interface AIPolicySettings {
  enableSuggestions: boolean;
  enableAutoHeal: boolean;
  enableTestGeneration: boolean;
  enableRequirementRewrite: boolean;
  autoApplyPolicy: "manual" | "low-risk" | "aggressive";
  healConfidenceThreshold: number;
  dataUsageConsent: boolean;
  includeInTraining: boolean;
}

export interface IntegrationSettings {
  jira: {
    enabled: boolean;
    host: string;
    projectKey: string;
    token: string;
    createIssueOnFailure: boolean;
    linkRTMRequirements: boolean;
  };
  github: {
    enabled: boolean;
    owner: string;
    repo: string;
    token: string;
    createPROnGenerate: boolean;
    statusChecks: boolean;
  };
  slack: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    notifyOnFailure: boolean;
    notifyOnHeal: boolean;
  };
  teams: {
    enabled: boolean;
    webhookUrl: string;
  };
  webhooks: {
    id: string;
    name: string;
    url: string;
    events: string[];
    secret: string;
    enabled: boolean;
  }[];
}

export interface AccessRole {
  id: string;
  email: string;
  name: string;
  role: "org-admin" | "project-admin" | "qa-lead" | "developer" | "viewer";
  addedAt: string;
}

export interface AccessControlSettings {
  roles: AccessRole[];
  allowSelfAssign: boolean;
  requireApprovalForAI: boolean;
}

export interface DataRetentionSettings {
  runsRetentionDays: number;
  artifactsRetentionDays: number;
  historyRetentionDays: number;
  timelineRetentionDays: number;
  piiHandling: "none" | "redact" | "hash";
  redactionRules: string[];
  autoDeleteOnRetentionExpiry: boolean;
}

export interface NotificationRule {
  id: string;
  eventType: string;
  condition: "always" | "on-failure" | "on-threshold";
  threshold?: number;
  channels: ("email" | "slack" | "teams" | "webhook")[];
  recipients: string[];
  enabled: boolean;
}

export interface NotificationSettings {
  rules: NotificationRule[];
  globalEmail: string;
  digestEnabled: boolean;
  digestCron: string;
}

export interface AppearanceSettings {
  theme: "auto" | "light" | "dark";
  density: "comfortable" | "compact" | "spacious";
  defaultLandingTab: string;
  showMetricsOnSidebar: boolean;
  accentColor: string;
}

export interface GeneralSettings {
  name: string;
  description: string;
  tags: string[];
  riskProfile: "low" | "medium" | "high" | "critical";
  defaultTestTypes: ("ui" | "api" | "e2e" | "regression")[];
  ownerEmail: string;
  externalId: string;
}

export interface ProjectSettings {
  version: number;
  updatedAt: string;
  general: GeneralSettings;
  environments: EnvironmentConfig[];
  scanning: ScanSettings;
  testing: TestExecutionSettings;
  ai: AIPolicySettings;
  integrations: IntegrationSettings;
  access: AccessControlSettings;
  data: DataRetentionSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
}

// ─── Labels & metadata ───────────────────────────────────────────────────────

export const ROLE_LABEL: Record<AccessRole["role"], string> = {
  "org-admin": "Org Admin",
  "project-admin": "Project Admin",
  "qa-lead": "QA Lead",
  "developer": "Developer",
  "viewer": "Viewer",
};

export const ROLE_COLOR: Record<AccessRole["role"], string> = {
  "org-admin": "#B71C1C",
  "project-admin": "#EF5350",
  "qa-lead": "#7B2FF7",
  "developer": "#448AFF",
  "viewer": "#78909C",
};

export const RISK_COLOR: Record<GeneralSettings["riskProfile"], string> = {
  low: "#66BB6A",
  medium: "#FFA726",
  high: "#EF5350",
  critical: "#B71C1C",
};

export const ENV_TYPE_COLOR: Record<EnvironmentConfig["type"], string> = {
  dev: "#448AFF",
  staging: "#FFA726",
  prod: "#EF5350",
  custom: "#9C27B0",
};

export const NOTIFICATION_EVENTS = [
  { value: "scan-completed", label: "Scan Completed" },
  { value: "tests-executed", label: "Tests Executed" },
  { value: "tests-generated", label: "Tests Generated" },
  { value: "auto-heal-applied", label: "Auto-Heal Applied" },
  { value: "risk-spike", label: "Risk Spike" },
  { value: "coverage-milestone", label: "Coverage Milestone" },
  { value: "incident-detected", label: "Incident Detected" },
];

// ─── API functions ────────────────────────────────────────────────────────────

export async function fetchSettings(projectId: string): Promise<ProjectSettings> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/settings`);
  return res.json();
}

export async function patchSettings(projectId: string, patch: Partial<ProjectSettings>): Promise<ProjectSettings> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function addEnvironment(projectId: string, env: Partial<EnvironmentConfig>): Promise<EnvironmentConfig> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/settings/environments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(env),
  });
  return res.json();
}

export async function updateEnvironment(projectId: string, envId: string, patch: Partial<EnvironmentConfig>): Promise<EnvironmentConfig> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/settings/environments/${envId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function deleteEnvironment(projectId: string, envId: string): Promise<void> {
  await fetch(`${API_BASE}/projects/${projectId}/settings/environments/${envId}`, { method: "DELETE" });
}

export async function addWebhook(projectId: string, wh: any) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/settings/integrations/webhooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(wh),
  });
  return res.json();
}

export async function deleteWebhook(projectId: string, whId: string) {
  await fetch(`${API_BASE}/projects/${projectId}/settings/integrations/webhooks/${whId}`, { method: "DELETE" });
}

export async function addRole(projectId: string, role: Partial<AccessRole>) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/settings/access/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(role),
  });
  return res.json();
}

export async function updateRole(projectId: string, roleId: string, patch: Partial<AccessRole>) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/settings/access/roles/${roleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function deleteRole(projectId: string, roleId: string) {
  await fetch(`${API_BASE}/projects/${projectId}/settings/access/roles/${roleId}`, { method: "DELETE" });
}
