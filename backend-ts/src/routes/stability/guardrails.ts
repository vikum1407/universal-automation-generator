import { Router } from "express";
import { evaluateGuardrails } from "../../stability/guardrails/evaluator";
import { loadStabilityContext } from "../../stability/context/loadStabilityContext";

const router = Router();

router.get(
  "/dashboard/projects/:project/stability/guardrails",
  async (req, res) => {
    const project = req.params.project;

    const context = await loadStabilityContext(project);
    const result = evaluateGuardrails(context);

    res.json(result);
  }
);

export default router;
