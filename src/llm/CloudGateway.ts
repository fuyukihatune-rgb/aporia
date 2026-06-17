import type { LLMGateway, CompletionOptions } from '../types';

export class CloudGateway implements LLMGateway {
  tier: 2 | 3;
  private model: string;
  private getApiKey: () => string;

  constructor(tier: 2 | 3, model: string, getApiKey: () => string) {
    this.tier = tier;
    this.model = model;
    this.getApiKey = getApiKey;
  }

  async isAvailable(): Promise<boolean> {
    return this.getApiKey().length > 10;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const apiKey = this.getApiKey();
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens ?? 512,
        temperature: options?.temperature ?? 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`LLM API error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.content[0].text as string;
  }
}
