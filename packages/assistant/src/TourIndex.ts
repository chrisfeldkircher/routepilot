import type { StepDefinition, TourDefinition } from '@routepilot/engine';
import { Bm25Index } from './bm25';
import {
  defaultExtractStepText,
  readAssistantMeta,
  type ExtractedStepText,
} from './extract';
import { tokenize } from './tokenize';
import type {
  AssistantMatch,
  AssistantSearchScope,
  AssistantSynonymMap,
  FieldWeights,
  QueryOptions,
  TourIndexOptions,
} from './types';

interface Entry {
  key: string;
  tourId: string;
  stepId: string;
  tour: TourDefinition;
  step: StepDefinition;
  extracted: ExtractedStepText;
}

interface ChapterEntry {
  key: string;
  tourId: string;
  chapter: string;
  tour: TourDefinition;
  step: StepDefinition;
  stepId: string;
  entries: Entry[];
  summary: string;
}

const DEFAULT_FIELD_WEIGHTS: Required<FieldWeights> = {
  title: 3,
  body: 1,
  chapter: 1,
  meta: 1,
  assistant: 2,
};

export class TourIndex {
  private readonly bm25: Bm25Index;
  private readonly chapterBm25: Bm25Index;
  private readonly entries = new Map<string, Entry>();
  private readonly chapterEntries = new Map<string, Entry[]>();
  private readonly chapters = new Map<string, ChapterEntry>();
  private readonly options: TourIndexOptions;
  private readonly tokenizeOptions;
  private readonly fieldWeights: Required<FieldWeights>;
  private readonly extract: NonNullable<TourIndexOptions['extract']>;
  private readonly synonymMap: Map<string, string[]>;

  constructor(options: TourIndexOptions = {}) {
    this.options = options;
    this.bm25 = new Bm25Index({ k1: options.k1, b: options.b });
    this.chapterBm25 = new Bm25Index({ k1: options.k1, b: options.b });
    this.tokenizeOptions = options.tokenize ?? {};
    this.fieldWeights = { ...DEFAULT_FIELD_WEIGHTS, ...options.fieldWeights };
    this.extract = options.extract ?? defaultExtractStepText;
    this.synonymMap = buildSynonymMap(options.synonyms, this.tokenizeOptions);
  }

  static fromTours(
    tours: TourDefinition[],
    options?: TourIndexOptions,
  ): TourIndex {
    const index = new TourIndex(options);
    index.addTours(tours);
    return index;
  }

  addTours(tours: TourDefinition[]): void {
    for (const tour of tours) this.addTour(tour);
  }

  addTour(tour: TourDefinition): void {
    const touchedChapterKeys = new Set<string>();

    for (const step of tour.steps) {
      const key = entryKey(tour.id, step.id);
      if (this.entries.has(key)) continue;
      if (readAssistantMeta(step)?.disabled) continue;

      const override = this.extract(step, tour) ?? undefined;
      const base = defaultExtractStepText(step);
      const extracted: ExtractedStepText = {
        title: override?.title ?? base.title,
        body: override?.body ?? base.body,
        chapter: override?.chapter ?? base.chapter,
        meta: override?.meta ?? base.meta,
        assistant: override?.assistant ?? base.assistant,
      };

      const tokens = this.buildTokens(extracted);
      if (tokens.length === 0) continue;

      this.entries.set(key, { key, tourId: tour.id, stepId: step.id, tour, step, extracted });
      if (extracted.chapter) {
        const chapterKey = entryChapterKey(tour.id, extracted.chapter);
        const chapterEntries = this.chapterEntries.get(chapterKey) ?? [];
        chapterEntries.push({ key, tourId: tour.id, stepId: step.id, tour, step, extracted });
        this.chapterEntries.set(chapterKey, chapterEntries);
        touchedChapterKeys.add(chapterKey);
      }
      this.bm25.add({ id: key, tokens });
    }

    for (const chapterKey of touchedChapterKeys) {
      if (this.chapters.has(chapterKey)) continue;
      const chapterEntry = this.buildChapterEntry(chapterKey);
      if (!chapterEntry) continue;
      this.chapters.set(chapterKey, chapterEntry);
      this.chapterBm25.add({
        id: chapterKey,
        tokens: this.buildTokens({
          title: chapterEntry.chapter,
          body: '',
          chapter: chapterEntry.chapter,
          meta: '',
          assistant: chapterEntry.summary,
        }),
      });
    }
  }

