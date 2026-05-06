import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

// Thin wrapper around the OpenAI SDK.
// All AI calls in this module go through here so the model and error handling
// are centralised in one place.

@Injectable()
export class AIClient {
  private readonly logger = new Logger(AIClient.name);
  private readonly openai: OpenAI;
  private readonly model  = 'gpt-4o-mini';

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model:       this.model,
        temperature: 0.4,
        max_tokens:  2048,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
      });
      return response.choices[0]?.message?.content?.trim() ?? '';
    } catch (err: any) {
      this.logger.warn(`AI call failed: ${err?.message ?? err}`);
      throw err;
    }
  }

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }
}
