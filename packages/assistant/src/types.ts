import type { StepDefinition, TourDefinition } from '@routepilot/engine';
import type { StepTextExtractor } from './extract';
import type { TokenizeOptions } from './tokenize';

export interface FieldWeights {
  title?: number;
  body?: number;
  chapter?: number;
  meta?: number;
  assistant?: number;
}

export type AssistantSynonymMap = Record<string, string | string[]>;

export interface StepAssistantMeta {
  keywords?: string[];
  aliases?: string[];
  errorPatterns?: Array<string | RegExp>;
  intent?: string | string[];
  chapterSummary?: string;
  disabled?: boolean;
}

export type AssistantSearchScope =
  | 'all-tours'
  | 'current-tour-only'
  | 'current-tour-first';

export type AssistantResultKind = 'step' | 'chapter';

export interface TourIndexOptions {
  /** BM25 k1 term-saturation parameter. Default 1.5. */
  k1?: number;
  /** BM25 b length-normalization parameter. Default 0.75. */
  b?: number;
  /** Weights applied by repeating each field's tokens N times when indexing. */
  fieldWeights?: FieldWeights;
  /** Override for how searchable text is pulled off each step. */
  extract?: StepTextExtractor;
  /** Passed through to the tokenizer. */
  tokenize?: TokenizeOptions;
  /** Optional app-level synonym dictionary used to expand query terms. */
  synonyms?: AssistantSynonymMap;
  /** Optional async/sync reranker applied on top of lexical retrieval. */
  reranker?: (args: AssistantRerankArgs) => AssistantMatch[] | Promise<AssistantMatch[]>;
}

export interface QueryOptions {
  /** Maximum number of matches to return. Default 5. */
  limit?: number;
  /** Restrict matches to these tour ids. */
  tourIds?: string[];
  /** Minimum score required; matches below are dropped. */
  minScore?: number;
  /** Current active tour, used for current-tour filtering or prioritization. */
  currentTourId?: string;
  /** Search scope relative to the active tour. Default `all-tours`. */
  scope?: AssistantSearchScope;
}

export interface AssistantMatch {
  kind?: AssistantResultKind;
  tourId: string;
  stepId: string;
  score: number;
  title: string;
  snippet: string;
  chapter?: string;
  stepCount?: number;
  matchedStepIds?: string[];
  step: StepDefinition;
  tour: TourDefinition;
}

export interface AssistantRerankArgs {
  question: string;
  queryTokens: string[];
  matches: AssistantMatch[];
  currentTourId?: string;
  scope: AssistantSearchScope;
  options: QueryOptions;
}
