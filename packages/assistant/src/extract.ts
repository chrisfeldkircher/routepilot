import type { StepDefinition, TourDefinition } from '@routepilot/engine';
import type { StepAssistantMeta } from './types';

export interface ExtractedStepText {
  title: string;
  body: string;
  chapter: string;
  meta: string;
  assistant: string;
}

export type StepTextExtractor = (
  step: StepDefinition,
  tour: TourDefinition,
) => Partial<ExtractedStepText> | null | undefined;

export function defaultExtractStepText(step: StepDefinition): ExtractedStepText {
  const title = pickString(step.title) ?? pickContentField(step.content, 'title') ?? '';
  const body = pickString(step.body) ?? pickContentField(step.content, 'body') ?? '';
  const chapter = pickString(step.chapter) ?? '';
  const meta = step.meta ? stringifyMeta(step.meta) : '';
  const assistantMeta = readAssistantMeta(step);
  const assistantRecord = readAssistantRecord(step.meta?.assistant);
  const assistant = [
    assistantMeta ? stringifyAssistantMeta(assistantMeta) : '',
    assistantRecord ? stringifyLooseAssistantMeta(assistantRecord) : '',
  ]
    .filter(Boolean)
    .join(' ');
  return { title, body, chapter, meta, assistant };
}

export function readAssistantMeta(step: StepDefinition): StepAssistantMeta | undefined {
  const meta = step.meta;
  if (!meta) return undefined;

  const nested = readAssistantRecord(meta.assistant);

  const keywords = normalizeStringArray(
    nested?.keywords ?? meta.assistantKeywords,
  );
  const aliases = normalizeStringArray(
    nested?.aliases ?? meta.assistantAliases,
  );
  const errorPatterns = normalizePatternArray(
    nested?.errorPatterns ?? meta.assistantErrorPatterns,
  );
  const intent = normalizeIntent(
    nested?.intent ?? meta.assistantIntent,
  );
  const chapterSummary =
    pickString(nested?.chapterSummary) ??
    pickString(meta.assistantChapterSummary) ??
    '';
  const disabled =
    (typeof nested?.disabled === 'boolean' && nested.disabled) ||
    meta.assistantDisabled === true;

  if (
    keywords.length === 0 &&
    aliases.length === 0 &&
    errorPatterns.length === 0 &&
    intent.length === 0 &&
    !chapterSummary &&
    !disabled
  ) {
    return undefined;
  }

  return {
    keywords: keywords.length > 0 ? keywords : undefined,
    aliases: aliases.length > 0 ? aliases : undefined,
    errorPatterns: errorPatterns.length > 0 ? errorPatterns : undefined,
    intent: intent.length > 0 ? intent : undefined,
    chapterSummary: chapterSummary || undefined,
    disabled,
  };
}

function pickString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.length > 0 ? value : undefined;
}

function pickContentField(
  content: StepDefinition['content'],
  field: 'title' | 'body',
): string | undefined {
  if (!content || typeof content === 'function') return undefined;
  const value = (content as unknown as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : undefined;
}

function stringifyMeta(meta: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(meta)) {
    if (key === 'assistant') continue;
    if (typeof value === 'string') parts.push(value);
    else if (Array.isArray(value)) {
      for (const v of value) if (typeof v === 'string') parts.push(v);
    }
  }
  return parts.join(' ');
}

function stringifyAssistantMeta(meta: StepAssistantMeta): string {
  const parts: string[] = [];
  if (meta.chapterSummary) parts.push(meta.chapterSummary);
  if (meta.intent) {
    parts.push(...(Array.isArray(meta.intent) ? meta.intent : [meta.intent]));
  }
  if (meta.keywords) parts.push(...meta.keywords);
  if (meta.aliases) parts.push(...meta.aliases);
  if (meta.errorPatterns) {
    for (const pattern of meta.errorPatterns) {
      parts.push(typeof pattern === 'string' ? pattern : pattern.source);
    }
  }
  return parts.join(' ');
}

function stringifyLooseAssistantMeta(meta: Record<string, unknown>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(meta)) {
    if (
      key === 'keywords' ||
      key === 'aliases' ||
      key === 'errorPatterns' ||
      key === 'intent' ||
      key === 'chapterSummary' ||
      key === 'disabled'
    ) {
      continue;
    }

    parts.push(...collectStringValues(value));
  }

  return parts.join(' ');
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function readAssistantRecord(value: unknown): Record<string, unknown> | undefined {
  return readRecord(value);
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.length > 0 ? [value] : [];
  }

  if (value instanceof RegExp) {
    return [value.source];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStringValues(item));
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((item) => collectStringValues(item));
  }

  return [];
}

function normalizeStringArray(value: unknown): string[] {
  if (typeof value === 'string') return value.length > 0 ? [value] : [];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function normalizePatternArray(value: unknown): Array<string | RegExp> {
  if (typeof value === 'string' || value instanceof RegExp) return [value];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string | RegExp =>
      typeof item === 'string' || item instanceof RegExp,
  );
}

function normalizeIntent(value: unknown): string[] {
  if (typeof value === 'string') return value.length > 0 ? [value] : [];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}
