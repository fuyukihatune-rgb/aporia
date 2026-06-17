import { useEffect, useRef } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { engineStep } from '../../engine/ElenchusEngine';
import { TurnBubble } from './TurnBubble';
import { InputArea } from './InputArea';

export function ChatPane() {
  const { turns, isLoading, currentPhase, error } = useSessionStore();
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
          セッション終了 — 思索の続きは、あなた自身の中に。
        </div>
      )}
    </div>
  );
}
