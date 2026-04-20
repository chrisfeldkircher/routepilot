import type {
  StepDefinition,
  StepSelectorConfig,
  StepTargetResolver,
  StepTooltipConfig,
} from '@routepilot/engine';

export type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export const HIGHLIGHT_CLASS = 'tour-outline-shimmer';
export const DEFAULT_TOOLTIP_WIDTH = 360;
export const TOOLTIP_ESTIMATED_HEIGHT = 260;
export const TOOLTIP_PADDING = 16;
export const TOOLTIP_GAP = 12;

export function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function toRect(domRect: DOMRect | Rect): Rect {
  return {
    top: domRect.top,
    left: domRect.left,
    width: domRect.width,
    height: domRect.height,
  };
}

export function expandRect(rect: Rect | null, padding: number): Rect | null {
  if (!rect) return null;
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export function computeBoundingRect(elements: HTMLElement[]): Rect | null {
  if (elements.length === 0) return null;

  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const element of elements) {
    if (!document.contains(element)) continue;
    const rect = element.getBoundingClientRect();
    top = Math.min(top, rect.top);
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }

  if (
    !Number.isFinite(top) ||
    !Number.isFinite(left) ||
    !Number.isFinite(right) ||
    !Number.isFinite(bottom)
  ) {
    return null;
  }

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

export function gatherSelectors(step: StepDefinition): StepSelectorConfig[] {
  const base = step.selectors ?? [];
  const legacy = (() => {
    if (!step.selector) return [] as StepSelectorConfig[];
    return toArray(step.selector).map((raw) => {
      if (typeof raw !== 'string') {
        return { target: raw } as StepSelectorConfig;
      }
      const trimmed = raw.trim();
      const highlight = trimmed.startsWith('highlight:');
      const target = highlight
        ? trimmed.slice('highlight:'.length).trim()
        : trimmed;
      return {
        target,
        ...(highlight ? { highlight: true } : {}),
      } as StepSelectorConfig;
    });
  })();
  const spotlight = step.spotlight?.selectors ?? [];

  const combined = [...base, ...legacy];

  if (combined.length === 0 && spotlight.length === 0 && step.target) {
    return [{ target: step.target }];
  }

  return [...combined, ...spotlight];
}

export function resolveElements(
  resolver: StepTargetResolver,
  multiple?: boolean,
): HTMLElement[] {
  if (typeof resolver === 'string') {
    if (typeof document === 'undefined') return [];
    if (multiple) {
      return Array.from(document.querySelectorAll<HTMLElement>(resolver));
    }
    const element = document.querySelector<HTMLElement>(resolver);
    return element ? [element] : [];
  }

  if (typeof resolver === 'function') {
    const result = resolver();
    return toArray(result).filter(
      (node): node is HTMLElement => node instanceof HTMLElement,
    );
  }

  const result = resolver.resolve();
  return toArray(result).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
}

export interface TooltipStyle {
  position: string;
  top: string;
  left: string;
  width: number;
  zIndex: number;
  maxHeight: number;
  overflowY: string;
  transform?: string;
}

export function computeTooltipStyle(
  rect: Rect | null,
  tooltip: StepTooltipConfig | undefined,
): TooltipStyle {
  const placement = tooltip?.placement ?? 'auto';
  const offsetX = tooltip?.offset?.x ?? 0;
  const offsetY = tooltip?.offset?.y ?? 0;
  const tooltipWidth = tooltip?.width ?? DEFAULT_TOOLTIP_WIDTH;

  if (!rect) {
    if (placement === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: tooltipWidth,
        zIndex: 1002,
        maxHeight: Math.max(220, window.innerHeight - TOOLTIP_PADDING * 2),
        overflowY: 'auto',
      };
    }
    return {
      position: 'fixed',
      top: `${80 + offsetY}px`,
      left: `${16 + offsetX}px`,
      width: tooltipWidth,
      zIndex: 1002,
      maxHeight: Math.max(220, window.innerHeight - TOOLTIP_PADDING * 2),
      overflowY: 'auto',
    };
  }

  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

  const rectTop = rect.top;
  const rectLeft = rect.left;
  const rectBottom = rect.top + rect.height;
  const rectRight = rect.left + rect.width;
  const rectCenterX = rectLeft + rect.width / 2;
  const rectCenterY = rectTop + rect.height / 2;
  const spaceAbove = rectTop;
  const spaceBelow = window.innerHeight - rectBottom;

  if (placement === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: tooltipWidth,
      zIndex: 1002,
      maxHeight: Math.max(220, window.innerHeight - TOOLTIP_PADDING * 2),
      overflowY: 'auto',
    };
  }

  const resolvedPlacement =
    placement === 'auto'
      ? spaceBelow < TOOLTIP_ESTIMATED_HEIGHT && spaceAbove > spaceBelow
        ? 'above'
        : 'below'
      : placement;

  let top: number;
  let left: number;

  switch (resolvedPlacement) {
    case 'left':
      top = clamp(
        rectCenterY - TOOLTIP_ESTIMATED_HEIGHT / 2,
        TOOLTIP_PADDING,
        window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_PADDING,
      );
      left = clamp(
        rectLeft - tooltipWidth - TOOLTIP_GAP,
        TOOLTIP_PADDING,
        window.innerWidth - tooltipWidth - TOOLTIP_PADDING,
      );
      break;
    case 'right':
      top = clamp(
        rectCenterY - TOOLTIP_ESTIMATED_HEIGHT / 2,
        TOOLTIP_PADDING,
        window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_PADDING,
      );
      left = clamp(
        rectRight + TOOLTIP_GAP,
        TOOLTIP_PADDING,
        window.innerWidth - tooltipWidth - TOOLTIP_PADDING,
      );
      break;
    case 'top':
    case 'above':
      top = clamp(
        rectTop - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_GAP,
        TOOLTIP_PADDING,
        window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_PADDING,
      );
      left = clamp(
        rectCenterX - tooltipWidth / 2,
        TOOLTIP_PADDING,
        window.innerWidth - tooltipWidth - TOOLTIP_PADDING,
      );
      break;
    case 'bottom':
    case 'below':
    default:
      top = clamp(
        rectBottom + TOOLTIP_GAP,
        TOOLTIP_PADDING,
        window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_PADDING,
      );
      left = clamp(
        rectCenterX - tooltipWidth / 2,
        TOOLTIP_PADDING,
        window.innerWidth - tooltipWidth - TOOLTIP_PADDING,
      );
  }

  return {
    position: 'fixed',
    top: `${top + offsetY}px`,
    left: `${left + offsetX}px`,
    width: tooltipWidth,
    zIndex: 1002,
    maxHeight: Math.max(220, window.innerHeight - TOOLTIP_PADDING * 2),
    overflowY: 'auto',
  };
}
