export const TOUR_ASSISTANT_LOADING_ANIMATIONS = [
  'conic-trio',
  'conic-shift',
  'crosshair-orbit',
  'pulse-ring',
  'split-ring',
  'flip-blocks',
  'flip-triangles',
  'dual-frames',
  'arcade-track',
  'loading-bar',
  'rgb-stack',
  'pixel-climber',
  'corner-chase',
  'checker',
  'stripe-sweep',
  'double-dots-drip',
  'double-dots-gasp',
  'double-dots-wink',
  'quadrant-lines',
  'track-runner',
  'rail-bounce',
  'rail-slides',
] as const;

export type TourAssistantLoadingAnimationName =
  typeof TOUR_ASSISTANT_LOADING_ANIMATIONS[number];

export const resolveAssistantLoadingAnimation = (
  selection: string | 'random' | undefined,
  random: () => number = Math.random,
): TourAssistantLoadingAnimationName => {
  if (
    selection &&
    selection !== 'random' &&
    TOUR_ASSISTANT_LOADING_ANIMATIONS.includes(
      selection as TourAssistantLoadingAnimationName,
    )
  ) {
    return selection as TourAssistantLoadingAnimationName;
  }

  const index = Math.floor(random() * TOUR_ASSISTANT_LOADING_ANIMATIONS.length);
  return (
    TOUR_ASSISTANT_LOADING_ANIMATIONS[index] ??
    TOUR_ASSISTANT_LOADING_ANIMATIONS[0]
  );
};
