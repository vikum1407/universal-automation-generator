// ─── Types ────────────────────────────────────────────────────────────────────

export type CompatibilityStatus = 'supported' | 'partial' | 'unsupported';

export interface CompatibilityRule {
  framework: string;
  language: string;
  status: CompatibilityStatus;
  reason: string;
  alternativeLanguages?: string[];
}

export type FrameworkLanguageMatrix = Record<string, Record<string, CompatibilityStatus>>;

// ─── Full compatibility matrix ────────────────────────────────────────────────
// This is the single source of truth for what combinations are valid.
// Adding a new framework requires only a new entry here — no logic changes.

export const COMPATIBILITY_MATRIX: FrameworkLanguageMatrix = {
  selenium: {
    java:       'supported',
    python:     'supported',
    csharp:     'supported',
    typescript: 'supported',
    javascript: 'partial',
  },
  cypress: {
    typescript: 'supported',
    javascript: 'partial',
    java:       'unsupported',
    python:     'unsupported',
    csharp:     'unsupported',
  },
  playwright: {
    typescript: 'supported',
    javascript: 'partial',
    python:     'supported',
    java:       'supported',
    csharp:     'supported',
  },
  webdriverio: {
    typescript: 'supported',
    javascript: 'partial',
    java:       'unsupported',
    python:     'unsupported',
    csharp:     'unsupported',
  },
  appium: {
    java:       'supported',
    python:     'supported',
    csharp:     'supported',
    typescript: 'supported',
    javascript: 'partial',
  },
  restassured: {
    java:       'supported',
    python:     'unsupported',
    csharp:     'unsupported',
    typescript: 'unsupported',
    javascript: 'unsupported',
  },
};

// ─── Explicit violation rules (for descriptive error messages) ────────────────

export const VIOLATION_RULES: CompatibilityRule[] = [
  {
    framework: 'cypress',
    language: 'java',
    status: 'unsupported',
    reason:
      'Cypress is a JavaScript-native framework and cannot run Java tests. ' +
      'Cypress executes directly in the browser via a Node.js process.',
    alternativeLanguages: ['typescript', 'javascript'],
  },
  {
    framework: 'cypress',
    language: 'python',
    status: 'unsupported',
    reason: 'Cypress does not support Python. It requires TypeScript or JavaScript.',
    alternativeLanguages: ['typescript', 'javascript'],
  },
  {
    framework: 'cypress',
    language: 'csharp',
    status: 'unsupported',
    reason: 'Cypress does not support C#. It requires TypeScript or JavaScript.',
    alternativeLanguages: ['typescript', 'javascript'],
  },
  {
    framework: 'webdriverio',
    language: 'java',
    status: 'unsupported',
    reason: 'WebdriverIO is a Node.js framework and cannot run Java tests.',
    alternativeLanguages: ['typescript', 'javascript'],
  },
  {
    framework: 'webdriverio',
    language: 'python',
    status: 'unsupported',
    reason: 'WebdriverIO does not support Python. It requires TypeScript or JavaScript.',
    alternativeLanguages: ['typescript', 'javascript'],
  },
  {
    framework: 'webdriverio',
    language: 'csharp',
    status: 'unsupported',
    reason: 'WebdriverIO does not support C#. It requires TypeScript or JavaScript.',
    alternativeLanguages: ['typescript', 'javascript'],
  },
  {
    framework: 'cypress',
    language: 'javascript',
    status: 'partial',
    reason:
      'Cypress supports JavaScript but TypeScript is strongly recommended for type safety and IDE support.',
    alternativeLanguages: ['typescript'],
  },
  {
    framework: 'playwright',
    language: 'javascript',
    status: 'partial',
    reason:
      'Playwright supports JavaScript but TypeScript is strongly recommended for full type inference.',
    alternativeLanguages: ['typescript'],
  },
  {
    framework: 'selenium',
    language: 'javascript',
    status: 'partial',
    reason:
      'Selenium supports JavaScript via WebDriver.js, but the ecosystem is weaker. TypeScript or Java is recommended.',
    alternativeLanguages: ['typescript', 'java'],
  },
];

// ─── Query functions ──────────────────────────────────────────────────────────

export function getCompatibilityStatus(framework: string, language: string): CompatibilityStatus {
  return COMPATIBILITY_MATRIX[framework]?.[language] ?? 'unsupported';
}

export function getViolationRule(
  framework: string,
  language: string,
): CompatibilityRule | null {
  return (
    VIOLATION_RULES.find(r => r.framework === framework && r.language === language) ?? null
  );
}

export function getSupportedFrameworks(): string[] {
  return Object.keys(COMPATIBILITY_MATRIX);
}

export function getSupportedLanguages(framework: string): string[] {
  const matrix = COMPATIBILITY_MATRIX[framework];
  if (!matrix) return [];
  return Object.entries(matrix)
    .filter(([, s]) => s === 'supported' || s === 'partial')
    .map(([lang]) => lang);
}

export function getFullySupportedLanguages(framework: string): string[] {
  const matrix = COMPATIBILITY_MATRIX[framework];
  if (!matrix) return [];
  return Object.entries(matrix)
    .filter(([, s]) => s === 'supported')
    .map(([lang]) => lang);
}
