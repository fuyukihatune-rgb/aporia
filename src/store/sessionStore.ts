import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { db } from '../db/database';
import type {
  Phase,
  Turn,
  TurnMetadata,
  Premise,
  Definition,
  Contradiction,
  Conclusion,
} from '../types';

interface SessionState {
  // session data
  sessionId: number | null;
  claim: string | null;
  claimConfirmed: boolean;
  currentPhase: Phase;
  turns: Turn[];
  premises: Premise[];
  definitions: Definition[];
  contradictions: Contradiction[];
  undefinedKeyTerms: string[];
  conclusion: Conclusion | null;

  // engine control flags
  consistencyChecked: boolean;
  userSelectedRefinement: boolean;
  counterExampleUnanswered: boolean;
  refinedClaim: string | null;

  // UI state
  isLoading: boolean;
  modelLoadProgress: number;
  currentQuestion: string | null;
  error: string | null;

  // LLM settings
  preferredTier: 1 | 2 | 3;
  apiKey: string;

  // actions
  setClaim: (claim: string) => void;
  confirmClaim: () => void;
  addUserTurn: (content: string) => void;
  addEngineTurn: (content: string, phase: Phase, meta?: TurnMetadata) => void;
  addPremise: (premise: string, turnId: string) => void;
  addDefinition: (term: string, definition: string, turnId: string) => void;
  addContradiction: (c: Omit<Contradiction, 'detectedAt'>) => void;
  setPhase: (phase: Phase) => void;
  setConclusion: (c: Conclusion) => void;
  setUndefinedKeyTerms: (terms: string[]) => void;
  setConsistencyChecked: (v: boolean) => void;
  setUserSelectedRefinement: (v: boolean) => void;
  setCounterExampleUnanswered: (v: boolean) => void;
  setRefinedClaim: (claim: string) => void;
  setLoading: (v: boolean) => void;
  setModelLoadProgress: (progress: number) => void;
  setCurrentQuestion: (q: string | null) => void;
  setError: (e: string | null) => void;
  setPreferredTier: (t: 1 | 2 | 3) => void;
  setApiKey: (k: string) => void;
  startSession: (claim: string) => Promise<void>;
  loadSession: (id: number) => Promise<void>;
  persistSession: () => Promise<void>;
  resetSession: () => void;
}

const INITIAL: Omit<
  SessionState,
  | 'setClaim' | 'confirmClaim' | 'addUserTurn' | 'addEngineTurn'
  | 'addPremise' | 'addDefinition' | 'addContradiction'
  | 'setPhase' | 'setConclusion' | 'setUndefinedKeyTerms'
  | 'setConsistencyChecked' | 'setUserSelectedRefinement'
  | 'setCounterExampleUnanswered' | 'setRefinedClaim'
  | 'setLoading' | 'setModelLoadProgress' | 'setCurrentQuestion'
  | 'setError' | 'setPreferredTier' | 'setApiKey'
  | 'startSession' | 'loadSession' | 'persistSession' | 'resetSession'
> = {
  sessionId: null,
  claim: null,
  claimConfirmed: false,
  currentPhase: 'IDLE',
  turns: [],
  premises: [],
  definitions: [],
  contradictions: [],
  undefinedKeyTerms: [],
  conclusion: null,
  consistencyChecked: false,
  userSelectedRefinement: false,
  counterExampleUnanswered: false,
  refinedClaim: null,
  isLoading: false,
  modelLoadProgress: 0,
  currentQuestion: null,
  error: null,
  preferredTier: 2,
  apiKey: localStorage.getItem('aporia:apiKey') ?? '',
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...INITIAL,

  setClaim: (claim) => set({ claim }),
  confirmClaim: () => set({ claimConfirmed: true }),

  addUserTurn: (content) => {
    const turn: Turn = {
      id: nanoid(),
      phase: get().currentPhase,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    set((s) => ({ turns: [...s.turns, turn] }));
  },

  addEngineTurn: (content, phase, meta) => {
    const turn: Turn = {
      id: nanoid(),
      phase,
      role: 'engine',
      content,
      timestamp: new Date(),
      metadata: meta,
    };
    set((s) => ({ turns: [...s.turns, turn] }));
  },

  addPremise: (premise, turnId) =>
    set((s) => ({
      premises: [
        ...s.premises,
        { id: nanoid(), content: premise, derivedAt: new Date(), turnId },
      ],
    })),

  addDefinition: (term, definition, turnId) =>
    set((s) => ({
      definitions: [...s.definitions, { term, definition, turnId }],
      undefinedKeyTerms: s.undefinedKeyTerms.filter((t) => t !== term),
    })),

  addContradiction: (c) =>
    set((s) => ({
      contradictions: [
        ...s.contradictions,
        { ...c, detectedAt: new Date() },
      ],
    })),

  setPhase: (phase) => set({ currentPhase: phase }),
  setConclusion: (conclusion) => set({ conclusion }),
  setUndefinedKeyTerms: (undefinedKeyTerms) => set({ undefinedKeyTerms }),
  setConsistencyChecked: (consistencyChecked) => set({ consistencyChecked }),
  setUserSelectedRefinement: (userSelectedRefinement) => set({ userSelectedRefinement }),
  setCounterExampleUnanswered: (counterExampleUnanswered) => set({ counterExampleUnanswered }),
  setRefinedClaim: (refinedClaim) => set({ refinedClaim }),
  setLoading: (isLoading) => set({ isLoading }),
  setModelLoadProgress: (modelLoadProgress) => set({ modelLoadProgress }),
  setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
  setError: (error) => set({ error }),
  setPreferredTier: (preferredTier) => set({ preferredTier }),
  setApiKey: (apiKey) => {
    localStorage.setItem('aporia:apiKey', apiKey);
    set({ apiKey });
  },

  startSession: async (claim) => {
    const now = new Date();
    const id = await db.sessions.add({
      createdAt: now,
      updatedAt: now,
      claim,
      currentPhase: 'CLAIM',
      turns: [],
      premises: [],
      definitions: [],
      contradictions: [],
      conclusion: null,
      preferredTier: get().preferredTier,
    });
    set({
      ...INITIAL,
      sessionId: id as number,
      claim,
      currentPhase: 'CLAIM',
      preferredTier: get().preferredTier,
      apiKey: get().apiKey,
    });
  },

  loadSession: async (id) => {
    const s = await db.sessions.get(id);
    if (!s) return;
    set({
      ...INITIAL,
      sessionId: id,
      claim: s.claim,
      currentPhase: s.currentPhase,
      turns: s.turns,
      premises: s.premises,
      definitions: s.definitions,
      contradictions: s.contradictions,
      conclusion: s.conclusion,
      preferredTier: s.preferredTier,
      apiKey: get().apiKey,
      claimConfirmed: true,
    });
  },

  persistSession: async () => {
    const s = get();
    if (!s.sessionId) return;
    await db.sessions.update(s.sessionId, {
      updatedAt: new Date(),
      currentPhase: s.currentPhase,
      turns: s.turns,
      premises: s.premises,
      definitions: s.definitions,
      contradictions: s.contradictions,
      conclusion: s.conclusion,
    });
  },

  resetSession: () =>
    set({ ...INITIAL, preferredTier: get().preferredTier, apiKey: get().apiKey }),
}));
