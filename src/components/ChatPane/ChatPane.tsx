import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { engineStep } from '../../engine/ElenchusEngine';
import { TurnBubble } from './TurnBubble';
import { InputArea } from './InputArea';
import { db } from '../../db/database';
import { downloadSession } from '../../utils/exportSession';

export function ChatPane() {
  const { turns, isLoading, currentPhase, error, sessionId } = useSessionStore();
  const [exporting, setExporting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, isLoading]);

  const isFinished = currentPhase === 'RESOLUTION';

  return (
    <div className="chat-pane">
      <div className="chat-scroll">
        {turns.map((turn) => (
          <TurnBubble key={turn.id} turn={turn} />
        ))}
        {isLoading && (
          <div className="turn turn-engine">
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        )}
        {error && (
          <div className="error-banner">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>
      {!isFinished && (
        <InputArea
          disabled={isLoading}
          onSubmit={engineStep}
        />
      )}
      {isFinished && (
        <div className="session-end-bar">
          <span>セッション終了 — 思索の続きは、あなた自身の中に。</span>
          <button
            className="export-btn"
            disabled={exporting}
            onClick={async () => {
              if (!sessionId) return;
              setExporting(true);
              const s = await db.sessions.get(sessionId);
              if (s) await downloadSession(s);
              setExporting(false);
            }}
          >
            {exporting ? '…' : 'ログを保存'}
          </button>
        </div>
      )}
    </div>
  );
}
