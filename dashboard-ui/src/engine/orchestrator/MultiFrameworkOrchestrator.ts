import type { UniversalTestModel } from "@/engine/UniversalTestModelBuilder";
import { generatePlaywrightTests } from "@/engine/playwright/PlaywrightGenerator";
import { generateCypressTests } from "@/engine/cypress/CypressGenerator";
import { generateSeleniumTests } from "@/engine/selenium/SeleniumGenerator";
import { generateRestAssuredTests } from "@/engine/restassured/RestAssuredGenerator";
import type { MultiFrameworkOutput } from "./MultiFrameworkTypes";

export function generateAllFrameworkTests(
  model: UniversalTestModel
): MultiFrameworkOutput {
  const playwright = generatePlaywrightTests(model);
  const cypress = generateCypressTests(model);
  const selenium = generateSeleniumTests(model);
  const restassured = generateRestAssuredTests(model);

  return {
    playwright: convert(playwright),
    cypress: convert(cypress),
    selenium: convert(selenium),
    restassured: convert(restassured),
  };
}

function convert(arr: { fileName: string; content: string }[]) {
  const out: Record<string, string> = {};
  for (const f of arr) {
    out[f.fileName] = f.content;
  }
  return out;
}
