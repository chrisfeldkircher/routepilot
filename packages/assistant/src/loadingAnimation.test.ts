import { describe, expect, it } from 'vitest';
import {
  resolveAssistantLoadingAnimation,
  TOUR_ASSISTANT_LOADING_ANIMATIONS,
} from './loadingAnimation';

describe('resolveAssistantLoadingAnimation', () => {
  it('returns known explicit animation names unchanged', () => {
    expect(resolveAssistantLoadingAnimation('checker')).toBe('checker');
    expect(resolveAssistantLoadingAnimation('pulse-ring')).toBe('pulse-ring');
  });

  it('falls back to a random supported animation for random or unknown values', () => {
    expect(resolveAssistantLoadingAnimation('random', () => 0)).toBe(
      TOUR_ASSISTANT_LOADING_ANIMATIONS[0],
    );
    expect(resolveAssistantLoadingAnimation('not-real', () => 0.9999)).toBe(
      TOUR_ASSISTANT_LOADING_ANIMATIONS[TOUR_ASSISTANT_LOADING_ANIMATIONS.length - 1],
    );
  });
});
