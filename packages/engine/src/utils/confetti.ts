import type { ConfettiConfig } from '../types';

const DEFAULT_CONFETTI_CDN = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';

let configuredScriptUrl: string | undefined;

declare global {
  interface Window {
    confetti: (options?: {
      particleCount?: number;
      angle?: number;
      spread?: number;
      startVelocity?: number;
      decay?: number;
      gravity?: number;
      drift?: number;
      ticks?: number;
      origin?: { x?: number; y?: number };
      colors?: string[];
      shapes?: Array<'square' | 'circle'>;
      scalar?: number;
      zIndex?: number;
    }) => Promise<void>;
  }
}

let confettiLoaded = false;
let confettiLoading: Promise<void> | null = null;

export const setConfettiScriptUrl = (url: string | undefined): void => {
  configuredScriptUrl = url;
};

const loadConfetti = (): Promise<void> => {
  if (confettiLoaded) {
    return Promise.resolve();
  }

  if (confettiLoading) {
    return confettiLoading;
  }

  confettiLoading = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available'));
      return;
    }

    if (typeof window.confetti === 'function') {
      confettiLoaded = true;
      confettiLoading = null;
      resolve();
      return;
    }

    const scriptUrl = configuredScriptUrl ?? DEFAULT_CONFETTI_CDN;
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (typeof window.confetti === 'function') {
        confettiLoaded = true;
        confettiLoading = null;
        resolve();
      } else {
        confettiLoading = null;
        reject(new Error('Confetti library loaded but did not expose window.confetti'));
      }
    };
    script.onerror = () => {
      confettiLoading = null;
      reject(new Error(`Failed to load confetti script from ${scriptUrl}`));
    };
    document.head.appendChild(script);
  });

  return confettiLoading;
};

const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const startConfetti = (config: ConfettiConfig = {}): (() => void) => {
  const duration = config.duration || 15000;
  const colors = config.colors || ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  const startVelocity = config.startVelocity || 30;
  const spread = config.spread || 360;
  const zIndex = config.zIndex || 10000;

  let animationEnd = Date.now() + duration;
  let intervalId: number | null = null;
  let isCleanedUp = false;

  const cleanup = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isCleanedUp = true;
  };

  const fireConfetti = () => {
    if (isCleanedUp || typeof window.confetti !== 'function') return;

    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      cleanup();
      return;
    }

    const particleCount = Math.floor(50 * (timeLeft / duration));
    const spreadValue = Math.min(90, spread / 4);

    window.confetti({
      particleCount,
      angle: randomInRange(55, 125),
      spread: spreadValue,
      startVelocity,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      origin: {
        x: randomInRange(0.1, 0.3),
        y: Math.random() - 0.2,
      },
      colors,
      zIndex,
    });

    window.confetti({
      particleCount,
      angle: randomInRange(55, 125),
      spread: spreadValue,
      startVelocity,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      origin: {
        x: randomInRange(0.7, 0.9),
        y: Math.random() - 0.2,
      },
      colors,
      zIndex,
    });
  };

  loadConfetti()
    .then(() => {
      if (isCleanedUp) return;

      setTimeout(() => {
        if (isCleanedUp) return;

        fireConfetti();

        intervalId = window.setInterval(() => {
          if (isCleanedUp) {
            cleanup();
            return;
          }
          fireConfetti();
        }, 250);
      }, 50);
    })
    .catch((error) => {
      console.error('Failed to load confetti library:', error);
      cleanup();
    });

  return cleanup;
};
