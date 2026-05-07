export type SupportedFramework = 'playwright' | 'selenium' | 'cypress' | 'restassured' | 'appium' | 'webdriverio';
export type SupportedLanguage  = 'typescript' | 'javascript' | 'java' | 'python' | 'csharp';

export interface FrameworkTestLocation {
  testRootDir:   string;
  uiTestDir:     string;
  apiTestDir:    string;
  hybridTestDir: string;
  ext:           string;   // file extension: .spec.ts, .java, .py, etc.
  packageName?:  string;   // Java package
}

const LOCATIONS: Record<string, Record<string, FrameworkTestLocation>> = {
  playwright: {
    typescript: {
      testRootDir:   'tests/rtm',
      uiTestDir:     'tests/rtm/ui',
      apiTestDir:    'tests/rtm/api',
      hybridTestDir: 'tests/rtm/hybrid',
      ext:           '.spec.ts',
    },
    javascript: {
      testRootDir:   'tests/rtm',
      uiTestDir:     'tests/rtm/ui',
      apiTestDir:    'tests/rtm/api',
      hybridTestDir: 'tests/rtm/hybrid',
      ext:           '.spec.js',
    },
  },
  cypress: {
    typescript: {
      testRootDir:   'cypress/e2e/rtm',
      uiTestDir:     'cypress/e2e/rtm/ui',
      apiTestDir:    'cypress/e2e/rtm/api',
      hybridTestDir: 'cypress/e2e/rtm/hybrid',
      ext:           '.cy.ts',
    },
    javascript: {
      testRootDir:   'cypress/e2e/rtm',
      uiTestDir:     'cypress/e2e/rtm/ui',
      apiTestDir:    'cypress/e2e/rtm/api',
      hybridTestDir: 'cypress/e2e/rtm/hybrid',
      ext:           '.cy.js',
    },
  },
  selenium: {
    java: {
      testRootDir:   'src/test/java/rtm',
      uiTestDir:     'src/test/java/rtm/ui',
      apiTestDir:    'src/test/java/rtm/api',
      hybridTestDir: 'src/test/java/rtm/hybrid',
      ext:           '.java',
      packageName:   'rtm',
    },
    python: {
      testRootDir:   'tests/rtm',
      uiTestDir:     'tests/rtm/ui',
      apiTestDir:    'tests/rtm/api',
      hybridTestDir: 'tests/rtm/hybrid',
      ext:           '.py',
    },
    typescript: {
      testRootDir:   'tests/rtm',
      uiTestDir:     'tests/rtm/ui',
      apiTestDir:    'tests/rtm/api',
      hybridTestDir: 'tests/rtm/hybrid',
      ext:           '.spec.ts',
    },
  },
  restassured: {
    java: {
      testRootDir:   'src/test/java/rtm',
      uiTestDir:     'src/test/java/rtm/ui',
      apiTestDir:    'src/test/java/rtm/api',
      hybridTestDir: 'src/test/java/rtm/hybrid',
      ext:           '.java',
      packageName:   'rtm.api',
    },
  },
  appium: {
    java: {
      testRootDir:   'src/test/java/rtm',
      uiTestDir:     'src/test/java/rtm/mobile',
      apiTestDir:    'src/test/java/rtm/api',
      hybridTestDir: 'src/test/java/rtm/hybrid',
      ext:           '.java',
      packageName:   'rtm.mobile',
    },
  },
  webdriverio: {
    typescript: {
      testRootDir:   'test/rtm',
      uiTestDir:     'test/rtm/ui',
      apiTestDir:    'test/rtm/api',
      hybridTestDir: 'test/rtm/hybrid',
      ext:           '.spec.ts',
    },
  },
};

export function getFrameworkTestLocation(
  framework: string,
  language: string,
): FrameworkTestLocation {
  const loc = LOCATIONS[framework]?.[language];
  if (loc) return loc;
  // Default fallback: Playwright TS style
  return {
    testRootDir:   'tests/rtm',
    uiTestDir:     'tests/rtm/ui',
    apiTestDir:    'tests/rtm/api',
    hybridTestDir: 'tests/rtm/hybrid',
    ext:           '.spec.ts',
  };
}

// Derive a safe filename from a requirement key/title
export function toSafeFileName(key: string, title: string, suffix = ''): string {
  const base = (key + (title ? `-${title}` : ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base}${suffix}`;
}
