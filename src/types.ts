export type Phase =
  | 'IDLE'
  | 'CLAIM'
  | 'DEFINITION'
  | 'PREMISES'
  | 'CONSISTENCY'
  | 'COUNTER'
  | 'REFINEMENT'
  | 'APORIA'
  | 'RESOLUTION';

export interface Turn {
  id: string;
  phase: Phase;
  role: 'engine' | 'user';
  content: string;
  timestamp: Date;
  metadata?: TurnMetadata;
}

export interface TurnMetadata {
  extractedPremise?: string;
  definedTerm?: string;
  contradictionDetected?: boolean;
}

export interface Premise {
  id: string;
  content: string;
  derivedAt: Date;
  turnId: string;
}

export interface Definition {
  term: string;
  definition: string;
  turnId: string;
}

export interface Contradiction {
  premiseAId: string;
  premiseBId: string;
  explanation: string;
  detectedAt: Date;
}

export interface Conclusion {
  type: 'aporia' | 'resolution' | 'refinement';
  summary: string;
  finalClaim: string | null;
}

export interface ExaminationSession {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
  claim: string;
  currentPhase: Phase;
  turns: Turn[];
  premises: Premise[];
  definitions: Definition[];
  contradictions: Contradiction[];
  conclusion: Conclusion | null;
  preferredTier: 1 | 2 | 3;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

export interface LLMGateway {
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  isAvailable(): Promise<boolean>;
  tier: 1 | 2 | 3;
}
