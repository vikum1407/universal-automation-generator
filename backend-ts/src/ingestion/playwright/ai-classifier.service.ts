import { Injectable } from "@nestjs/common";
import OpenAI from "openai";

@Injectable()
export class AIClassifierService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  async classify(error: any, logs: any[], consoleLogs: any[]) {
    const prompt = `
You are an expert QA failure analyst. Analyze the following test failure:

Error:
${error?.message || "none"}
Stack:
${error?.stack || "none"}

Logs:
${logs.map((l) => l.message).join("\n")}

Console:
${consoleLogs.map((c) => c.message).join("\n")}

Return a JSON object with:
{
  "category": "network | timeout | selector | assertion | flakiness | environment | unknown",
  "root_cause": "short explanation",
  "suggestion": "short fix recommendation",
  "risk_level": "low | medium | high"
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
        category: "unknown",
        root_cause: "AI parsing failed",
        suggestion: "Review logs manually",
        risk_level: "medium"
      };
    }
  }
}