  size(): number {
    return this.entries.size;
  }

  query(question: string, options: QueryOptions = {}): AssistantMatch[] {
    const { matches, tokens, scope } = this.buildMatches(question, options);
    return this.finalizeMatches(matches, tokens, options, scope);
  }

  async queryAsync(
    question: string,
    options: QueryOptions = {},
  ): Promise<AssistantMatch[]> {
    const { matches, tokens, scope } = this.buildMatches(question, options);
    if (matches.length === 0) return matches;

    const rerankedMatches = this.options.reranker
      ? await this.options.reranker({
          question,
          queryTokens: tokens,
          matches,
          currentTourId: options.currentTourId,
          scope,
          options,
        })
      : matches;

    return this.finalizeMatches(rerankedMatches, tokens, options, scope);
  }

  private buildTokens(text: ExtractedStepText): string[] {
    const tokens: string[] = [];
    for (const [field, weight] of Object.entries(this.fieldWeights) as [
      keyof ExtractedStepText,
      number,
    ][]) {
      const value = text[field];
      if (!value) continue;
      const fieldTokens = tokenize(value, this.tokenizeOptions);
      for (let i = 0; i < weight; i += 1) tokens.push(...fieldTokens);
    }
    return tokens;
  }

  private expandQueryTokens(tokens: string[]): string[] {
    if (tokens.length === 0 || this.synonymMap.size === 0) return tokens;

    const expanded = new Set(tokens);
    const queue = [...tokens];

    for (let i = 0; i < queue.length; i += 1) {
      const token = queue[i];
      const synonyms = this.synonymMap.get(token);
      if (!synonyms) continue;
      for (const synonym of synonyms) {
        if (expanded.has(synonym)) continue;
        expanded.add(synonym);
        queue.push(synonym);
      }
    }

    return [...expanded];
  }

  private buildMatches(
    question: string,
    options: QueryOptions,
  ): {
    matches: AssistantMatch[];
    tokens: string[];
    scope: AssistantSearchScope;
  } {
    const tokens = this.expandQueryTokens(tokenize(question, this.tokenizeOptions));
    const scope = resolveScope(options);
    if (tokens.length === 0) {
      return { matches: [], tokens, scope };
    }

    const limit = options.limit ?? 5;
    const rawLimit =
      options.tourIds?.length || scope === 'current-tour-first' ? limit * 4 : limit;
    const hits = this.bm25.search(tokens, rawLimit);

    const matches: AssistantMatch[] = [];
    for (const hit of hits) {
      if (options.minScore !== undefined && hit.score < options.minScore) continue;
      const entry = this.entries.get(hit.id);
      if (!entry) continue;
      if (!matchesScope(entry, options, scope)) continue;

      matches.push(buildStepMatch(entry, hit.score, tokens));
    }

    return {
      matches: prioritizeMatches(matches, options, scope),
      tokens,
      scope,
    };
  }

