import { Router } from "express";
import { runAutonomousStabilization } from "../../stability/stabilization/orchestrator";

const router = Router();

router.get("/:project", async (req, res) => {
  const project = req.params.project;
  const result = await runAutonomousStabilization(project);
  res.json(result);
});

export default router;
