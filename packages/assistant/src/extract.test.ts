import { describe, it, expect } from 'vitest';
import type { StepDefinition } from '@routepilot/engine';
import { defaultExtractStepText, readAssistantMeta } from './extract';

const step = (overrides: Partial<StepDefinition>): StepDefinition => ({
  id: 's1',
  title: '',
  ...overrides,
});

describe('defaultExtractStepText', () => {
  it('pulls top-level title/body/chapter when present', () => {
    const result = defaultExtractStepText(step({
      title: 'Upload a file',
      body: 'Pick the CSV to import.',
      chapter: 'import',
    }));
    expect(result).toEqual({
      title: 'Upload a file',
      body: 'Pick the CSV to import.',
      chapter: 'import',
      meta: '',
      assistant: '',
    });
  });

  it('falls back to content.title and content.body when present', () => {
    const result = defaultExtractStepText(step({
      content: { title: 'From content', body: 'Content body' },
    }));
    expect(result.title).toBe('From content');
    expect(result.body).toBe('Content body');
  });

  it('prefers top-level title over content.title', () => {
    const result = defaultExtractStepText(step({
      title: 'Top title',
      content: { title: 'Content title', body: 'body' },
    }));
    expect(result.title).toBe('Top title');
  });

  it('skips non-string body values', () => {
    const result = defaultExtractStepText(step({
      title: 't',
      body: { jsx: true } as unknown,
    }));
    expect(result.body).toBe('');
  });

  it('skips content factory functions', () => {
    const result = defaultExtractStepText(step({
      content: () => ({ title: 'Never seen', body: 'Never seen' }),
    }));
    expect(result.title).toBe('');
    expect(result.body).toBe('');
  });

  it('flattens string metadata values into the meta field', () => {
    const result = defaultExtractStepText(step({
      title: 't',
      meta: { tag: 'billing', owners: ['alice', 'bob'], count: 3 },
    }));
    expect(result.meta).toBe('billing alice bob');
  });

  it('extracts assistant metadata into a dedicated assistant field', () => {
    const result = defaultExtractStepText(step({
      title: 'Upload failed',
      meta: {
        assistant: {
          keywords: ['upload', 'failed'],
          aliases: ['file error'],
          errorPatterns: ['network error', /E_UPLOAD_TIMEOUT/],
          intent: ['recovery', 'upload'],
          chapterSummary: 'Fix common upload issues.',
        },
      },
    }));

    expect(result.assistant).toContain('Fix common upload issues.');
    expect(result.assistant).toContain('upload');
    expect(result.assistant).toContain('file error');
    expect(result.assistant).toContain('E_UPLOAD_TIMEOUT');
  });

  it('indexes arbitrary string-like assistant metadata beyond the predefined fields', () => {
    const result = defaultExtractStepText(step({
      title: 'Upload failed',
      meta: {
        assistant: {
          faqQuestion: 'Why does my upload fail on iPhone photos?',
          helpLinks: ['attachment troubleshooting', 'camera uploads'],
          nested: {
            label: 'heic support',
          },
        },
      },
    }));

    expect(result.assistant).toContain('Why does my upload fail on iPhone photos?');
    expect(result.assistant).toContain('attachment troubleshooting');
    expect(result.assistant).toContain('heic support');
  });

  it('reads legacy flat assistant metadata fields', () => {
    const assistant = readAssistantMeta(step({
      meta: {
        assistantKeywords: ['upload'],
        assistantAliases: ['attachment failed'],
        assistantErrorPatterns: ['heic not allowed'],
        assistantIntent: 'error-recovery',
        assistantChapterSummary: 'Fix file upload issues.',
      },
    }));

    expect(assistant).toEqual({
      keywords: ['upload'],
      aliases: ['attachment failed'],
      errorPatterns: ['heic not allowed'],
      intent: ['error-recovery'],
      chapterSummary: 'Fix file upload issues.',
      disabled: false,
    });
  });
});
