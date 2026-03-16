import { Router } from "express";
import { loadStabilityContext } from "../stability/context/loadStabilityContext";
import evaluateGuardrails from "../stability/guardrails/index";

const router = Router();

router.get("/:project", async (req, res) => {
  const project = req.params.project;
  const context = await loadStabilityContext(project);
  const result = evaluateGuardrails(context);
  res.json(result);
});

export default router;
