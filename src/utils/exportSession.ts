import type { ExaminationSession } from '../types';

const PHASE_LABEL: Record<string, string> = {
  IDLE: 'アイドル',
  CLAIM: '主張確認',
  DEFINITION: '定義',
  PREMISES: '前提抽出',
  CONSISTENCY: '整合性検証',
  COUNTER: '反例検討',
  REFINEMENT: '主張修正',
  APORIA: 'アポリア',
  RESOLUTION: '終了',
};

export function sessionToMarkdown(s: ExaminationSession): string {
  const date = new Date(s.updatedAt).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const lines: string[] = [
    `# Aporia セッションログ`,
    ``,
    `**主張:** ${s.claim}`,
    `**日時:** ${date}`,
    `**状態:** ${PHASE_LABEL[s.currentPhase] ?? s.currentPhase}`,
    ``,
  ];

  if (s.definitions.length > 0) {
    lines.push(`## 定義済みキーワード`);
    for (const d of s.definitions) {
      lines.push(`- **${d.term}**: ${d.definition}`);
    }
    lines.push(``);
  }

  if (s.premises.length > 0) {
    lines.push(`## 抽出された前提`);
    for (const p of s.premises) {
      lines.push(`${s.premises.indexOf(p) + 1}. ${p.content}`);
    }
    lines.push(``);
  }

  if (s.contradictions.length > 0) {
    lines.push(`## 発見された矛盾`);
    for (const c of s.contradictions) {
      lines.push(`- ${c.explanation}`);
    }
    lines.push(``);
  }

  if (s.conclusion) {
    lines.push(`## 結論`);
    lines.push(`**種別:** ${s.conclusion.type}`);
    lines.push(``);
    lines.push(s.conclusion.summary);
    if (s.conclusion.finalClaim) {
      lines.push(``);
      lines.push(`**修正後の主張:** ${s.conclusion.finalClaim}`);
    }
    lines.push(``);
  }

  lines.push(`## 対話ログ`);
  lines.push(``);
  for (const t of s.turns) {
    const prefix = t.role === 'engine' ? '**[エンジン]**' : '**[あなた]**';
    lines.push(`${prefix} *(${PHASE_LABEL[t.phase] ?? t.phase})*`);
    lines.push(``);
    lines.push(t.content);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  return lines.join('\n');
}

export async function downloadSession(s: ExaminationSession) {
  const md = sessionToMarkdown(s);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const datePart = new Date(s.updatedAt).toISOString().slice(0, 10);
  a.href = url;
  a.download = `aporia-${datePart}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copySessionAsJSON(s: ExaminationSession): Promise<void> {
  const json = JSON.stringify(s, null, 2);
  await navigator.clipboard.writeText(json);
}
