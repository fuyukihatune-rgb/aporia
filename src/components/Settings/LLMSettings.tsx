import { useState } from 'react';
import { useSessionStore } from '../../store/sessionStore';

const DEV_INFO = {
  name: '田中芙雪（Sirusu）',
  message: 'このアプリは個人が作っています。やさしい気持ちで使ってもらえたら嬉しいです。',
  links: [
    { label: 'X（Twitter）', url: 'https://x.com/Sirusu_Tanaka' },
    { label: 'GitHub', url: 'https://github.com/fuyukihatune-rgb' },
  ],
};

const DONATIONS = [
  { key: 'btc', label: 'ビットコイン（BTC）', address: '1EHshWSHyvJFjkAYQ5rPX7nKo2FRKWF58f' },
  { key: 'eth', label: 'イーサリアム（ETH）', address: '0xb7da6af09c0f8db95d0c0e352e32d1915483931e' },
];

export function LLMSettings() {
  const { preferredTier, apiKey, setPreferredTier, setApiKey } = useSessionStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const copyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="settings-root">
      {/* LLM設定 */}
      <div className="card settings-section">
        <div className="settings-label">LLM 設定</div>
        <div className="settings-desc">Anthropic APIキーを入力すると Claude（Tier 2/3）が使えます。APIキーはこのデバイスにのみ保存されます。</div>
        <div style={{ marginBottom: 12 }}>
          <div className="field-label">Anthropic APIキー</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="field-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
              spellCheck={false}
            />
            <button className="btn-ghost" onClick={() => setShowKey((v) => !v)}>
              {showKey ? '隠す' : '表示'}
            </button>
          </div>
        </div>
        <div>
          <div className="field-label">優先 Tier</div>
          <div className="tier-row">
            <button className="tier-btn tier-btn-disabled" disabled>
              Tier 1 — ローカル LLM（Coming Soon — Phase 2）
            </button>
            {([2, 3] as const).map((t) => (
              <button
                key={t}
                className={`tier-btn ${preferredTier === t ? 'active' : ''}`}
                onClick={() => setPreferredTier(t)}
              >
                {t === 2 ? 'Tier 2 — Claude Haiku（速い）' : 'Tier 3 — Claude Sonnet（高精度）'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 開発者情報 */}
      <div className="card settings-section">
        <div className="settings-label">開発者情報</div>
        <div className="dev-msg">
          {DEV_INFO.name}<br />
          {DEV_INFO.message}
        </div>
        <div className="dev-links">
          {DEV_INFO.links.map((l) => (
            <a key={l.url} className="dev-link" href={l.url} target="_blank" rel="noopener noreferrer">
              🔗 {l.label}
            </a>
          ))}
        </div>
      </div>

      {/* バージョン */}
      <div className="card settings-section">
        <div className="settings-label">バージョン</div>
        <div className="settings-desc" style={{ marginBottom: 0 }}>
          Aporia v0.1.0 — 2026-06-17<br />
          <span style={{ fontSize: 11 }}>
            <a href="https://github.com/fuyukihatune-rgb/aporia" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-3)' }}>GitHub でソースを見る</a>
          </span>
        </div>
      </div>

      {/* 寄付 */}
      <div className="card settings-section">
        <div className="settings-label">開発者に寄付する</div>
        <div className="settings-desc">よかったら暗号資産で応援できます。下のアドレスに送金してください。寄付は任意です。</div>
        {DONATIONS.map((d) => (
          <div key={d.key} className="donate-block">
            <div className="donate-label">{d.label}</div>
            <div className="eth-box">{d.address}</div>
            <button
              className="btn-secondary"
              style={{ width: '100%' }}
              onClick={() => copyAddress(d.address)}
            >
              {copied === d.address ? 'コピーしました ✓' : 'アドレスをコピー'}
            </button>
          </div>
        ))}
        <div className="settings-desc" style={{ marginTop: 12, marginBottom: 0, fontSize: 12, color: 'var(--text-4)' }}>
          ⚠️ 送る前に、アドレスが上のものと同じか必ず確認してください。送金は取り消せません。
        </div>
      </div>
    </div>
  );
}