  private finalizeMatches(
    matches: AssistantMatch[],
    queryTokens: string[],
    options: QueryOptions,
    scope: AssistantSearchScope,
  ): AssistantMatch[] {
    const limit = options.limit ?? 5;
    const prioritizedMatches = prioritizeMatches(matches, options, scope);
    const chapterMatches = prioritizeMatches(
      dedupeChapterMatches(
        this.buildDirectChapterMatches(queryTokens, options, scope),
        this.buildChapterMatches(prioritizedMatches, queryTokens),
      ),
      options,
      scope,
    );
    if (prioritizedMatches.length === 0 && chapterMatches.length === 0) return [];

    const results: AssistantMatch[] = [];
    const displayedStepKeys = new Set<string>();
    const displayedChapterKeys = new Set<string>();

    for (const chapterMatch of chapterMatches) {
      if (results.length >= limit) break;
      results.push(chapterMatch);
      displayedChapterKeys.add(entryChapterKey(chapterMatch.tourId, chapterMatch.chapter ?? ''));
      displayedStepKeys.add(entryKey(chapterMatch.tourId, chapterMatch.stepId));

      for (const siblingMatch of this.expandChapterMatch(chapterMatch, queryTokens)) {
        if (results.length >= limit) break;
        const siblingKey = entryKey(siblingMatch.tourId, siblingMatch.stepId);
        if (displayedStepKeys.has(siblingKey)) continue;
        results.push(siblingMatch);
        displayedStepKeys.add(siblingKey);
      }
    }

    for (const match of prioritizedMatches) {
      if (results.length >= limit) break;
      const stepKey = entryKey(match.tourId, match.stepId);
      const chapterKey = match.chapter
        ? entryChapterKey(match.tourId, match.chapter)
        : '';
      if (displayedStepKeys.has(stepKey)) continue;
      if (chapterKey && displayedChapterKeys.has(chapterKey)) continue;
      results.push(match);
      displayedStepKeys.add(stepKey);
    }

    return results.slice(0, limit);
  }

  private buildDirectChapterMatches(
    queryTokens: string[],
    options: QueryOptions,
    scope: AssistantSearchScope,
  ): AssistantMatch[] {
    if (queryTokens.length === 0 || this.chapters.size === 0) return [];

    const limit = options.limit ?? 5;
    const rawLimit =
      options.tourIds?.length || scope === 'current-tour-first' ? limit * 4 : limit;
    const hits = this.chapterBm25.search(queryTokens, rawLimit);
    const matches: AssistantMatch[] = [];

    for (const hit of hits) {
      if (options.minScore !== undefined && hit.score < options.minScore) continue;
      const chapter = this.chapters.get(hit.id);
      if (!chapter) continue;
      if (!matchesScope(chapter, options, scope)) continue;
      matches.push({
        kind: 'chapter',
        tourId: chapter.tourId,
        stepId: chapter.stepId,
        score: hit.score,
        title: `${chapter.chapter} flow`,
        snippet: buildChapterSnippet(
          chapter.chapter,
          chapter.entries.length,
          chapter.entries
            .map((entry) => entry.extracted.title)
            .filter(Boolean)
            .slice(0, 3),
          chapter.summary,
        ),
        chapter: chapter.chapter,
        stepCount: chapter.entries.length,
        matchedStepIds: chapter.entries.map((entry) => entry.stepId),
        step: chapter.step,
        tour: chapter.tour,
      });
    }

    return matches;
  }

  private buildChapterMatches(
    matches: AssistantMatch[],
    queryTokens: string[],
  ): AssistantMatch[] {
    if (queryTokens.length === 0) return [];

    const queryTokenSet = new Set(queryTokens);
    const grouped = new Map<string, AssistantMatch[]>();

    for (const match of matches) {
      if (!match.chapter) continue;
      const chapterKey = entryChapterKey(match.tourId, match.chapter);
      const chapterMatches = grouped.get(chapterKey) ?? [];
      chapterMatches.push(match);
      grouped.set(chapterKey, chapterMatches);
    }

    const chapterResults: AssistantMatch[] = [];
    for (const [chapterKey, chapterMatches] of grouped.entries()) {
      const chapterEntries = this.chapterEntries.get(chapterKey);
      const chapter = this.chapters.get(chapterKey);
      if (!chapterEntries || chapterEntries.length < 2) continue;

      const chapterName = chapterMatches[0]?.chapter ?? '';
      if (!chapterName) continue;

      const chapterTokens = tokenize(chapterName, this.tokenizeOptions);
      const hasChapterOverlap = chapterTokens.some((token) => queryTokenSet.has(token));
      if (!hasChapterOverlap) continue;

      const anchorEntry = chapterEntries[0];
      const topScore = chapterMatches[0]?.score ?? 0;
      const aggregateScore =
        topScore + 1 + Math.min(chapterEntries.length, 6) * 0.05;
      const matchedStepIds = chapterMatches.map((match) => match.stepId);
      const matchedTitles = chapterMatches
        .map((match) => match.title)
        .filter((title, index, titles) => title && titles.indexOf(title) === index)
        .slice(0, 3);

      chapterResults.push({
        kind: 'chapter',
        tourId: anchorEntry.tourId,
        stepId: anchorEntry.stepId,
        score: aggregateScore,
        title: `${chapterName} flow`,
        snippet: buildChapterSnippet(
          chapterName,
          chapterEntries.length,
          matchedTitles,
          chapter?.summary,
        ),
        chapter: chapterName,
        stepCount: chapterEntries.length,
        matchedStepIds,
        step: anchorEntry.step,
        tour: anchorEntry.tour,
      });
    }

    return chapterResults.sort((left, right) => right.score - left.score);
  }

