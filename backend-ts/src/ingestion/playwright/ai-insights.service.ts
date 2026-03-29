import { Injectable } from "@nestjs/common";
import OpenAI from "openai";

@Injectable()
export class AIInsightsService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  async generate(run: any) {
    const prompt = `
You are an expert QA analytics engine. Analyze this test run:

Status: ${run.status}
Duration: ${run.durationMs}ms
Retries: ${run.metadata.retry}

Errors:
${run.error?.message || "none"}

Logs:
${run.logs.map((l) => l.message).join("\n")}

Console:
${run.console.map((c) => c.message).join("\n")}

Network:
${run.network.map((n) => `${n.method} ${n.url} -> ${n.status}`).join("\n")}

Artifacts: ${run.artifacts.length}

Provide a JSON object:
{
  "insights": "3–5 bullet points describing patterns, anomalies, or trends"
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
        insights: "- No insights available"
      };
    }
  }
}
