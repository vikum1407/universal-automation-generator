import {
  Controller, Get, Patch, Post, Delete,
  Param, Body, HttpCode
} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuid } from "uuid";

const OUTPUT_BASE = "./qlitz-output";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EnvironmentConfig {
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

interface ScanSettings {
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

interface TestExecutionSettings {
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

interface AIPolicySettings {
  enableSuggestions: boolean;
  enableAutoHeal: boolean;
  enableTestGeneration: boolean;
  enableRequirementRewrite: boolean;
  autoApplyPolicy: "manual" | "low-risk" | "aggressive";
  healConfidenceThreshold: number;
  dataUsageConsent: boolean;
  includeInTraining: boolean;
}

interface IntegrationSettings {
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

interface AccessRole {
  id: string;
  email: string;
  name: string;
  role: "org-admin" | "project-admin" | "qa-lead" | "developer" | "viewer";
  addedAt: string;
}

interface AccessControlSettings {
  roles: AccessRole[];
  allowSelfAssign: boolean;
  requireApprovalForAI: boolean;
}

interface DataRetentionSettings {
  runsRetentionDays: number;
  artifactsRetentionDays: number;
  historyRetentionDays: number;
  timelineRetentionDays: number;
  piiHandling: "none" | "redact" | "hash";
  redactionRules: string[];
  autoDeleteOnRetentionExpiry: boolean;
}

interface NotificationRule {
  id: string;
  eventType: string;
  condition: "always" | "on-failure" | "on-threshold";
  threshold?: number;
  channels: ("email" | "slack" | "teams" | "webhook")[];
  recipients: string[];
  enabled: boolean;
}

interface NotificationSettings {
  rules: NotificationRule[];
  globalEmail: string;
  digestEnabled: boolean;
  digestCron: string;
}

interface AppearanceSettings {
  theme: "auto" | "light" | "dark";
  density: "comfortable" | "compact" | "spacious";
  defaultLandingTab: string;
  showMetricsOnSidebar: boolean;
  accentColor: string;
}

interface GeneralSettings {
  name: string;
  description: string;
  tags: string[];
  riskProfile: "low" | "medium" | "high" | "critical";
  defaultTestTypes: ("ui" | "api" | "e2e" | "regression")[];
  ownerEmail: string;
  externalId: string;
}

interface ProjectSettings {
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

// ─── Defaults ────────────────────────────────────────────────────────────────

function defaultSettings(): ProjectSettings {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    general: {
      name: "",
      description: "",
      tags: [],
      riskProfile: "medium",
      defaultTestTypes: ["ui"],
      ownerEmail: "",
      externalId: "",
    },
    environments: [
      {
        id: uuid(),
        name: "Development",
        type: "dev",
        url: "http://localhost:3000",
        auth: { type: "none" },
        variables: [],
        isDefault: true,
      },
    ],
    scanning: {
      ui: {
        maxDepth: 4,
        maxPages: 100,
        allowedDomains: [],
        excludedPaths: ["/logout", "/admin/delete"],
        clickableElements: true,
        waitForNetwork: true,
      },
      api: {
        swaggerUrls: [],
        excludedEndpoints: [],
        includeDeprecated: false,
        followRedirects: true,
      },
      pipeline: {
        autoGenerateTests: true,
        autoUpdateRTM: true,
        scheduleCron: "",
        notifyOnCompletion: false,
      },
    },
    testing: {
      concurrency: 4,
      retries: 2,
      timeoutMs: 30000,
      captureScreenshots: true,
      captureVideo: false,
      defaultBrowser: "chromium",
      headless: true,
      testSelectionStrategy: "all",
      slowMoMs: 0,
      parallelWorkers: 2,
    },
    ai: {
      enableSuggestions: true,
      enableAutoHeal: true,
      enableTestGeneration: true,
      enableRequirementRewrite: true,
      autoApplyPolicy: "manual",
      healConfidenceThreshold: 85,
      dataUsageConsent: false,
      includeInTraining: false,
    },
    integrations: {
      jira: { enabled: false, host: "", projectKey: "", token: "", createIssueOnFailure: false, linkRTMRequirements: true },
      github: { enabled: false, owner: "", repo: "", token: "", createPROnGenerate: false, statusChecks: false },
      slack: { enabled: false, webhookUrl: "", channel: "#qa-alerts", notifyOnFailure: true, notifyOnHeal: false },
      teams: { enabled: false, webhookUrl: "" },
      webhooks: [],
    },
    access: {
      roles: [],
      allowSelfAssign: false,
      requireApprovalForAI: false,
    },
    data: {
      runsRetentionDays: 90,
      artifactsRetentionDays: 30,
      historyRetentionDays: 365,
      timelineRetentionDays: 365,
      piiHandling: "none",
      redactionRules: [],
      autoDeleteOnRetentionExpiry: false,
    },
    notifications: {
      rules: [
        {
          id: uuid(),
          eventType: "tests-executed",
          condition: "on-failure",
          channels: ["email"],
          recipients: [],
          enabled: false,
        },
        {
          id: uuid(),
          eventType: "risk-spike",
          condition: "always",
          channels: ["email"],
          recipients: [],
          enabled: false,
        },
      ],
      globalEmail: "",
      digestEnabled: false,
      digestCron: "0 9 * * 1",
    },
    appearance: {
      theme: "auto",
      density: "comfortable",
      defaultLandingTab: "overview",
      showMetricsOnSidebar: true,
      accentColor: "#7B2FF7",
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deepMerge(target: any, source: any): any {
  if (Array.isArray(source)) return source;
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const out = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        target?.[key] &&
        typeof target[key] === "object"
      ) {
        out[key] = deepMerge(target[key], source[key]);
      } else {
        out[key] = source[key];
      }
    }
    return out;
  }
  return source;
}

// ─── Controller ──────────────────────────────────────────────────────────────

@Controller("projects/:id/settings")
export class SettingsController {

  private settingsPath(id: string) {
    return path.join(OUTPUT_BASE, id, "settings.json");
  }

  private readSettings(id: string): ProjectSettings {
    const p = this.settingsPath(id);
    try {
      if (fs.existsSync(p)) {
        const stored = JSON.parse(fs.readFileSync(p, "utf8"));
        return deepMerge(defaultSettings(), stored);
      }
    } catch { /* ignore */ }
    return defaultSettings();
  }

  private writeSettings(id: string, s: ProjectSettings) {
    const dir = path.join(OUTPUT_BASE, id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    s.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.settingsPath(id), JSON.stringify(s, null, 2), "utf8");
  }

  // ── GET /projects/:id/settings ─────────────────────────────────────────────

  @Get()
  getSettings(@Param("id") id: string) {
    return this.readSettings(id);
  }

  // ── PATCH /projects/:id/settings ──────────────────────────────────────────

  @Patch()
  @HttpCode(200)
  patchSettings(@Param("id") id: string, @Body() body: any) {
    const current = this.readSettings(id);
    const updated = deepMerge(current, body) as ProjectSettings;
    this.writeSettings(id, updated);
    return updated;
  }

  // ── GET /projects/:id/settings/environments ───────────────────────────────

  @Get("environments")
  getEnvironments(@Param("id") id: string) {
    return this.readSettings(id).environments;
  }

  // ── POST /projects/:id/settings/environments ──────────────────────────────

  @Post("environments")
  @HttpCode(201)
  addEnvironment(@Param("id") id: string, @Body() body: any) {
    const s = this.readSettings(id);
    const env: EnvironmentConfig = {
      id: uuid(),
      name: body.name ?? "New Environment",
      type: body.type ?? "dev",
      url: body.url ?? "",
      auth: body.auth ?? { type: "none" },
      variables: body.variables ?? [],
      isDefault: false,
    };
    s.environments.push(env);
    this.writeSettings(id, s);
    return env;
  }

  // ── PATCH /projects/:id/settings/environments/:envId ──────────────────────

  @Patch("environments/:envId")
  @HttpCode(200)
  updateEnvironment(
    @Param("id") id: string,
    @Param("envId") envId: string,
    @Body() body: any,
  ) {
    const s = this.readSettings(id);
    const idx = s.environments.findIndex(e => e.id === envId);
    if (idx === -1) return { error: "not found" };
    s.environments[idx] = { ...s.environments[idx], ...body, id: envId };
    this.writeSettings(id, s);
    return s.environments[idx];
  }

  // ── DELETE /projects/:id/settings/environments/:envId ─────────────────────

  @Delete("environments/:envId")
  @HttpCode(200)
  deleteEnvironment(
    @Param("id") id: string,
    @Param("envId") envId: string,
  ) {
    const s = this.readSettings(id);
    s.environments = s.environments.filter(e => e.id !== envId);
    this.writeSettings(id, s);
    return { ok: true };
  }

  // ── POST /projects/:id/settings/integrations/webhooks ─────────────────────

  @Post("integrations/webhooks")
  @HttpCode(201)
  addWebhook(@Param("id") id: string, @Body() body: any) {
    const s = this.readSettings(id);
    const wh = {
      id: uuid(),
      name: body.name ?? "Webhook",
      url: body.url ?? "",
      events: body.events ?? [],
      secret: body.secret ?? "",
      enabled: true,
    };
    s.integrations.webhooks.push(wh);
    this.writeSettings(id, s);
    return wh;
  }

  // ── DELETE /projects/:id/settings/integrations/webhooks/:whId ─────────────

  @Delete("integrations/webhooks/:whId")
  @HttpCode(200)
  deleteWebhook(@Param("id") id: string, @Param("whId") whId: string) {
    const s = this.readSettings(id);
    s.integrations.webhooks = s.integrations.webhooks.filter(w => w.id !== whId);
    this.writeSettings(id, s);
    return { ok: true };
  }

  // ── POST /projects/:id/settings/access/roles ──────────────────────────────

  @Post("access/roles")
  @HttpCode(201)
  addRole(@Param("id") id: string, @Body() body: any) {
    const s = this.readSettings(id);
    const role: AccessRole = {
      id: uuid(),
      email: body.email ?? "",
      name: body.name ?? body.email ?? "",
      role: body.role ?? "developer",
      addedAt: new Date().toISOString(),
    };
    s.access.roles.push(role);
    this.writeSettings(id, s);
    return role;
  }

  // ── PATCH /projects/:id/settings/access/roles/:roleId ─────────────────────

  @Patch("access/roles/:roleId")
  @HttpCode(200)
  updateRole(
    @Param("id") id: string,
    @Param("roleId") roleId: string,
    @Body() body: any,
  ) {
    const s = this.readSettings(id);
    const idx = s.access.roles.findIndex(r => r.id === roleId);
    if (idx === -1) return { error: "not found" };
    s.access.roles[idx] = { ...s.access.roles[idx], ...body, id: roleId };
    this.writeSettings(id, s);
    return s.access.roles[idx];
  }

  // ── DELETE /projects/:id/settings/access/roles/:roleId ────────────────────

  @Delete("access/roles/:roleId")
  @HttpCode(200)
  deleteRole(@Param("id") id: string, @Param("roleId") roleId: string) {
    const s = this.readSettings(id);
    s.access.roles = s.access.roles.filter(r => r.id !== roleId);
    this.writeSettings(id, s);
    return { ok: true };
  }
}
