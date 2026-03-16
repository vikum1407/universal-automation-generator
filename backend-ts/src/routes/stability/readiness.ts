// src/routes/stability/readiness.ts
import { Router } from "express";
import { loadReleaseReadinessContext } from "../../stability/context/loadReleaseReadinessContext";
import { evaluateReleaseReadiness } from "../../stability/readiness/evaluator";

const router = Router();

router.get("/:project", async (req, res) => {
  const project = req.params.project;
  const context = await loadReleaseReadinessContext(project);
  const result = evaluateReleaseReadiness(context);
  res.json(result);
});

export default router;
