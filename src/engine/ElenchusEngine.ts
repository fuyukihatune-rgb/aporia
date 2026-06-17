import { useSessionStore } from '../store/sessionStore';
import { createRouter, extractJSON } from '../llm/LLMRouter';
import {
  buildClaimPrompt,
  buildDefinitionPrompt,
  buildPremisesPrompt,
  buildConsistencyPrompt,
  buildCounterPrompt,
  buildAporiaPrompt,
} from './PromptBuilder';
import { evalTransition } from './TransitionRules';
import type { Phase } from '../types';

// エンジンエントリポイント。ユーザーの返答を受け取り次のエンジン発話を生成する
export async function engineStep(userInput: string): Promise<void> {
  const store = useSessionStore.getState();
  const {
    currentPhase,
    claim,
    definitions,
    premises,
    undefinedKeyTerms,
    preferredTier,
    apiKey,
  } = store;

  store.setError(null);
  store.setLoading(true);
  store.addUserTurn(userInput);

  try {
    const router = createRouter(preferredTier, () => apiKey);

    switch (currentPhase) {
      case 'CLAIM': {
        const raw = await router.complete(buildClaimPrompt(userInput));
        const parsed = extractJSON(raw) as {
          normalizedClaim: string;
          keyTerms: string[];
          implicitPremises: string[];
          claimType: string;
        };
        store.setClaim(parsed.normalizedClaim);
        store.setUndefinedKeyTerms(parsed.keyTerms ?? []);
        store.confirmClaim();
        store.addEngineTurn(
          `主張を確認しました。\n「${parsed.normalizedClaim}」\n\nこれから定義の確認に移ります。`,
          'CLAIM',
        );
        break;
      }

      case 'DEFINITION': {
        const currentTerm = undefinedKeyTerms[0];
        store.addDefinition(currentTerm, userInput, store.turns[store.turns.length - 1]?.id ?? '');
        const nextTerms = undefinedKeyTerms.slice(1);
        if (nextTerms.length > 0) {
          store.setUndefinedKeyTerms(nextTerms);
          const raw = await router.complete(
            buildDefinitionPrompt(claim!, nextTerms[0], store.definitions),
          );
          const parsed = extractJSON(raw) as { question: string; hint?: string };
          store.addEngineTurn(parsed.question, 'DEFINITION');
          store.setCurrentQuestion(parsed.question);
        } else {
          store.setUndefinedKeyTerms([]);
          store.addEngineTurn(
            '定義の確認が終わりました。次に、あなたがそう考える根拠・前提を探っていきます。',
            'DEFINITION',
          );
        }
        break;
      }

      case 'PREMISES': {
        const turnId = store.turns[store.turns.length - 1]?.id ?? '';
        store.addPremise(userInput, turnId);
        const updatedPremises = useSessionStore.getState().premises;
        if (updatedPremises.length < 2) {
          const raw = await router.complete(
            buildPremisesPrompt(claim!, definitions, updatedPremises),
          );
          const parsed = extractJSON(raw) as { question: string; targetAspect: string };
          store.addEngineTurn(parsed.question, 'PREMISES', { extractedPremise: userInput });
          store.setCurrentQuestion(parsed.question);
        } else {
          store.addEngineTurn(
            '前提が揃いました。整合性を検証します…',
            'PREMISES',
            { extractedPremise: userInput },
          );
        }
        break;
      }

      case 'CONSISTENCY': {
        const raw = await router.complete(buildConsistencyPrompt(premises));
        const parsed = extractJSON(raw) as {
          hasContradiction: boolean;
          contradictions: { premiseA: string; premiseB: string; explanation: string }[];
          followUpQuestion?: string;
        };
        if (parsed.hasContradiction && parsed.contradictions?.length > 0) {
          for (const c of parsed.contradictions) {
            const pa = premises.find((p) => p.content === c.premiseA) ?? premises[0];
            const pb = premises.find((p) => p.content === c.premiseB) ?? premises[1];
            store.addContradiction({
              premiseAId: pa.id,
              premiseBId: pb.id,
              explanation: c.explanation,
            });
          }
          store.addEngineTurn('前提の中に矛盾が見つかりました。', 'CONSISTENCY', {
            contradictionDetected: true,
          });
        } else {
          store.setConsistencyChecked(true);
          const q = parsed.followUpQuestion ?? '整合性は確認できました。次に反例を検討します。';
          store.addEngineTurn(q, 'CONSISTENCY');
        }
        break;
      }

      case 'COUNTER': {
        const lower = userInput.toLowerCase();
        if (
          lower.includes('修正') ||
          lower.includes('変え') ||
          lower.includes('見直') ||
          lower.includes('refinement')
        ) {
          store.setUserSelectedRefinement(true);
          store.addEngineTurn(
            'では主張を修正しましょう。修正後の主張をどうぞ。',
            'COUNTER',
          );
        } else if (
          lower.includes('わからない') ||
          lower.includes('答えられない') ||
          lower.includes('できない') ||
          lower.includes('無理')
        ) {
          store.setCounterExampleUnanswered(true);
          store.addEngineTurn('反例に応答できないことが確認されました。', 'COUNTER');
        } else {
          const raw = await router.complete(buildCounterPrompt(claim!, premises));
          const parsed = extractJSON(raw) as {
            counterExample: string;
            question: string;
          };
          store.addEngineTurn(
            `${parsed.counterExample}\n\n${parsed.question}`,
            'COUNTER',
          );
          store.setCurrentQuestion(parsed.question);
        }
        break;
      }

      case 'REFINEMENT': {
        store.setRefinedClaim(userInput);
        store.setClaim(userInput);
        // reset premises for re-examination
        useSessionStore.setState({
          premises: [],
          definitions: [],
          contradictions: [],
          consistencyChecked: false,
          userSelectedRefinement: false,
          counterExampleUnanswered: false,
          undefinedKeyTerms: [],
        });
        store.addEngineTurn(
          `主張を「${userInput}」に修正しました。改めて根拠を検討します。`,
          'REFINEMENT',
        );
        break;
      }

      default:
        break;
    }

    // フェーズ遷移を評価
    await maybeTransition();
    await useSessionStore.getState().persistSession();
  } catch (e) {
    store.setError(e instanceof Error ? e.message : String(e));
  } finally {
    store.setLoading(false);
  }
}

