import type { Phase } from '../types';
import type { SessionState } from './types';

export interface TransitionRule {
  from: Phase;
  condition: (state: SessionState) => boolean;
  to: Phase;
}

export const TRANSITION_RULES: TransitionRule[] = [
  {
    from: 'CLAIM',
    condition: (s) => s.claim !== null && s.claimConfirmed,
    to: 'DEFINITION',
  },
  {
    from: 'DEFINITION',
    condition: (s) => s.undefinedKeyTerms.length === 0,
    to: 'PREMISES',
  },
  {
    from: 'PREMISES',
    condition: (s) => s.premises.length >= 2,
    to: 'CONSISTENCY',
  },
  {
    from: 'CONSISTENCY',
    condition: (s) => s.contradictions.length > 0,
    to: 'APORIA',
  },
  {
    from: 'CONSISTENCY',
    condition: (s) => s.contradictions.length === 0 && s.consistencyChecked,
    to: 'COUNTER',
  },
  {
    from: 'COUNTER',
    condition: (s) => s.userSelectedRefinement,
    to: 'REFINEMENT',
  },
  {
    from: 'COUNTER',
    condition: (s) => s.counterExampleUnanswered,
    to: 'APORIA',
  },
  {
    from: 'REFINEMENT',
    condition: (s) => s.refinedClaim !== null,
    to: 'PREMISES',
  },
  {
    from: 'APORIA',
    condition: () => true,
    to: 'RESOLUTION',
  },
];

export function evalTransition(phase: Phase, state: SessionState): Phase | null {
  for (const rule of TRANSITION_RULES) {
    if (rule.from === phase && rule.condition(state)) {
      return rule.to;
    }
  }
  return null;
}
