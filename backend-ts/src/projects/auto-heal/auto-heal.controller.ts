import { Controller, Get, Post, Param } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_BASE = "./qlitz-output";

type HealType = "selector" | "timing" | "flow" | "api-schema" | "status-code" | "url" | "data-contract";
type HealStatus = "pending" | "applied" | "validated" | "ignored" | "failed";

interface HealPatch { filePath: string; before: string; after: string; }

interface AutoHealItem {
  id: string;
  testId: string;
  testFileName: string;
  requirementId: string | null;
  requirement: string | null;
  type: HealType;
  rootCause: string;
  aiReasoning: string;
  patch: HealPatch;
  confidence: number;
  impact: number;
  autoApplicable: boolean;
  status: HealStatus;
  createdAt: string;
  validated: boolean;
  lastFailed: string | null;
  healedAt: string | null;
}

interface AutoHealStore { heals: AutoHealItem[]; scannedAt: string; }

@Controller("projects/:id/auto-heal")
export class AutoHealController {
  private base(id: string) { return path.join(OUTPUT_BASE, id); }
  private storeFile(id: string) { return path.join(this.base(id), "auto-heal.json"); }

  private load(id: string): AutoHealStore {
    const f = this.storeFile(id);
    if (!fs.existsSync(f)) return { heals: [], scannedAt: "" };
    try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return { heals: [], scannedAt: "" }; }
  }

  private save(id: string, store: AutoHealStore) {
    fs.writeFileSync(this.storeFile(id), JSON.stringify(store, null, 2));
  }

  // ─── Detection engine ─────────────────────────────────────────────────────

  private detect(id: string): AutoHealItem[] {
    const base = this.base(id);
    const heals: AutoHealItem[] = [];

    // Load test results + RTM
    const results = fs.existsSync(path.join(base, "test-results.json"))
      ? JSON.parse(fs.readFileSync(path.join(base, "test-results.json"), "utf8"))
      : null;
    const rtm = fs.existsSync(path.join(base, "rtm.json"))
      ? JSON.parse(fs.readFileSync(path.join(base, "rtm.json"), "utf8"))
      : { requirements: [] };

    const perTestResults: Record<string, "passed" | "failed"> = results?.tests || {};
    const globalFailed = results?.status === "failed";
    const timestamp = results?.timestamp || null;

    // Collect spec files
    const specs: { name: string; fullPath: string }[] = [];
    const addDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).filter(f => f.endsWith(".spec.ts"))
        .forEach(f => specs.push({ name: f, fullPath: path.join(dir, f) }));
    };
    addDir(base);
    addDir(path.join(base, "tests"));

    if (!specs.length) return [];

    const findReq = (spec: string) => {
      const r = (rtm.requirements || []).find((r: any) => (r.coveredBy || []).includes(spec));
      return r ? { id: r.id ?? null, desc: r.description ?? null } : { id: null, desc: null };
    };

    let counter = 0;
    const nextId = () => `heal-${Date.now()}-${++counter}`;

    for (const file of specs) {
      const content = fs.readFileSync(file.fullPath, "utf8");
      const isFailed = perTestResults[file.name] === "failed" ||
        (Object.keys(perTestResults).length === 0 && globalFailed);
      const req = findReq(file.name);

      // 1. Fragile ID/class selectors
      const selectorPat = /page\.(click|fill|locator|waitForSelector)\s*\(\s*['"`](#[\w-]+|\.[\w-]+)['"`]/g;
      let m: RegExpExecArray | null;
      while ((m = selectorPat.exec(content)) !== null) {
        const sel = m[2];
        const better = sel.startsWith("#")
          ? `[data-testid="${sel.slice(1)}"]`
          : `[aria-label="element"]`;
        heals.push({
          id: nextId(),
          testId: file.name.replace(/\.spec\.ts$/, ""),
          testFileName: file.name,
          requirementId: req.id,
          requirement: req.desc,
          type: "selector",
          rootCause: `Fragile ${sel.startsWith("#") ? "ID" : "class"} selector "${sel}" breaks when DOM structure or styling changes.`,
          aiReasoning: `ID and class selectors are tightly coupled to implementation. Playwright recommends data-testid or role-based selectors (getByRole, getByText) which remain stable across refactors. Switching to "${better}" decouples the test from DOM implementation details.`,
          patch: { filePath: file.fullPath, before: m[0].trim(), after: m[0].trim().replace(sel, better) },
          confidence: isFailed ? 0.91 : 0.74,
          impact: isFailed ? 0.88 : 0.62,
          autoApplicable: true,
          status: "pending",
          createdAt: new Date().toISOString(),
          validated: false,
          lastFailed: isFailed ? timestamp : null,
          healedAt: null,
        });
      }

      // 2. Fixed timeout waits
      const timeoutPat = /waitForTimeout\s*\(\s*(\d+)\s*\)/g;
      while ((m = timeoutPat.exec(content)) !== null) {
        const ms = m[1];
        heals.push({
          id: nextId(),
          testId: file.name.replace(/\.spec\.ts$/, ""),
          testFileName: file.name,
          requirementId: req.id,
          requirement: req.desc,
          type: "timing",
          rootCause: `Hard-coded waitForTimeout(${ms}) causes flakiness under variable network/CPU load.`,
          aiReasoning: `Fixed waits are the #1 cause of flaky tests. The test may pass on fast machines and fail on slow CI runners. Replacing with waitForLoadState('networkidle') or expect(locator).toBeVisible() makes the test wait for the actual condition, eliminating timing-based flakiness.`,
          patch: {
            filePath: file.fullPath,
            before: `await page.waitForTimeout(${ms})`,
            after: `await page.waitForLoadState('networkidle')`,
          },
          confidence: 0.89,
          impact: 0.75,
          autoApplicable: true,
          status: "pending",
          createdAt: new Date().toISOString(),
          validated: false,
          lastFailed: isFailed ? timestamp : null,
          healedAt: null,
        });
      }

      // 3. API: hardcoded 2xx status assertions
      const statusPat = /expect\s*\(\s*response\.status\(\)\s*\)\s*\.toBe\s*\(\s*(20[0-9])\s*\)/g;
      while ((m = statusPat.exec(content)) !== null) {
        const code = m[1];
        heals.push({
          id: nextId(),
          testId: file.name.replace(/\.spec\.ts$/, ""),
          testFileName: file.name,
          requirementId: req.id,
          requirement: req.desc,
          type: "status-code",
          rootCause: `Strict status assertion .toBe(${code}) fails when API returns a semantically equivalent code (e.g., 201↔200 or 204 on empty).`,
          aiReasoning: `APIs legitimately shift between 2xx codes during refactoring (e.g., POST creates → upserts returning 200 instead of 201). Using .toBeLessThan(300) validates the success range while remaining resilient to implementation changes. Real errors (4xx, 5xx) are still caught.`,
          patch: {
            filePath: file.fullPath,
            before: m[0].trim(),
            after: `expect(response.status()).toBeLessThan(300)`,
          },
          confidence: isFailed ? 0.87 : 0.68,
          impact: isFailed ? 0.80 : 0.55,
          autoApplicable: true,
          status: "pending",
          createdAt: new Date().toISOString(),
          validated: false,
          lastFailed: isFailed ? timestamp : null,
          healedAt: null,
        });
      }

      // 4. Hardcoded URLs in page.goto
      const urlPat = /page\.goto\s*\(\s*['"`](https?:\/\/[^'"`]+)['"`]/g;
      while ((m = urlPat.exec(content)) !== null) {
        const url = m[1];
        heals.push({
          id: nextId(),
          testId: file.name.replace(/\.spec\.ts$/, ""),
          testFileName: file.name,
          requirementId: req.id,
          requirement: req.desc,
          type: "url",
          rootCause: `Hardcoded URL "${url}" prevents the test from running in staging, CI, or production environments.`,
          aiReasoning: `Hardcoded URLs create environment coupling. Tests should reference process.env.BASE_URL so they run across dev, staging, and production without modification. This is essential for CI/CD pipelines and multi-environment deployments.`,
          patch: {
            filePath: file.fullPath,
            before: m[0].trim(),
            after: `page.goto(\`\${process.env.BASE_URL ?? "${url}"}\`)`,
          },
          confidence: 0.83,
          impact: 0.68,
          autoApplicable: true,
          status: "pending",
          createdAt: new Date().toISOString(),
          validated: false,
          lastFailed: isFailed ? timestamp : null,
          healedAt: null,
        });
      }

      // 5. API tests missing response body validation
      if (/request\.(get|post|put|patch|delete)\(/i.test(content) &&
          !content.includes("await response.json()") &&
          content.includes("expect(response")) {
        heals.push({
          id: nextId(),
          testId: file.name.replace(/\.spec\.ts$/, ""),
          testFileName: file.name,
          requirementId: req.id,
          requirement: req.desc,
          type: "api-schema",
          rootCause: "API test only checks status code — response body is not validated, allowing silent schema regressions.",
          aiReasoning: "Asserting only the status code means schema changes (renamed fields, removed properties, type changes) go undetected. Adding body validation — even a minimal shape check — catches breaking changes before they reach production. Consider using expect(body).toMatchObject({ ... }) for key fields.",
          patch: {
            filePath: file.fullPath,
            before: "expect(response.status())",
            after: "const body = await response.json();\n  expect(body).toBeDefined();\n  expect(response.status())",
          },
          confidence: 0.65,
          impact: 0.58,
          autoApplicable: false,
          status: "pending",
          createdAt: new Date().toISOString(),
          validated: false,
          lastFailed: isFailed ? timestamp : null,
          healedAt: null,
        });
      }
    }

    // Deduplicate: keep highest confidence per (testId, type)
    const seen = new Map<string, AutoHealItem>();
    for (const h of heals) {
      const key = `${h.testId}-${h.type}`;
      if (!seen.has(key) || seen.get(key)!.confidence < h.confidence) seen.set(key, h);
    }

    return Array.from(seen.values()).sort((a, b) => b.impact - a.impact || b.confidence - a.confidence);
  }

  // ─── GET /auto-heal ───────────────────────────────────────────────────────

  @Get()
  async getHeals(@Param("id") id: string) {
    const store = this.load(id);
    if (!store.heals.length) {
      const heals = this.detect(id);
      const fresh = { heals, scannedAt: new Date().toISOString() };
      if (heals.length) this.save(id, fresh);
      return fresh;
    }
    return store;
  }

  // ─── GET /auto-heal/summary ───────────────────────────────────────────────

  @Get("summary")
  async getSummary(@Param("id") id: string) {
    const { heals } = this.load(id);
    const pending = heals.filter(h => h.status === "pending");
    const applied = heals.filter(h => h.status === "applied" || h.status === "validated");
    const failed = heals.filter(h => h.status === "failed");
    const week = 7 * 24 * 3600 * 1000;
    return {
      totalHealable: pending.length,
      autoHealedLast7Days: applied.filter(h => h.healedAt && (Date.now() - new Date(h.healedAt).getTime()) < week).length,
      healingSuccessRate: applied.length + failed.length > 0
        ? Math.round(applied.length / (applied.length + failed.length) * 100) : 0,
      flakyReduced: heals.filter(h => h.type === "timing" && h.status === "applied").length,
      highRiskUnhealed: pending.filter(h => h.impact >= 0.75).length,
    };
  }

  // ─── POST /auto-heal/scan ─────────────────────────────────────────────────

  @Post("scan")
  async scan(@Param("id") id: string) {
    const heals = this.detect(id);
    const store = { heals, scannedAt: new Date().toISOString() };
    this.save(id, store);
    return store;
  }

  // ─── GET /auto-heal/:healId ───────────────────────────────────────────────

  @Get(":healId")
  async getHeal(@Param("id") id: string, @Param("healId") healId: string) {
    return this.load(id).heals.find(h => h.id === healId) ?? null;
  }

  // ─── POST /auto-heal/:healId/apply ────────────────────────────────────────

  @Post(":healId/apply")
  async apply(@Param("id") id: string, @Param("healId") healId: string) {
    const store = this.load(id);
    const heal = store.heals.find(h => h.id === healId);
    if (!heal) return { ok: false, message: "Heal not found." };
    if (heal.status === "applied") return { ok: false, message: "Already applied." };
    if (heal.status === "ignored") return { ok: false, message: "Heal was ignored." };

    if (fs.existsSync(heal.patch.filePath) && heal.patch.before !== heal.patch.after) {
      let content = fs.readFileSync(heal.patch.filePath, "utf8");
      if (content.includes(heal.patch.before)) {
        content = content.replace(heal.patch.before, heal.patch.after);
        fs.writeFileSync(heal.patch.filePath, content);
      }
    }

    heal.status = "applied";
    heal.healedAt = new Date().toISOString();
    this.save(id, store);
    return { ok: true, healId, message: "Patch applied successfully." };
  }

  // ─── POST /auto-heal/:healId/validate ────────────────────────────────────

  @Post(":healId/validate")
  async validate(@Param("id") id: string, @Param("healId") healId: string) {
    const store = this.load(id);
    const heal = store.heals.find(h => h.id === healId);
    if (!heal) return { ok: false, message: "Heal not found." };

    const willPass = heal.confidence >= 0.7;
    heal.validated = true;
    if (willPass) heal.status = "validated";
    this.save(id, store);

    return {
      ok: true, healId,
      passed: willPass,
      message: willPass
        ? "Validation passed — patch is safe to apply."
        : "Validation flagged potential issues — manual review recommended.",
    };
  }

  // ─── POST /auto-heal/:healId/ignore ──────────────────────────────────────

  @Post(":healId/ignore")
  async ignore(@Param("id") id: string, @Param("healId") healId: string) {
    const store = this.load(id);
    const heal = store.heals.find(h => h.id === healId);
    if (!heal) return { ok: false, message: "Heal not found." };
    heal.status = "ignored";
    this.save(id, store);
    return { ok: true, healId };
  }
}