async function maybeTransition(): Promise<void> {
  const store = useSessionStore.getState();
  const next = evalTransition(store.currentPhase, store);
  if (!next || next === store.currentPhase) return;

  store.setPhase(next);
  await afterTransition(next);
}

async function afterTransition(phase: Phase): Promise<void> {
  const store = useSessionStore.getState();
  const { claim, premises, definitions, contradictions, preferredTier, apiKey } = store;
  const router = createRouter(preferredTier, () => apiKey);

  switch (phase) {
    case 'DEFINITION': {
      const terms = store.undefinedKeyTerms;
      if (terms.length > 0) {
        const raw = await router.complete(
          buildDefinitionPrompt(claim!, terms[0], definitions),
        );
        const parsed = extractJSON(raw) as { question: string };
        store.addEngineTurn(parsed.question, 'DEFINITION');
        store.setCurrentQuestion(parsed.question);
      }
      break;
    }

    case 'PREMISES': {
      const raw = await router.complete(
        buildPremisesPrompt(claim!, definitions, premises),
      );
      const parsed = extractJSON(raw) as { question: string };
      store.addEngineTurn(parsed.question, 'PREMISES');
      store.setCurrentQuestion(parsed.question);
      break;
    }

    case 'CONSISTENCY': {
      const raw = await router.complete(buildConsistencyPrompt(premises));
      const parsed = extractJSON(raw) as {
        hasContradiction: boolean;
        contradictions: { premiseA: string; premiseB: string; explanation: string }[];
        followUpQuestion?: string;
      };
      if (parsed.hasContradiction && parsed.contradictions?.length > 0) {
        for (const c of parsed.contradictions) {
          const pa = premises.find((p) => p.content === c.premiseA) ?? premises[0];
          const pb = premises.find((p) => p.content === c.premiseB) ?? premises[1];
          store.addContradiction({
            premiseAId: pa.id,
            premiseBId: pb.id,
            explanation: c.explanation,
          });
        }
        store.addEngineTurn('前提の中に矛盾が見つかりました。', 'CONSISTENCY', {
          contradictionDetected: true,
        });
        await maybeTransition();
      } else {
        store.setConsistencyChecked(true);
        const q = parsed.followUpQuestion ?? '整合性は確認できました。反例の検討に移ります。';
        store.addEngineTurn(q, 'CONSISTENCY');
        await maybeTransition();
      }
      break;
    }

    case 'COUNTER': {
      const raw = await router.complete(buildCounterPrompt(claim!, premises));
      const parsed = extractJSON(raw) as {
        counterExample: string;
        question: string;
      };
      store.addEngineTurn(
        `${parsed.counterExample}\n\n${parsed.question}`,
        'COUNTER',
      );
      store.setCurrentQuestion(parsed.question);
      break;
    }

    case 'APORIA': {
      const raw = await router.complete(buildAporiaPrompt(claim!, contradictions));
      const parsed = extractJSON(raw) as { summary: string; message: string };
      store.addEngineTurn(`${parsed.summary}\n\n${parsed.message}`, 'APORIA');
      store.setConclusion({
        type: 'aporia',
        summary: parsed.summary,
        finalClaim: null,
      });
      await maybeTransition();
      break;
    }

    case 'RESOLUTION': {
      store.addEngineTurn(
        'セッションを終了しました。このアポリアは思索の終わりではなく、始まりです。',
        'RESOLUTION',
      );
      await useSessionStore.getState().persistSession();
      break;
    }

    default:
      break;
  }
}

// 最初のセッション開始時にエンジンが最初の問いを発する
export async function startElenchus(claim: string): Promise<void> {
  const store = useSessionStore.getState();
  store.setLoading(true);
  store.setError(null);

  try {
    await store.startSession(claim);
    const router = createRouter(store.preferredTier, () => store.apiKey);

    const raw = await router.complete(buildClaimPrompt(claim));
    const parsed = extractJSON(raw) as {
      normalizedClaim: string;
      keyTerms: string[];
    };

    store.setClaim(parsed.normalizedClaim);
    store.setUndefinedKeyTerms(parsed.keyTerms ?? []);
    store.confirmClaim();

    store.addEngineTurn(
      `主張：「${parsed.normalizedClaim}」\n\nでは問答を始めましょう。`,
      'CLAIM',
    );

    await maybeTransition();
    await useSessionStore.getState().persistSession();
  } catch (e) {
    store.setError(e instanceof Error ? e.message : String(e));
  } finally {
    store.setLoading(false);
  }
}
