import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { useSessionStore } from '../../store/sessionStore';
import { downloadSession } from '../../utils/exportSession';

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

export function SessionList() {
  const sessions = useLiveQuery(
    () => db.sessions.orderBy('updatedAt').reverse().limit(50).toArray(),
    [],
  );
  const { loadSession } = useSessionStore();

  if (!sessions?.length) {
    return (
      <div className="session-empty">
        <p>まだセッションがありません。</p>
        <p className="session-empty-sub">主張を入力して問答を始めましょう。</p>
      </div>
    );
  }

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="session-list">
      {sessions.map((s) => (
        <div key={s.id} className="session-item-wrap">
          <button
            className="session-item"
            onClick={() => loadSession(s.id!)}
          >
            <div className="session-item-claim">{s.claim}</div>
            <div className="session-item-meta">
              <span className={`phase-chip phase-chip-${s.currentPhase.toLowerCase()}`}>
                {PHASE_LABEL[s.currentPhase] ?? s.currentPhase}
              </span>
              <span className="session-item-date">{fmt(s.updatedAt)}</span>
            </div>
          </button>
          <button
            className="session-export-btn"
            title="Markdown でエクスポート"
            onClick={async (e) => {
              e.stopPropagation();
              await downloadSession(s);
            }}
          >
            ↓
          </button>
        </div>
      ))}
    </div>
  );
}
