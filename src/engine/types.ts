// minimal snapshot of SessionState needed by transition rules
export interface SessionState {
  claim: string | null;
  claimConfirmed: boolean;
  undefinedKeyTerms: string[];
  premises: { id: string; content: string }[];
  contradictions: unknown[];
  consistencyChecked: boolean;
  userSelectedRefinement: boolean;
  counterExampleUnanswered: boolean;
  refinedClaim: string | null;
}