  private expandChapterMatch(
    chapterMatch: AssistantMatch,
    queryTokens: string[],
  ): AssistantMatch[] {
    if (!chapterMatch.chapter) return [];

    const chapterEntries = this.chapterEntries.get(
      entryChapterKey(chapterMatch.tourId, chapterMatch.chapter),
    );
    if (!chapterEntries) return [];

    let nextScore = chapterMatch.score - 0.01;
    const siblings: AssistantMatch[] = [];
    for (const entry of chapterEntries) {
      if (entry.stepId === chapterMatch.stepId) continue;
      siblings.push({
        ...buildStepMatch(entry, nextScore, queryTokens),
        score: nextScore,
      });
      nextScore -= 0.01;
    }

    return siblings;
  }

  private buildChapterEntry(chapterKey: string): ChapterEntry | null {
    const entries = this.chapterEntries.get(chapterKey);
    if (!entries || entries.length === 0) return null;

    const anchorEntry = entries[0];
    const summary = uniqueCompact(
      entries.flatMap((entry) => {
        const assistantMeta = readAssistantMeta(entry.step);
        return [
          entry.extracted.assistant,
          assistantMeta?.chapterSummary,
          ...(assistantMeta?.keywords ?? []),
          ...(assistantMeta?.aliases ?? []),
          ...(assistantMeta?.intent
            ? Array.isArray(assistantMeta.intent)
              ? assistantMeta.intent
              : [assistantMeta.intent]
            : []),
          ...(assistantMeta?.errorPatterns ?? []).map((pattern) =>
            typeof pattern === 'string' ? pattern : pattern.source,
          ),
        ];
      }),
    ).join(' ');

    return {
      key: chapterKey,
      tourId: anchorEntry.tourId,
      chapter: anchorEntry.extracted.chapter,
      tour: anchorEntry.tour,
      step: anchorEntry.step,
      stepId: anchorEntry.stepId,
      entries,
      summary,
    };
  }
}

function entryKey(tourId: string, stepId: string): string {
  return `${tourId}::${stepId}`;
}

function entryChapterKey(tourId: string, chapter: string): string {
  return `${tourId}::chapter::${chapter}`;
}

function buildStepMatch(
  entry: Entry,
  score: number,
  queryTokens: string[],
): AssistantMatch {
  return {
    kind: 'step',
    tourId: entry.tourId,
    stepId: entry.stepId,
    score,
    title: entry.extracted.title,
    snippet: buildSnippet(entry.extracted, queryTokens),
    chapter: entry.extracted.chapter || undefined,
    step: entry.step,
    tour: entry.tour,
  };
}

function resolveScope(options: QueryOptions): AssistantSearchScope {
  return options.scope ?? 'all-tours';
}

