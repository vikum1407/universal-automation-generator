import { Router } from "express";
import { PlaywrightRecorder } from "./recorder";

const router = Router();

router.post("/", async (req, res) => {
  try {
    await PlaywrightRecorder.record(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to ingest Playwright data" });
  }
});

export default router;
