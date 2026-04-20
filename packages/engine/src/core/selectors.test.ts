import { describe, it, expect } from 'vitest';
import { toStepSelectorConfig } from './selectors';

describe('toStepSelectorConfig', () => {
  it('returns an empty array for undefined input', () => {
    expect(toStepSelectorConfig(undefined)).toEqual([]);
  });

  it('wraps a single string selector', () => {
    expect(toStepSelectorConfig('.btn')).toEqual([{ target: '.btn' }]);
  });

  it('preserves array ordering', () => {
    expect(toStepSelectorConfig(['.a', '.b'])).toEqual([
      { target: '.a' },
      { target: '.b' },
    ]);
  });

  it('strips the "highlight:" prefix and flags highlight=true', () => {
    expect(toStepSelectorConfig('highlight:.btn')).toEqual([
      { target: '.btn', highlight: true },
    ]);
  });

  it('trims surrounding whitespace on selectors', () => {
    expect(toStepSelectorConfig('   .btn   ')).toEqual([{ target: '.btn' }]);
    expect(toStepSelectorConfig('highlight:   .btn  ')).toEqual([
      { target: '.btn', highlight: true },
    ]);
  });

  it('handles a mix of highlighted and plain selectors', () => {
    expect(toStepSelectorConfig(['.a', 'highlight:.b', '.c'])).toEqual([
      { target: '.a' },
      { target: '.b', highlight: true },
      { target: '.c' },
    ]);
  });
});
