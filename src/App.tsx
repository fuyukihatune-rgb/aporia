import { useState, useRef, useEffect } from 'react';
import { useSessionStore } from './store/sessionStore';
import { startElenchus } from './engine/ElenchusEngine';
import { PhaseIndicator } from './components/PhaseIndicator/PhaseIndicator';
import { ChatPane } from './components/ChatPane/ChatPane';
import { SessionList } from './components/SessionList/SessionList';
import { LLMSettings } from './components/Settings/LLMSettings';

type Tab = 'chat' | 'history' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('chat');
  const [claimInput, setClaimInput] = useState('');
  const { currentPhase, claim, isLoading, resetSession, apiKey } = useSessionStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isIdle = currentPhase === 'IDLE';

  const MAX_CLAIM_LEN = 500;

  const handleStart = async () => {
    const text = claimInput.trim().slice(0, MAX_CLAIM_LEN);
    if (!text || isLoading) return;
    if (!apiKey) {
      alert('まず「設定」タブでAPIキーを入力してください。');
      setTab('settings');
      return;
    }
    setClaimInput('');
    setTab('chat');
    await startElenchus(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  useEffect(() => {
    if (isIdle && tab === 'chat' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isIdle, tab]);

  return (
    <div id="app">
      <nav className="nav">
        <span className="nav-title">Aporia</span>
        {!isIdle && claim && (
          <span className="nav-claim">
            {claim.length > 28 ? claim.slice(0, 28) + '…' : claim}
          </span>
        )}
        <div className="nav-tabs">
          {(['chat', 'history', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`nav-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'chat' ? '問答' : t === 'history' ? '履歴' : '設定'}
            </button>
          ))}
        </div>
        {!isIdle && (
          <button className="nav-reset" onClick={resetSession} title="新しいセッション">
            ＋
          </button>
        )}
      </nav>

      {!isIdle && tab === 'chat' && (
        <PhaseIndicator phase={currentPhase} />
      )}

      <div className="main">
        <div className={`tab-panel ${tab === 'chat' ? 'active' : ''}`}>
          {isIdle ? (
            <div className="start-root">
              <div className="start-inner">
                <div className="start-logo">Aporia</div>
                <div className="start-tagline">
                  あなたは本当にそれを信じているのか。
                  <br />ソクラテスが問い続ける。
                </div>
                <div className="start-card">
                  <label className="field-label">検討したい主張・信念を入力</label>
                  <div className="field-desc">
                    例：「努力すれば必ず報われる」「お金より大切なものがある」
                  </div>
                  <textarea
                    ref={textareaRef}
                    className="field-input"
                    rows={3}
                    placeholder="主張を入力…"
                    value={claimInput}
                    onChange={(e) => setClaimInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    className="btn-primary"
                    style={{ marginTop: 14, width: '100%' }}
                    disabled={!claimInput.trim() || isLoading}
                    onClick={handleStart}
                  >
                    {isLoading ? '準備中…' : '問答を始める'}
                  </button>
                </div>
                <div className="how-to">
                  <div className="how-to-title">使い方</div>
                  <ol className="how-to-list">
                    <li>設定タブで <strong>Anthropic APIキー</strong>を入力</li>
                    <li>検討したい主張・信念を入力して「問答を始める」</li>
                    <li>エンジンの問いに答え続ける — <strong>定義 → 前提 → 検証 → 反例</strong>の順に進む</li>
                    <li>矛盾が見つかると<span className="how-to-aporia">アポリア</span>へ。主張を見直すか、そのまま考え続けるかはあなた次第</li>
                    <li>対話は自動保存。履歴タブからいつでも再開できる</li>
                  </ol>
                </div>
                <div className="start-note">
                  対話データはこのデバイスにのみ保存されます。外部に送信されません（LLM API利用時を除く）。
                </div>
              </div>
            </div>
          ) : (
            <ChatPane />
          )}
        </div>

        <div className={`tab-panel ${tab === 'history' ? 'active' : ''}`}>
          <div className="content">
            <SessionList />
          </div>
        </div>

        <div className={`tab-panel ${tab === 'settings' ? 'active' : ''}`}>
          <div className="content">
            <LLMSettings />
          </div>
        </div>
      </div>
    </div>
  );
}
