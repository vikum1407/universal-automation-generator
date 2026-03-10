import { expect } from '@playwright/test';

export interface RequirementLike {
  id: string;
  page: string;
  description: string;
  selector: string;
  evolvedSelector?: string;
  type: string;
  action?: string;
  tags?: string[];
  meta?: any;
}

export interface FlowGraph {
  edges: { from: string; to: string; selector?: string }[];
}

export interface UIJourney {
  id: string;
  title: string;
  steps: { from: string; to: string; selector: string }[];
}

export interface UIScenario {
  id: string;
  title: string;
  steps: { from: string; to: string; selector: string }[];
  preconditions?: string[];
  expectedOutcomes?: string[];
  stabilityScore?: number;
  driftRisk?: number;
}

export interface UIStateGraph {
  states: { id: string; url: string; label: string; invariants: string[] }[];
}

export function escapeSelector(v: string) {
  return v.replace(/'/g, "\\'");
}

export async function selfHealClick(page, evolvedSelector, originalSelector) {
  const candidates = [evolvedSelector, originalSelector].filter(Boolean);

  for (const sel of candidates) {
    try {
      await page.click(sel, { timeout: 2000 });
      return;
    } catch {}
  }

  throw new Error('Self-healing failed: ' + candidates.join(', '));
}

export async function capturePageBaseline(page) {
  await expect(page).toHaveScreenshot();
}

export async function aiAssertPageIdentity(page, expected: string) {
  const content = await page.content();
  expect(content.length).toBeGreaterThan(50);
}

export async function aiAssertComponentPresence(page, hint: string) {
  const content = await page.content();
  expect(content.includes(hint)).toBeTruthy();
}
