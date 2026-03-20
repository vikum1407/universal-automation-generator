import { Controller, Get, Param } from '@nestjs/common';
import { FrameworkGenerationOrchestrator } from '../generator/framework-generation-orchestrator';

@Controller('api/tests')
export class TestsController {
  constructor(
    private readonly frameworkOrchestrator: FrameworkGenerationOrchestrator
  ) {}

  @Get('generate/:testId')
  async generate(@Param('testId') testId: string) {
    /**
     * ---------------------------------------------------------
     * INDUSTRIAL STANDARD PRACTICE:
     * testId → URL mapping
     * ---------------------------------------------------------
     * For now, we use a placeholder mapping until you store
     * real testId → URL relationships in your DB.
     */
    const url = process.env.QLITZ_TEST_URL ?? 'https://www.saucedemo.com';
    const swaggerUrl = process.env.QLITZ_SWAGGER_URL ?? 'https://petstore.swagger.io/v2/swagger.json';

    /**
     * ---------------------------------------------------------
     * 1. Generate UI framework tests (Playwright/Cypress/Selenium)
     * ---------------------------------------------------------
     */
    const uiFramework = await this.frameworkOrchestrator.generateUiFrameworkFromUrl(url);

    /**
     * ---------------------------------------------------------
     * 2. Generate API framework tests (RestAssured)
     * ---------------------------------------------------------
     */
    const apiFramework = await this.frameworkOrchestrator.generateApiFrameworkFromSwagger(swaggerUrl);

    /**
     * ---------------------------------------------------------
     * 3. Convert to dashboard format
     * ---------------------------------------------------------
     */
    return {
      frameworks: {
        playwright: uiFramework.playwright ?? {},
        cypress: uiFramework.cypress ?? {},
        selenium: uiFramework.selenium ?? {},
        restassured: apiFramework ?? {}
      }
    };
  }
}
