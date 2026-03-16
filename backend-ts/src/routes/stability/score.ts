import { Router } from "express";
import { loadStabilityScoreContext } from "../../stability/context/loadStabilityScoreContext";
import { evaluateStabilityScore } from "../../stability/score/evaluator";

const router = Router();

router.get("/:project", async (req, res) => {
  const project = req.params.project;
  const context = await loadStabilityScoreContext(project);
  const result = evaluateStabilityScore(context);
  res.json(result);
});

export default router;
