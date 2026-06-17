import type { Phase } from '../../types';

const PHASES: { id: Phase; label: string }[] = [
  { id: 'CLAIM', label: '主張' },
  { id: 'DEFINITION', label: '定義' },
  { id: 'PREMISES', label: '前提' },
  { id: 'CONSISTENCY', label: '検証' },
  { id: 'COUNTER', label: '反例' },
  { id: 'REFINEMENT', label: '修正' },
  { id: 'APORIA', label: 'アポリア' },
  { id: 'RESOLUTION', label: '終了' },
];

const ORDER = PHASES.map((p) => p.id);

interface Props {
  phase: Phase;
}

export function PhaseIndicator({ phase }: Props) {
  if (phase === 'IDLE') return null;

  const currentIdx = ORDER.indexOf(phase);

  return (
    <div className="phase-indicator">
      {PHASES.map((p, i) => {
        const done = i < currentIdx;
        const active = p.id === phase;
        return (
          <div key={p.id} className={`phase-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
            <div className="phase-dot" />
            <span className="phase-label">{p.label}</span>
          </div>
        );
      })}
    </div>
  );
}
