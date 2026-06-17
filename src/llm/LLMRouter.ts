import type { LLMGateway, CompletionOptions } from '../types';
import { CloudGateway } from './CloudGateway';

export function createRouter(preferredTier: 1 | 2 | 3, getApiKey: () => string): LLMRouter {
  const tier2 = new CloudGateway(2, 'claude-haiku-4-5-20251001', getApiKey);
  const tier3 = new CloudGateway(3, 'claude-sonnet-4-6', getApiKey);
  return new LLMRouter([tier2, tier3], preferredTier);
}

export class LLMRouter {
  private gateways: LLMGateway[];
  private preferredTier: 1 | 2 | 3;

  constructor(gateways: LLMGateway[], preferredTier: 1 | 2 | 3) {
    this.gateways = gateways;
    this.preferredTier = preferredTier;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const sorted = [...this.gateways].sort(
      (a, b) =>
        Math.abs(a.tier - this.preferredTier) - Math.abs(b.tier - this.preferredTier),
    );
    for (const gw of sorted) {
      if (await gw.isAvailable()) {
        return gw.complete(prompt, options);
      }
    }
    throw new Error('利用可能なLLMがありません。APIキーを設定してください。');
  }
}

// JSON をパース。LLMが前後にテキストを足しても壊れないように最初の{...}を取り出す
// プロトタイプ汚染防止: __proto__ / constructor / prototype キーを除去
export function extractJSON(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`JSONが見つかりません: ${text.slice(0, 100)}`);
  const raw = JSON.parse(m[0]) as Record<string, unknown>;
  return sanitizeJSON(raw);
}

function sanitizeJSON(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sanitizeJSON);
  if (obj !== null && typeof obj === 'object') {
    const safe: Record<string, unknown> = Object.create(null);
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      safe[k] = sanitizeJSON(v);
    }
    return safe;
  }
  return obj;
}