function matchesScope(
  entry: Pick<Entry, 'tourId'> | Pick<ChapterEntry, 'tourId'>,
  options: QueryOptions,
  scope: AssistantSearchScope,
): boolean {
  if (options.tourIds && !options.tourIds.includes(entry.tourId)) return false;
  if (scope === 'current-tour-only' && options.currentTourId) {
    return entry.tourId === options.currentTourId;
  }
  return true;
}

function prioritizeMatches(
  matches: AssistantMatch[],
  options: QueryOptions,
  scope: AssistantSearchScope,
): AssistantMatch[] {
  if (scope !== 'current-tour-first' || !options.currentTourId) {
    return matches;
  }

  const currentTourMatches = matches.filter(
    (match) => match.tourId === options.currentTourId,
  );
  const otherMatches = matches.filter(
    (match) => match.tourId !== options.currentTourId,
  );
  return [...currentTourMatches, ...otherMatches];
}

function buildSnippet(text: ExtractedStepText, queryTokens: string[]): string {
  const haystack = [
    text.body,
    text.title,
    text.chapter,
    text.assistant,
  ]
    .filter(Boolean)
    .join(' — ');
  if (!haystack) return '';
  if (haystack.length <= 160) return haystack;

  const needles = new Set(queryTokens);
  const words = haystack.split(/\s+/);
  const lowered = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''));

  let bestIndex = 0;
  let bestHits = 0;
  const window = 24;
  for (let i = 0; i < lowered.length; i += 1) {
    let hits = 0;
    for (let j = i; j < Math.min(i + window, lowered.length); j += 1) {
      if (needles.has(lowered[j])) hits += 1;
    }
    if (hits > bestHits) {
      bestHits = hits;
      bestIndex = i;
    }
  }

  const slice = words.slice(bestIndex, bestIndex + window).join(' ');
  const prefix = bestIndex > 0 ? '… ' : '';
  const suffix = bestIndex + window < words.length ? ' …' : '';
  return `${prefix}${slice}${suffix}`;
}

function buildChapterSnippet(
  chapterName: string,
  stepCount: number,
  matchedTitles: string[],
  summary?: string,
): string {
  const intro = `${stepCount} steps in ${chapterName}.`;
  const detail = summary?.trim();
  if (detail) return `${intro} ${detail}`;
  if (matchedTitles.length === 0) return intro;
  return `${intro} Includes ${matchedTitles.join(', ')}.`;
}

function dedupeChapterMatches(...chapterGroups: AssistantMatch[][]): AssistantMatch[] {
  const deduped = new Map<string, AssistantMatch>();

  for (const group of chapterGroups) {
    for (const match of group) {
      if (match.kind !== 'chapter' || !match.chapter) continue;
      const key = entryChapterKey(match.tourId, match.chapter);
      const existing = deduped.get(key);
      if (!existing || match.score > existing.score) {
        deduped.set(key, match);
      }
    }
  }

  return [...deduped.values()].sort((left, right) => right.score - left.score);
}

function uniqueCompact(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function buildSynonymMap(
  synonyms: AssistantSynonymMap | undefined,
  tokenizeOptions: TourIndexOptions['tokenize'],
): Map<string, string[]> {
  const map = new Map<string, Set<string>>();
  if (!synonyms) return new Map();

  for (const [rawSource, rawTargets] of Object.entries(synonyms)) {
    const groupTokens = new Set<string>();
    for (const token of tokenize(rawSource, tokenizeOptions ?? {})) {
      groupTokens.add(token);
    }

    const targets = Array.isArray(rawTargets) ? rawTargets : [rawTargets];
    for (const target of targets) {
      for (const token of tokenize(target, tokenizeOptions ?? {})) {
        groupTokens.add(token);
      }
    }

    const normalizedGroup = [...groupTokens];
    for (const token of normalizedGroup) {
      const related = map.get(token) ?? new Set<string>();
      for (const relatedToken of normalizedGroup) {
        if (relatedToken !== token) related.add(relatedToken);
      }
      map.set(token, related);
    }
  }

  return new Map(
    [...map.entries()].map(([token, related]) => [token, [...related]]),
  );
}
