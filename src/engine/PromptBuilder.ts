import type { Premise, Definition } from '../types';

function fmtPremises(premises: Premise[]): string {
  return premises.map((p, i) => `${i + 1}. ${p.content}`).join('\n');
}

function fmtDefs(defs: Definition[]): string {
  return defs.map((d) => `- ${d.term}: ${d.definition}`).join('\n');
}

export function buildClaimPrompt(claim: string): string {
  return `以下のユーザーの主張を分析し、JSON形式で返してください。
主張: "${claim}"

返すJSON:
{
  "normalizedClaim": "主張を整理した文（「〜である」「〜すべき」「〜は正しい」の形式）",
  "keyTerms": ["定義が必要な重要語（最大3つ）"],
  "implicitPremises": ["明示されていない暗黙の前提（最大2つ）"],
  "claimType": "factual | normative | evaluative"
}
JSONのみ返してください。`;
}

export function buildDefinitionPrompt(
  claim: string,
  currentKeyTerm: string,
  previousDefinitions: Definition[],
): string {
  const prev = previousDefinitions.length
    ? fmtDefs(previousDefinitions)
    : 'まだありません';
  return `ソクラテス的問答を行っています。
ユーザーの主張: "${claim}"
現在定義を求めるキーワード: "${currentKeyTerm}"
これまでの定義: ${prev}

「${currentKeyTerm}」の定義を求める、簡潔で哲学的な問いを1つ生成してください。
返すJSON:
{
  "question": "問いの文（ですます調）",
  "hint": "定義の観点のヒント（任意）"
}
JSONのみ返してください。`;
}

export function buildPremisesPrompt(
  claim: string,
  definitions: Definition[],
  premises: Premise[],
): string {
  const defs = definitions.length ? fmtDefs(definitions) : 'なし';
  const prems = premises.length ? fmtPremises(premises) : 'まだありません';
  return `ソクラテス的問答を行っています。
ユーザーの主張: "${claim}"
定義済みキーワード: ${defs}
これまで導出された前提: ${prems}

ユーザーがこの主張を信じる根拠・前提を引き出す問いを生成してください。
返すJSON:
{
  "question": "問いの文（ですます調）",
  "targetAspect": "この問いが探る側面の説明"
}
JSONのみ返してください。`;
}

export function buildConsistencyPrompt(premises: Premise[]): string {
  const prems = fmtPremises(premises);
  return `以下の前提群を分析し、矛盾の有無を検証してください。
前提一覧:
${prems}

返すJSON:
{
  "hasContradiction": true または false,
  "contradictions": [
    {
      "premiseA": "前提Aの内容",
      "premiseB": "前提Bの内容",
      "explanation": "矛盾の説明"
    }
  ],
  "followUpQuestion": "矛盾がない場合、整合性を確認する問い（あれば）"
}
JSONのみ返してください。`;
}

export function buildCounterPrompt(claim: string, premises: Premise[]): string {
  const prems = fmtPremises(premises);
  return `ソクラテス的問答を行っています。
ユーザーの主張: "${claim}"
前提:
${prems}

この主張に対する反例・類似ケースを1つ提示してください。
返すJSON:
{
  "counterExample": "反例・類似ケースの説明",
  "question": "この反例を踏まえて主張をどう考えるか問う問い（ですます調）"
}
JSONのみ返してください。`;
}

export function buildAporiaPrompt(
  claim: string,
  contradictions: { explanation: string }[],
): string {
  const contrs = contradictions.map((c) => `- ${c.explanation}`).join('\n');
  return `ソクラテス的問答の結果、以下の矛盾が発見されました。
元の主張: "${claim}"
矛盾:
${contrs}

このアポリア（行き詰まり）を哲学的に要約し、ユーザーへのメッセージを生成してください。
返すJSON:
{
  "summary": "アポリアの要約（2〜3文）",
  "message": "ユーザーへの問いかけ（ソクラテス的・励ます調）"
}
JSONのみ返してください。`;
}
