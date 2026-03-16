import { Router } from "express";

import guardrailsRoute from "./stability/guardrails";
import scoreRoute from "./stability/score";
import readinessRoute from "./stability/readiness";
import stabilizationRoute from "./stability/stabilization";

const router = Router();

router.use(guardrailsRoute);
router.use(scoreRoute);
router.use(readinessRoute);
router.use(stabilizationRoute);

export default router;
