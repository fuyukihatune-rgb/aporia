import type { Turn } from '../../types';

interface Props {
  turn: Turn;
}

const PHASE_LABEL: Record<string, string> = {
  CLAIM: '主張',
  DEFINITION: '定義',
  PREMISES: '前提',
  CONSISTENCY: '検証',
  COUNTER: '反例',
  REFINEMENT: '修正',
  APORIA: 'アポリア',
  RESOLUTION: '終了',
};

export function TurnBubble({ turn }: Props) {
  const isEngine = turn.role === 'engine';
  const phaseLabel = PHASE_LABEL[turn.phase] ?? turn.phase;

  return (
    <div className={`turn ${isEngine ? 'turn-engine' : 'turn-user'}`}>
      {isEngine && (
        <div className="turn-meta">
          <span className={`phase-chip phase-chip-${turn.phase.toLowerCase()}`}>
            {phaseLabel}
          </span>
          {turn.metadata?.contradictionDetected && (
            <span className="contradiction-chip">矛盾検出</span>
          )}
        </div>
      )}
      <div className="turn-bubble">
        {turn.content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < turn.content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}
