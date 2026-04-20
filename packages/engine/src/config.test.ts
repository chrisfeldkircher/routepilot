import { describe, it, expect } from 'vitest';
import { mergeConfig, DEFAULT_CONFIG, type TourEngineConfig } from './config';

describe('mergeConfig', () => {
  it('returns defaults when no user config provided', () => {
    const result = mergeConfig();
    expect(result).toEqual(DEFAULT_CONFIG);
  });

  it('returns defaults when undefined is passed', () => {
    const result = mergeConfig(undefined);
    expect(result).toEqual(DEFAULT_CONFIG);
  });

  it('merges top-level tooltip overrides', () => {
    const result = mergeConfig({ tooltip: { defaultWidth: 500 } });
    expect(result.tooltip?.defaultWidth).toBe(500);
    // Other tooltip defaults preserved
    expect(result.tooltip?.showStepCounter).toBe(true);
    expect(result.tooltip?.className).toBe('');
  });

  it('deep-merges buttonLabels without losing defaults', () => {
    const result = mergeConfig({
      tooltip: { buttonLabels: { next: 'Continue' } },
    });
    expect(result.tooltip?.buttonLabels?.next).toBe('Continue');
    expect(result.tooltip?.buttonLabels?.back).toBe('Back'); // preserved
    expect(result.tooltip?.buttonLabels?.skip).toBe('Skip'); // preserved
    expect(result.tooltip?.buttonLabels?.finish).toBe('Finish'); // preserved
  });

  it('merges backdrop config', () => {
    const result = mergeConfig({ backdrop: { opacity: 0.8 } });
    expect(result.backdrop?.opacity).toBe(0.8);
  });

  it('merges scroll config', () => {
    const result = mergeConfig({ scroll: { behavior: 'auto', block: 'start' } });
    expect(result.scroll?.behavior).toBe('auto');
    expect(result.scroll?.block).toBe('start');
  });

  it('merges highlight config', () => {
    const result = mergeConfig({ highlight: { outlineClassName: 'custom-shimmer' } });
    expect(result.highlight?.outlineClassName).toBe('custom-shimmer');
  });

  it('merges confetti config', () => {
    const result = mergeConfig({ confetti: { scriptUrl: '/local/confetti.js' } });
    expect(result.confetti?.scriptUrl).toBe('/local/confetti.js');
  });

  it('allows disabling confetti via false', () => {
    const result = mergeConfig({ confetti: { scriptUrl: false } });
    expect(result.confetti?.scriptUrl).toBe(false);
  });

  it('handles empty user config', () => {
    const result = mergeConfig({});
    expect(result).toEqual(DEFAULT_CONFIG);
  });

  it('does not mutate DEFAULT_CONFIG', () => {
    const before = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    mergeConfig({ tooltip: { defaultWidth: 999 } });
    expect(DEFAULT_CONFIG).toEqual(before);
  });

  it('handles all sections simultaneously', () => {
    const custom: TourEngineConfig = {
      tooltip: { defaultWidth: 400, buttonLabels: { next: 'Go' } },
      backdrop: { opacity: 0.7 },
      scroll: { behavior: 'auto' },
      highlight: { outlineClassName: 'my-class' },
      confetti: { scriptUrl: '/my-confetti.js' },
    };
    const result = mergeConfig(custom);

    expect(result.tooltip?.defaultWidth).toBe(400);
    expect(result.tooltip?.buttonLabels?.next).toBe('Go');
    expect(result.tooltip?.buttonLabels?.back).toBe('Back'); // default preserved
    expect(result.backdrop?.opacity).toBe(0.7);
    expect(result.scroll?.behavior).toBe('auto');
    expect(result.scroll?.block).toBe('center'); // default preserved
    expect(result.highlight?.outlineClassName).toBe('my-class');
    expect(result.confetti?.scriptUrl).toBe('/my-confetti.js');
  });
});
