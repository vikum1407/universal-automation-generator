# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings.spec.ts >> Settings page shows all feature blocks
- Location: src\ui-tests\settings.spec.ts:4:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Self-?Updating Selectors/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Self-?Updating Selectors/i })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - button "☰" [ref=e6] [cursor=pointer]
      - generic [ref=e7]: Qlitz Dashboard
    - textbox "Search…" [ref=e9]
    - generic [ref=e10]:
      - generic [ref=e11]: Pinned Projects
      - generic [ref=e13] [cursor=pointer]:
        - generic [ref=e14]: QD
        - generic [ref=e15]: qlitz-demo
    - generic [ref=e16]:
      - generic [ref=e17]: Recent Projects
      - generic [ref=e18]:
        - generic [ref=e19] [cursor=pointer]:
          - generic [ref=e20]: MA
          - generic [ref=e21]: my-app
        - generic [ref=e22] [cursor=pointer]:
          - generic [ref=e23]: ES
          - generic [ref=e24]: enterprise-suite
    - navigation [ref=e25]:
      - generic [ref=e26]:
        - button "Projects ▶" [ref=e27] [cursor=pointer]:
          - generic [ref=e28]: Projects
          - generic [ref=e29]: ▶
        - generic [ref=e30]:
          - link "📁 All Projects" [ref=e31] [cursor=pointer]:
            - /url: /projects
            - generic [ref=e32]: 📁
            - generic [ref=e33]: All Projects
          - link "✨ New Project" [ref=e34] [cursor=pointer]:
            - /url: /projects/new
            - generic [ref=e35]: ✨
            - generic [ref=e36]: New Project
      - button "Execution ▶" [ref=e38] [cursor=pointer]:
        - generic [ref=e39]: Execution
        - generic [ref=e40]: ▶
      - button "Release ▶" [ref=e42] [cursor=pointer]:
        - generic [ref=e43]: Release
        - generic [ref=e44]: ▶
  - generic [ref=e45]:
    - banner [ref=e46]:
      - navigation [ref=e49]:
        - link "🏠 Qlitz" [ref=e50] [cursor=pointer]:
          - /url: /
          - generic [ref=e51]: 🏠
          - generic [ref=e52]: Qlitz
        - generic [ref=e53]:
          - generic [ref=e54]: /
          - link "📁 Projects" [ref=e55] [cursor=pointer]:
            - /url: /projects
            - generic [ref=e56]: 📁
            - generic [ref=e57]: Projects
        - generic [ref=e58]:
          - generic [ref=e59]: /
          - generic [ref=e60]:
            - generic [ref=e61]: 📊
            - generic [ref=e62]: Project
      - generic [ref=e63]:
        - generic [ref=e64]:
          - textbox "Search…" [ref=e65]
          - generic [ref=e66]: ⌘K
        - button "Dark Mode" [ref=e67] [cursor=pointer]
    - main [ref=e69]:
      - generic [ref=e70]:
        - generic [ref=e71]:
          - button "«" [ref=e72] [cursor=pointer]
          - generic [ref=e73]:
            - generic [ref=e74]: Project
            - generic [ref=e75]: UI
            - generic [ref=e76]: https://www.demoblaze.com
          - navigation [ref=e77]:
            - button "Overview" [ref=e78] [cursor=pointer]
            - button "Flows / Endpoints" [ref=e79] [cursor=pointer]
            - button "RTM" [ref=e80] [cursor=pointer]
            - button "Coverage" [ref=e81] [cursor=pointer]
            - button "Suggestions" [ref=e82] [cursor=pointer]
            - button "Tests" [ref=e83] [cursor=pointer]
            - button "Auto‑Heal" [ref=e84] [cursor=pointer]
            - button "Replay" [ref=e85] [cursor=pointer]
            - button "Settings" [active] [ref=e86] [cursor=pointer]
        - generic [ref=e88]:
          - generic [ref=e89]:
            - heading "Self‑Updating Selectors" [level=3] [ref=e90]
            - button "Re‑Crawl UI" [ref=e91] [cursor=pointer]
          - generic [ref=e92]:
            - heading "AI Test Refactoring" [level=3] [ref=e93]
            - button "Refactor Tests" [ref=e94] [cursor=pointer]
          - generic [ref=e95]:
            - heading "Cloud Sync" [level=3] [ref=e96]
            - button "Sync Now" [ref=e98] [cursor=pointer]
          - button "Delete Project" [ref=e100] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, type Page } from '@playwright/test';
  2  | import { BasePage } from './BasePage';
  3  | 
  4  | export class SettingsPage extends BasePage {
  5  |   constructor(page: Page) {
  6  |     super(page);
  7  |   }
  8  | 
  9  |   async open(projectId: string): Promise<void> {
  10 |     await this.goto(`/projects/${projectId}`);
  11 | 
  12 |     // Wait for the project sidebar to load
  13 |     await this.page.getByRole('button', { name: /^Overview$/i }).waitFor();
  14 | 
  15 |     // Click the Settings button in the project sidebar
  16 |     await this.page.getByRole('button', { name: /^Settings$/i }).click();
  17 |   }
  18 | 
  19 |   async assertSettingsVisible(): Promise<void> {
> 20 |     await expect(this.page.getByRole('heading', { name: /Self-?Updating Selectors/i })).toBeVisible();
     |                                                                                         ^ Error: expect(locator).toBeVisible() failed
  21 |     await expect(this.page.getByRole('heading', { name: /AI Test Refactoring/i })).toBeVisible();
  22 |     await expect(this.page.getByRole('heading', { name: /Cloud Sync/i })).toBeVisible();
  23 |   }
  24 | }
  25 | 
```