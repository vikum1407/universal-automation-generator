import { Request, Response } from "express";
import { TestsService } from "./tests.service";

export async function getTestDashboard(req: Request, res: Response) {
  const id = String(req.params.id);

  try {
    const dashboard = await TestsService.getDashboard(id);
    res.json(dashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load test dashboard" });
  }
}
