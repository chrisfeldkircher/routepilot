import type { TipPlacement } from './types';

export interface StepSelectorRenderProps {
  items: Array<{ value: string; label: string; sublabel?: string }>;
  value: string;
  onChange: (value: string | undefined) => void;
}

export interface TourTooltipConfig {
  /** Default tooltip width in px. */
  defaultWidth?: number;
  /** Additional CSS class applied to every tooltip. */
  className?: string;
  /** Configurable button labels. */
  buttonLabels?: {
    next?: string;
    back?: string;
    skip?: string;
    finish?: string;
    loading?: string;
    close?: string;
  };
  /** Show "Step X of Y" counter. */
  showStepCounter?: boolean;
  /** Default tooltip placement strategy. */
  placementStrategy?: TipPlacement;
  /** Custom step selector component. Replaces the built-in native `<select>`. */
  renderStepSelector?: (props: StepSelectorRenderProps) => unknown;
}

export interface TourBackdropConfig {
  /** Backdrop overlay opacity (0–1). */
  opacity?: number;
}

export interface TourScrollConfig {
  /** Scroll behavior when scrolling elements into view. */
  behavior?: ScrollBehavior;
  /** Scroll block position. */
  block?: ScrollLogicalPosition;
}

export interface TourHighlightConfig {
  /** CSS class applied to highlighted elements. */
  outlineClassName?: string;
}

export interface TourConfettiConfig {
  /** URL to the confetti script. Set to `false` to disable confetti entirely. */
  scriptUrl?: string | false;
}

export interface TourEngineConfig {
  tooltip?: TourTooltipConfig;
  backdrop?: TourBackdropConfig;
  scroll?: TourScrollConfig;
  highlight?: TourHighlightConfig;
  confetti?: TourConfettiConfig;
}

export const DEFAULT_CONFIG: TourEngineConfig = {
  tooltip: {
    defaultWidth: 360,
    className: '',
    buttonLabels: {
      next: 'Next',
      back: 'Back',
      skip: 'Skip',
      finish: 'Finish',
      loading: 'Loading...',
      close: 'Close Tour',
    },
    showStepCounter: true,
    placementStrategy: 'auto',
  },
  backdrop: {
    opacity: 0.55,
  },
  scroll: {
    behavior: 'smooth',
    block: 'center',
  },
  highlight: {
    outlineClassName: 'tour-outline-shimmer',
  },
  confetti: {
    scriptUrl: 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js',
  },
};

export const mergeConfig = (user?: TourEngineConfig): TourEngineConfig => {
  if (!user) return DEFAULT_CONFIG;
  return {
    tooltip: {
      ...DEFAULT_CONFIG.tooltip,
      ...user.tooltip,
      buttonLabels: {
        ...DEFAULT_CONFIG.tooltip?.buttonLabels,
        ...user.tooltip?.buttonLabels,
      },
    },
    backdrop: { ...DEFAULT_CONFIG.backdrop, ...user.backdrop },
    scroll: { ...DEFAULT_CONFIG.scroll, ...user.scroll },
    highlight: { ...DEFAULT_CONFIG.highlight, ...user.highlight },
    confetti: { ...DEFAULT_CONFIG.confetti, ...user.confetti },
  };
};
