import { Router } from "express";

const router = Router();

router.get("/generate/:testId", async (req, res) => {
  const { testId } = req.params;

  // Temporary mock data — replace with real generation logic later
  const frameworks = {
    playwright: {
      "example.spec.ts": `test("${testId} - Playwright example", async () => {});`
    },
    cypress: {
      "example.cy.js": `it("${testId} - Cypress example", () => {});`
    },
    selenium: {},
    restassured: {}
  };

  res.json({ frameworks });
});

export default router;
