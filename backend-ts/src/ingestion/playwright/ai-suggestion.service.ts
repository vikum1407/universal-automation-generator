import { Injectable } from "@nestjs/common";
import OpenAI from "openai";

@Injectable()
export class AISuggestionService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  async generate(error: any, logs: any[], consoleLogs: any[]) {
    const prompt = `
You are an expert QA automation engineer. Based on the following failure:

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
  "suggestion": "short fix recommendation",
  "code_snippet": "minimal code snippet showing the fix"
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
        suggestion: "Review logs manually",
        code_snippet: "// No suggestion available"
      };
    }
  }
}
