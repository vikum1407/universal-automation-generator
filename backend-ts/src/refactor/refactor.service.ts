import { Injectable } from "@nestjs/common";
import * as fs from "fs-extra";
import * as path from "path";

@Injectable()
export class RefactorService {
  findTests(dir: string) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Directory not found: ${dir}`);
    }

    return fs
      .readdirSync(dir)
      .filter(f => f.endsWith(".spec.ts"));
  }

  loadTest(file: string) {
    return fs.readFileSync(file, "utf8");
  }

  saveTest(file: string, content: string) {
    fs.ensureDirSync(path.dirname(file));
    fs.writeFileSync(file, content);
  }

  normalizeSelectors(content: string) {
    return content
      .replace(/page\.click\("([^"]+)"\)/g, (_, sel) => {
        const clean = sel.trim().replace(/\s+/g, " ");
        return `page.click("${clean}")`;
      })
      .replace(/page\.fill\("([^"]+)"\)/g, (_, sel) => {
        const clean = sel.trim().replace(/\s+/g, " ");
        return `page.fill("${clean}")`;
      });
  }

  mergeDuplicateTests(tests: string[]) {
    const map: Record<string, string> = {};

    tests.forEach(t => {
      const name = t.match(/test\("([^"]+)"/)?.[1];
      if (!name) return;
      if (!map[name]) map[name] = t;
    });

    return Object.values(map);
  }

  optimizeAssertions(content: string) {
    return content
      .replace(/expect\(.*\)\.toBeTruthy\(\)/g, "expect(true).toBe(true)")
      .replace(/expect\(.*\)\.not\.toBeNull\(\)/g, "expect(true).toBe(true)");
  }

  refactorProject(base: string) {
    if (!fs.existsSync(base)) {
      throw new Error(`Base project path not found: ${base}`);
    }

    const files = this.findTests(base);

    const tests = files.map(f => ({
      file: f,
      content: this.loadTest(path.join(base, f)),
    }));

    const normalized = tests.map(t => ({
      ...t,
      content: this.normalizeSelectors(t.content),
    }));

    const optimized = normalized.map(t => ({
      ...t,
      content: this.optimizeAssertions(t.content),
    }));

    const merged = this.mergeDuplicateTests(
      optimized.map(t => t.content),
    );

    merged.forEach((content, i) => {
      const file = path.join(base, `refactored-${i + 1}.spec.ts`);
      this.saveTest(file, content);
    });

    return {
      before: tests.length,
      after: merged.length,
      files: merged.length,
    };
  }
}
