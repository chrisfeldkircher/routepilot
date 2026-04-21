import { describe, it, expect } from 'vitest';
import { tokenize, lightStem, DEFAULT_STOPWORDS } from './tokenize';

describe('tokenize', () => {
  it('lowercases, splits on non-alphanumeric, and drops short tokens', () => {
    expect(tokenize('Hello, world! A 2b.')).toEqual(['hello', 'world', '2b']);
  });

  it('drops default stopwords', () => {
    expect(tokenize('the quick brown fox')).toEqual(['quick', 'brown', 'fox']);
  });

  it('keeps stopwords when stopwords=null', () => {
    expect(tokenize('the quick brown fox', { stopwords: null })).toEqual([
      'the', 'quick', 'brown', 'fox',
    ]);
  });

  it('accepts a custom stopword set', () => {
    expect(tokenize('foo bar baz', { stopwords: new Set(['bar']) })).toEqual([
      'foo', 'baz',
    ]);
  });

  it('applies light stemming by default', () => {
    expect(tokenize('uploading uploaded uploads')).toEqual(['upload', 'upload', 'upload']);
  });

  it('skips stemming when stem=false', () => {
    expect(tokenize('uploading uploaded', { stem: false })).toEqual([
      'uploading', 'uploaded',
    ]);
  });

  it('respects minLength', () => {
    expect(tokenize('a bb ccc', { minLength: 3, stopwords: null })).toEqual(['ccc']);
  });

  it('returns [] for empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('lightStem', () => {
  it('strips -ing', () => {
    expect(lightStem('running')).toBe('runn');
    expect(lightStem('uploading')).toBe('upload');
  });

  it('strips -ed', () => {
    expect(lightStem('failed')).toBe('fail');
  });

  it('strips -ies to -y', () => {
    expect(lightStem('queries')).toBe('query');
  });

  it('strips -es', () => {
    expect(lightStem('boxes')).toBe('box');
  });

  it('strips trailing -s but preserves -ss', () => {
    expect(lightStem('errors')).toBe('error');
    expect(lightStem('class')).toBe('class');
  });

  it('leaves short words alone', () => {
    expect(lightStem('is')).toBe('is');
    expect(lightStem('go')).toBe('go');
  });
});

describe('DEFAULT_STOPWORDS', () => {
  it('contains common English stopwords', () => {
    for (const word of ['the', 'and', 'how', 'what', 'is']) {
      expect(DEFAULT_STOPWORDS.has(word)).toBe(true);
    }
  });
});
