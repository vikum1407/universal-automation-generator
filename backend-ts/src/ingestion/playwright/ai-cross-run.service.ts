import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { db } from "../../core/db";

@Injectable()
export class AICrossRunService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  async analyze(testId: string) {
    const runs = await db.manyOrNone(
      `
      SELECT
        tr.status,
        tr.duration_ms,
        e.message AS error_message,
        e.stack AS error_stack,
        m.retry
      FROM test_runs tr
      LEFT JOIN test_run_errors e ON e.run_id = tr.run_id
      LEFT JOIN test_run_metadata m ON m.run_id = tr.run_id
      WHERE tr.test_id = $1
      ORDER BY tr.started_at DESC
      LIMIT 50
    `,
      [testId]
    );

    const prompt = `
You are an expert QA analytics engine. Analyze the following 50 most recent runs of a test:

${JSON.stringify(runs, null, 2)}

Return a JSON object:
{
  "summary": "high-level summary of stability",
  "clusters": [
    { "pattern": "description", "count": number }
  ],
  "trend": "improving | degrading | stable"
}
`;

    const res = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    try {
      return JSON.parse(res.choices[0].message.content);
    } catch {
      return {
        summary: "No insights available",
        clusters: [],
        trend: "stable"
      };
    }
  }
}
