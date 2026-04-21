import { createElement, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useGuidedTour } from '../hooks/useGuidedTour';
import { useTooltipSlots } from './TooltipSlotContext';
import { startConfetti } from '@routepilot/engine';
import type {
  StepContent,
  StepDefinition,
  StepSelectorConfig,
  StepTargetResolver,
  StepTooltipConfig,
  StepTransitionOption,
  DagTourNode,
} from '@routepilot/engine';
import type { JSX } from 'react';

interface StepSelectorItem {
  value: string;
  label: string;
  sublabel?: string;
}

/**
 * Parse inline markup in plain strings:
 *   ==text==      →  shimmer text
 *   ==|text|==    →  pill badge
 *   ==|~text~|==  →  shimmer pill (combined)
 *
 * If the input is not a string or contains no markers, it is returned as-is.
 */
const parseInlineMarkup = (node: ReactNode): ReactNode => {
  if (typeof node !== 'string') return node;
  const parts = node.split(/(==\|~.+?~\|==|==\|.+?\|==|==.+?==)/g);
  if (parts.length === 1) return node;
  return createElement(
    'span',
    null,
    ...parts.map((part, i) => {
      if (part.startsWith('==|~') && part.endsWith('~|==')) {
        return createElement('span', { key: i, className: 'tour-text-pill tour-text-highlight' }, part.slice(4, -4));
      }
      if (part.startsWith('==|') && part.endsWith('|==')) {
        return createElement('span', { key: i, className: 'tour-text-pill' }, part.slice(3, -3));
      }
      if (part.startsWith('==') && part.endsWith('==')) {
        return createElement('span', { key: i, className: 'tour-text-highlight' }, part.slice(2, -2));
      }
      return part;
    })
  );
};

/** Built-in styled step dropdown — replaces the native <select>. */
function TourStepDropdown({ items, value, onChange }: {
  items: StepSelectorItem[];
  value: string;
  onChange: (value: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = items.find((i) => i.value === value);
  const filtered = search
    ? items.filter((i) =>
        i.label.toLowerCase().includes(search.toLowerCase()) ||
        (i.sublabel?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : items;

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  // Scroll active item into view when dropdown opens
  useEffect(() => {
    if (open && listRef.current) {
      const active = listRef.current.querySelector('.tour-dropdown-item-active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  }, [open]);

  const handleSelect = (itemValue: string) => {
    onChange(itemValue);
    setOpen(false);
    setSearch('');
  };

  return createElement('div', { className: 'tour-dropdown', style: { position: 'relative' } },
    // Trigger button
    createElement('button', {
      type: 'button',
      className: 'tour-dropdown-trigger',
      onClick: () => setOpen(!open),
      'aria-expanded': open,
    },
      createElement('span', { className: 'tour-dropdown-trigger-text' }, selected?.label ?? 'Select step...'),
      createElement('span', { className: 'tour-dropdown-caret' }, '⌃')
    ),
    // Dropdown panel
    open && createElement('div', { className: 'tour-dropdown-panel' },
      // Search input
      createElement('div', { className: 'tour-dropdown-search-wrap' },
        createElement('span', { className: 'tour-dropdown-search-icon' }, '⌕'),
        createElement('input', {
          ref: searchRef,
          type: 'text',
          className: 'tour-dropdown-search',
          placeholder: 'Search...',
          value: search,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
        })
      ),
      // Items list
      createElement('div', { ref: listRef, className: 'tour-dropdown-list' },
        filtered.length === 0
          ? createElement('div', { className: 'tour-dropdown-empty' }, 'No steps found')
          : filtered.map((item) =>
              createElement('button', {
                key: item.value,
                type: 'button',
                className: `tour-dropdown-item ${item.value === value ? 'tour-dropdown-item-active' : ''}`,
                onClick: () => handleSelect(item.value),
              },
                createElement('span', { className: 'tour-dropdown-item-label' }, item.label),
                item.sublabel && createElement('span', { className: 'tour-dropdown-item-sublabel' }, item.sublabel),
                item.value === value && createElement('span', { className: 'tour-dropdown-item-check' }, '✓')
              )
            )
      )
    )
  );
}

type Rect = { top: number; left: number; width: number; height: number };

const HIGHLIGHT_CLASS = 'tour-outline-shimmer';
const DEFAULT_TOOLTIP_WIDTH = 360;
const TOOLTIP_ESTIMATED_HEIGHT = 260;
const TOOLTIP_PADDING = 16;
const TOOLTIP_GAP = 12;

const toArray = <T,>(value: T | T[] | null | undefined): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const toRect = (domRect: DOMRect | Rect): Rect => ({
  top: domRect.top,
  left: domRect.left,
  width: domRect.width,
  height: domRect.height,
});

const expandRect = (rect: Rect | null, padding: number): Rect | null => {
  if (!rect) return null;
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
};

const computeBoundingRect = (elements: HTMLElement[]): Rect | null => {
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

  if (!Number.isFinite(top) || !Number.isFinite(left) || !Number.isFinite(right) || !Number.isFinite(bottom)) {
    return null;
  }

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
};

const gatherSelectors = (step: StepDefinition): StepSelectorConfig[] => {
  const base = step.selectors ?? [];
  const legacy = (() => {
    if (!step.selector) return [] as StepSelectorConfig[];
    return toArray(step.selector).map((raw) => {
      if (typeof raw !== 'string') {
        return { target: raw } as StepSelectorConfig;
      }
      const trimmed = raw.trim();
      const highlight = trimmed.startsWith('highlight:');
      const target = highlight ? trimmed.slice('highlight:'.length).trim() : trimmed;
      return {
        target,
        ...(highlight ? { highlight: true } : {}),
      } as StepSelectorConfig;
    });
  })();
  const spotlight = step.spotlight?.selectors ?? [];

  const combined = [...base, ...legacy];

  if (combined.length === 0 && spotlight.length === 0 && step.target) {
    return [
      {
        target: step.target,
      },
    ];
  }

  return [...combined, ...spotlight];
};

const resolveElements = (resolver: StepTargetResolver, multiple?: boolean): HTMLElement[] => {
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
    return toArray(result).filter((node): node is HTMLElement => node instanceof HTMLElement);
  }

  const result = resolver.resolve();
  return toArray(result).filter((node): node is HTMLElement => node instanceof HTMLElement);
};

const computeTooltipStyle = (rect: Rect | null, tooltip: StepTooltipConfig | undefined): CSSProperties => {
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
      top: 80 + offsetY,
      left: 16 + offsetX,
      width: tooltipWidth,
      zIndex: 1002,
      maxHeight: Math.max(220, window.innerHeight - TOOLTIP_PADDING * 2),
      overflowY: 'auto',
    };
  }

  const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

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
        window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_PADDING
      );
      left = clamp(
        rectLeft - tooltipWidth - TOOLTIP_GAP,
        TOOLTIP_PADDING,
        window.innerWidth - tooltipWidth - TOOLTIP_PADDING
      );
      break;
    case 'right':
      top = clamp(
        rectCenterY - TOOLTIP_ESTIMATED_HEIGHT / 2,
        TOOLTIP_PADDING,
        window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_PADDING
      );
      left = clamp(
        rectRight + TOOLTIP_GAP,
        TOOLTIP_PADDING,
        window.innerWidth - tooltipWidth - TOOLTIP_PADDING
      );
      break;
    case 'top':
    case 'above':
      top = clamp(
        rectTop - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_GAP,
        TOOLTIP_PADDING,
        window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_PADDING
      );
      left = clamp(
        rectCenterX - tooltipWidth / 2,
        TOOLTIP_PADDING,
        window.innerWidth - tooltipWidth - TOOLTIP_PADDING
      );
      break;
    case 'bottom':
    case 'below':
      top = clamp(
        rectBottom + TOOLTIP_GAP,
        TOOLTIP_PADDING,
        window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_PADDING
      );
      left = clamp(
        rectCenterX - tooltipWidth / 2,
        TOOLTIP_PADDING,
        window.innerWidth - tooltipWidth - TOOLTIP_PADDING
      );
      break;
    default:
      top = clamp(
        rectBottom + TOOLTIP_GAP,
        TOOLTIP_PADDING,
        window.innerHeight - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_PADDING
      );
      left = clamp(
        rectCenterX - tooltipWidth / 2,
        TOOLTIP_PADDING,
        window.innerWidth - tooltipWidth - TOOLTIP_PADDING
      );
  }

  return {
    position: 'fixed',
    top: top + offsetY,
    left: left + offsetX,
    width: tooltipWidth,
    zIndex: 1002,
    maxHeight: Math.max(220, window.innerHeight - TOOLTIP_PADDING * 2),
    overflowY: 'auto',
  };
};

const GuidedTourOverlay = (): JSX.Element | null => {
  const { state, actions, services, registry, sequence, routeGuard, location: currentPath, config } = useGuidedTour();
  const slots = useTooltipSlots();
  const labels = config.tooltip?.buttonLabels ?? {};

  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<Rect | null>(null);
  const highlightRef = useRef<{ elements: HTMLElement[]; className: string } | null>(null);
  const lastStepIdRef = useRef<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [availableTransitions, setAvailableTransitions] = useState<StepTransitionOption[]>([]);

  const orderedNodes = useMemo<DagTourNode[]>(() => {
    if (!state.dag) return [];
    const seq = sequence.length > 0 ? sequence : Object.keys(state.dag.nodes);
    return seq
      .map((id) => state.dag?.nodes[id])
      .filter((node): node is DagTourNode => Boolean(node));
  }, [state.dag, sequence]);

  const currentNode = useMemo(() => {
    if (state.status !== 'running' || !state.dag || !state.nodeId) return null;
    return state.dag.nodes[state.nodeId] ?? null;
  }, [state.status, state.dag, state.nodeId]);

  const currentStep = currentNode?.step ?? null;

  const currentStepIndex = useMemo(() => {
    if (!currentNode) return -1;
    return orderedNodes.findIndex((node) => node.id === currentNode.id);
  }, [orderedNodes, currentNode?.id]);

  const totalSteps = state.dag?.totalSteps ?? orderedNodes.length;
  const displayStepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : 0;
  const showBranchChooser = availableTransitions.length > 1;

  const isLast =
    !!currentNode &&
    currentNode.next.length === 0 &&
    availableTransitions.length === 0;
  const canGoBack = state.canGoBack;
  const canGoNext = state.canGoNext;
  const isTransitioning = state.isTransitioning;
  const currentStepId = currentStep?.id ?? '';

  const navigationConfig = state.dag?.navigation;
  const stepPickerScope = navigationConfig?.stepPickerScope ?? 'tour';
  const hubNodeId = navigationConfig?.hubNodeId;
  const hubAction = navigationConfig?.hubAction ?? (hubNodeId ? 'goToHub' : 'stop');
  const hubReturnLabel = navigationConfig?.hubReturnLabel;

  const currentChapter = useMemo(() => {
    const step = currentNode?.step;
    if (!step) return undefined;
    const chapter =
      (typeof step.chapter === 'string' && step.chapter.length > 0 && step.chapter) ||
      (typeof step.meta?.chapter === 'string' && step.meta.chapter.length > 0 && step.meta.chapter) ||
      undefined;
    return chapter;
  }, [currentNode]);

  const stepItems: StepSelectorItem[] = useMemo(() => {
    const items = orderedNodes.map((node, index) => {
      const step = node.step;
      if (!step) {
        return {
          value: node.id,
          label: `Step ${index + 1}`,
          sublabel: 'Tour Overview',
          chapter: undefined as string | undefined,
        };
      }
      const chapter =
        (typeof step.chapter === 'string' && step.chapter.length > 0 && step.chapter) ||
        (typeof step.meta?.chapter === 'string' && step.meta.chapter.length > 0 && step.meta.chapter) ||
        undefined;

      const contentTitle =
        step.content && typeof step.content === 'object' && 'title' in step.content
          ? typeof step.content.title === 'string'
            ? step.content.title
            : undefined
          : undefined;

      const label =
        (typeof step.title === 'string' && step.title) ||
        contentTitle ||
        (typeof step.meta?.title === 'string' && step.meta.title) ||
        `Step ${index + 1}`;

      return {
        value: step.id,
        label: `${index + 1}. ${label}`,
        sublabel: chapter ?? 'Tour Overview',
        chapter,
      };
    });

    if (stepPickerScope === 'chapter' && currentChapter) {
      const filtered = items.filter((item) => item.chapter === currentChapter);
      if (filtered.length > 0) {
        return filtered.map(({ chapter: _chapter, ...rest }) => rest);
      }
    }

    return items.map(({ chapter: _chapter, ...rest }) => rest);
  }, [orderedNodes, stepPickerScope, currentChapter]);

  const canGoToHub =
    hubAction === 'goToHub' &&
    !!hubNodeId &&
    !!currentNode &&
    currentNode.id !== hubNodeId &&
    !!state.dag?.nodes[hubNodeId];

  const showCustomSkipLabel =
    !!hubReturnLabel && !!currentNode && (hubAction === 'stop' || canGoToHub);

  const skipButtonLabel = showCustomSkipLabel
    ? hubReturnLabel
    : (labels.skip ?? 'Skip');

  const handleSkipOrHubReturn = useCallback(() => {
    if (canGoToHub && hubNodeId) {
      void actions.goTo(hubNodeId);
      return;
    }
    void actions.stop();
  }, [actions, canGoToHub, hubNodeId]);

  const handleTitleClick = useCallback(() => {
    setSelectorOpen((prev) => !prev);
  }, []);

  const handleStepSelect = useCallback(
    (value: string | undefined) => {
      if (!value || value === currentStepId) {
        return;
      }
      void actions.goTo(value);
    },
    [actions, currentStepId]
  );

  useEffect(() => {
    setSelectorOpen(false);
  }, [currentStepId]);

  useEffect(() => {
    let cancelled = false;
    if (!currentNode) {
      setAvailableTransitions([]);
      return;
    }

    const fetchTransitions = async () => {
      try {
        const options = await actions.getAvailableTransitions(currentNode.id);
        if (!cancelled) {
          setAvailableTransitions(options);
        }
      } catch (error) {
        console.error('[guided-tour] Failed to evaluate transitions', error);
        if (!cancelled) {
          setAvailableTransitions([]);
        }
      }
    };

    void fetchTransitions();

    return () => {
      cancelled = true;
    };
  }, [actions, currentNode?.id]);

  // ── Route enforcement via the centralized route guard ──────────────
  //
  // Three modes:
  //   navigate — auto-navigate to the primary path on step entry AND if the
  //              user somehow ends up on a disallowed path. Waits for target
  //              elements after navigation.
  //   guard    — does NOT auto-navigate on step entry (the step's onEnter is
  //              expected to have navigated already). But if the user ends up
  //              on a disallowed path (e.g. via an imperative navigate() from
  //              an allowed click), redirect back to the primary path.
  //   pause    — no enforcement; future-reserved for a "return to tour" prompt.
  useEffect(() => {
    if (!currentStep || state.status !== 'running') return;

    const policy = routeGuard.getPolicy();
    if (!policy) return;

    // Already on an allowed path → nothing to do
    if (routeGuard.isPathAllowed(currentPath)) return;

    const mode = policy.mode;

    // pause: no enforcement
    if (mode === 'pause') return;

    // guard: only redirect if the user was previously on an allowed path
    // (i.e. has "settled") and then drifted away. If the step entered on
    // the wrong route and hasn't settled yet, do nothing — the step's
    // onEnter is expected to handle initial navigation.
    if (mode === 'guard') {
      if (routeGuard.hasSettled()) {
        void routeGuard.enforcePrimary();
      }
      return;
    }

    // navigate: auto-navigate and wait for targets
    let cancelled = false;

    const selectors = gatherSelectors(currentStep);
    const prioritized = [
      ...selectors.filter((s) => !s.highlight),
      ...selectors.filter((s) => s.highlight),
    ];
    const requiredSelectors = prioritized.filter((s) => !s.optional);
    const selectorsToCheck = requiredSelectors.length > 0 ? requiredSelectors : prioritized;

    const hasReadyElement = (): boolean => {
      if (selectorsToCheck.length === 0 && currentStep.target) {
        return resolveElements(currentStep.target).length > 0;
      }
      for (const sel of selectorsToCheck) {
        try {
          if (resolveElements(sel.target, sel.multiple).length > 0) return true;
        } catch {
          // selector may not exist yet
        }
      }
      return selectorsToCheck.length === 0;
    };

    const waitForTargets = async () => {
      if (selectorsToCheck.length === 0 && !currentStep.target) return;
      const maxAttempts = 60;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (cancelled) return;
        if (hasReadyElement()) return;
        await new Promise((r) => setTimeout(r, 50));
      }
      console.warn(`[guided-tour] Target element not ready after route change (step: ${currentStep.id}, route: ${routeGuard.getPrimaryPath()})`);
    };

    const navigateAndWait = async () => {
      await routeGuard.enforcePrimary();
      if (cancelled) return;
      try {
        await waitForTargets();
      } catch (err) {
        console.warn(`[guided-tour] Failed waiting for targets after navigation (step: ${currentStep.id})`, err);
      }
      if (cancelled) return;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    };

    void navigateAndWait();

    return () => {
      cancelled = true;
    };
  }, [currentStep, state.status, currentPath, routeGuard]);

  const clearHighlight = useCallback(() => {
    const current = highlightRef.current;
    if (!current) return;
    current.elements.forEach((el) => {
      el.classList.remove(current.className);
      const saved = el.dataset.tourSavedOverflow;
      if (saved !== undefined) {
        if (saved) {
          el.style.overflow = saved;
        } else {
          el.style.removeProperty('overflow');
        }
        delete el.dataset.tourSavedOverflow;
      }
    });
    highlightRef.current = null;
  }, []);

  const applyHighlight = useCallback(
    (elements: HTMLElement[], className: string) => {
      const previous = highlightRef.current;
      if (
        previous &&
        previous.className === className &&
        previous.elements.length === elements.length &&
        previous.elements.every((el, idx) => el === elements[idx])
      ) {
        return;
      }

      clearHighlight();
      if (elements.length === 0) return;
      elements.forEach((el) => {
        el.classList.add(className);
        const computed = getComputedStyle(el).overflow;
        if (computed !== 'visible') {
          el.dataset.tourSavedOverflow = el.style.overflow ?? '';
          el.style.overflow = 'visible';
        }
      });
      highlightRef.current = { elements, className };
    },
    [clearHighlight]
  );

  useEffect(() => {
    if (state.status !== 'running' || !currentStep) {
      setAnchorRect(null);
      setSpotlightRect(null);
      clearHighlight();
      return;
    }

    if (currentStep.route && !routeGuard.isPathAllowed(currentPath)) {
      setAnchorRect(null);
      setSpotlightRect(null);
      clearHighlight();
      return;
    }

    let rafId: number | null = null;
    let pending = false;
    const selectors = gatherSelectors(currentStep);
    const highlightClass = currentStep.spotlight?.outlineClassName ?? HIGHLIGHT_CLASS;

    const sync = () => {
      pending = false;
      rafId = null;
      const allElements: HTMLElement[] = [];
      const highlightElements: HTMLElement[] = [];
      let anchor: HTMLElement | null = null;

      for (const selector of selectors) {
        const elements = resolveElements(selector.target, selector.multiple);
        if (elements.length === 0) continue;

        if (!anchor && !selector.highlight) {
          anchor = elements[0];
        }

        if (selector.highlight) {
          highlightElements.push(...elements);
        }

        allElements.push(...elements);
      }

      if (!anchor && allElements.length > 0) {
        anchor = allElements[0];
      }

      const unionRect = computeBoundingRect(allElements);
      const padding = currentStep.spotlight?.padding ?? 8;

      if (anchor) {
        setAnchorRect(toRect(anchor.getBoundingClientRect()));
      } else {
        setAnchorRect(unionRect);
      }
      setSpotlightRect(expandRect(unionRect, padding));

      if (highlightElements.length > 0) {
        applyHighlight(highlightElements, highlightClass);
      } else {
        clearHighlight();
      }
    };

    const requestSync = () => {
      if (pending) return;
      pending = true;
      rafId = window.requestAnimationFrame(sync);
    };

    requestSync();

    const handleScroll = () => requestSync();
    const handleResize = () => requestSync();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    const mutationObserver =
      typeof MutationObserver !== 'undefined' ? new MutationObserver(requestSync) : null;
    mutationObserver?.observe(document.body, { childList: true, subtree: true, attributes: true });

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(requestSync) : null;
    resizeObserver?.observe(document.body);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      clearHighlight();
    };
  }, [state.status, currentStep, currentPath, clearHighlight, applyHighlight]);

  useEffect(() => {
    if (state.status !== 'running') return;
    const shouldBlock = currentStep?.behavior?.blockScroll ?? true;
    if (!shouldBlock) return;

    const findScrollableAncestor = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof Node)) return null;
      let node: Node | null = target;
      while (node && node !== document.body) {
        if (node instanceof HTMLElement) {
          const oy = getComputedStyle(node).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) {
            return node;
          }
        }
        node = node.parentNode;
      }
      return null;
    };
    const prevent = (e: Event) => {
      const scrollable = findScrollableAncestor(e.target);
      if (!scrollable) {
        e.preventDefault();
        return;
      }
      // Prevent scroll leak when at boundaries
      if (e instanceof WheelEvent) {
        const atTop = scrollable.scrollTop <= 0;
        const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
        if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
          e.preventDefault();
        }
      }
    };
    const isEditable = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      return false;
    };
    const preventKeys = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      if (findScrollableAncestor(e.target)) return;
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End'];
      if (scrollKeys.includes(e.code)) e.preventDefault();
    };

    window.addEventListener('wheel', prevent, { passive: false });
    window.addEventListener('touchmove', prevent, { passive: false });
    window.addEventListener('keydown', preventKeys, { passive: false });
    return () => {
      window.removeEventListener('wheel', prevent);
      window.removeEventListener('touchmove', prevent);
      window.removeEventListener('keydown', preventKeys);
    };
  }, [state.status, currentStep]);

  useEffect(() => {
    if (state.status !== 'running' || !currentStep) return;
    if (lastStepIdRef.current === currentStep.id) return;
    lastStepIdRef.current = currentStep.id;

    let cancelled = false;

    const selectors = gatherSelectors(currentStep);
    const prioritized = [
      ...selectors.filter((selector) => !selector.highlight),
      ...selectors.filter((selector) => selector.highlight),
    ];
    const requiredSelectors = prioritized.filter((selector) => !selector.optional);
    const selectorsToCheck = requiredSelectors.length > 0 ? requiredSelectors : prioritized;

    const findFirstElement = (): HTMLElement | null => {
      if (selectorsToCheck.length === 0 && currentStep.target) {
        const elements = resolveElements(currentStep.target);
        return elements[0] ?? null;
      }

      for (const selector of selectorsToCheck) {
        try {
          const elements = resolveElements(selector.target, selector.multiple);
          if (elements.length > 0) {
            return elements[0];
          }
        } catch {
          console.warn('[guided-tour] Failed to resolve selector', selector.target);
        }
      }

      return null;
    };

    const ensureInView = async () => {
      const maxAttempts = 60;
      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt++) {
        const element = findFirstElement();
        if (element) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          if (cancelled) return;
          try {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          } catch {
            console.warn('[guided-tour] Failed to scroll element into view', element);
          }
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    };

    void ensureInView();

    return () => {
      cancelled = true;
    };
  }, [state.status, currentStep]);

  useEffect(() => {
    if (state.status !== 'running') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        void actions.stop();
      } else if (event.key === 'ArrowRight') {
        if (isTransitioning || !canGoNext) return;
        event.preventDefault();
        void actions.next();
      } else if (event.key === 'ArrowLeft') {
        if (isTransitioning || !canGoBack) return;
        event.preventDefault();
        void actions.back();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.status, actions, canGoNext, canGoBack, isTransitioning]);

  // ── Click gating: block clicks outside allowed elements ────────────
  // Also handles the clickSelectors → link → allowPath flow:
  // when a user clicks an element matching a clickSelector that is an <a>,
  // dynamically whitelist that link's destination in the route guard.
  useEffect(() => {
    if (state.status !== 'running' || !currentStep) return;

    const handleClick = (e: MouseEvent) => {
      // Allow programmatic clicks (e.g. from tour preparations)
      if (!e.isTrusted) return;

      const target = e.target;
      if (!(target instanceof Element)) return;

      // Allow clicks inside the tour overlay (tooltip, controls, etc.)
      // Check both prefixed and unprefixed class for framework compatibility
      const overlayRoot = document.querySelector('.gt-z-\\[1000\\]') ?? document.querySelector('.z-\\[1000\\]');
      if (overlayRoot && overlayRoot.contains(target)) return;

      // Also check by tour-tooltip class as a reliable fallback
      if (target.closest('.tour-tooltip')) return;

      // Escape hatch: any host-app element marked [data-tour-exit] always
      // aborts the tour and proceeds with its native behavior (e.g. a nav
      // link navigating away). Without this, the click gate would swallow it.
      if (target.closest('[data-tour-exit]')) {
        void actions.stop();
        return;
      }

      // Allow clicks on elements matching clickSelectors
      const allowed = currentStep.clickSelectors;
      if (allowed && allowed.length > 0) {
        for (const sel of allowed) {
          if (target.closest(sel)) {
            // If this click targets a link, dynamically allow that route
            const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
            if (anchor) {
              try {
                const url = new URL(anchor.href, window.location.origin);
                routeGuard.allowPath(url.pathname);
              } catch {
                // ignore malformed hrefs
              }
            }
            return; // allow the click
          }
        }
      }

      // In 'guard' mode, also block link clicks that would navigate away
      if (routeGuard.getMode() === 'guard') {
        const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
        if (anchor) {
          try {
            const url = new URL(anchor.href, window.location.origin);
            if (!routeGuard.isPathAllowed(url.pathname)) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          } catch {
            // ignore malformed hrefs
          }
        }
      }

      // Block everything else
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [state.status, currentStep, routeGuard, actions]);

  useEffect(() => {
    return () => {
      clearHighlight();
    };
  }, [clearHighlight]);

  useEffect(() => {
    if (state.status !== 'running') {
      lastStepIdRef.current = null;
    }
  }, [state.status]);

  const confettiCleanupRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    if (state.status !== 'running' || !state.tourId || !isLast || !currentStep) {
      if (confettiCleanupRef.current) {
        confettiCleanupRef.current();
        confettiCleanupRef.current = null;
      }
      return;
    }
    
    if (confettiCleanupRef.current) {
      return;
    }
    
    const tour = registry?.get(state.tourId);
    const confettiConfig = tour?.confetti;
    
    if (confettiConfig?.enabled !== false) {
      const cleanup = startConfetti({
        duration: confettiConfig?.duration ?? 5000,
        colors: confettiConfig?.colors ?? ['#76c893', '#52b69a', '#34a0a4', '#168aad', '#1a759f', '#1e6091'],
        startVelocity: confettiConfig?.startVelocity ?? 30,
        spread: confettiConfig?.spread ?? 360,
        ticks: confettiConfig?.ticks ?? 60,
        zIndex: confettiConfig?.zIndex ?? 10000,
      });
      
      confettiCleanupRef.current = cleanup;
      
      return () => {
        if (confettiCleanupRef.current) {
          confettiCleanupRef.current();
          confettiCleanupRef.current = null;
        }
      };
    }
  }, [state.status, state.tourId, registry, isLast, currentStep]);

  const storage = useMemo(() => {
    if (state.status !== 'running' || !currentNode) {
      return new Map<string, unknown>();
    }
    const existing = services.state.storage.get(currentNode.id);
    if (existing) return existing;
    const map = new Map<string, unknown>();
    services.state.storage.set(currentNode.id, map);
    return map;
  }, [services.state.storage, state.status, currentNode]);
  
  const content = useMemo(() => {
    if (state.status !== 'running' || !currentStep || !currentNode) {
      return null;
    }

    if (currentStep.content) {
      const resolved =
        typeof currentStep.content === 'function'
          ? currentStep.content({
              tourId: state.tourId ?? currentNode.id,
              nodeId: currentNode.id,
              shared: services.state.shared,
              storage,
            })
          : currentStep.content;
      if (resolved) {
        return resolved;
      }
    }

    return null;
  }, [currentStep, services.state.shared, state.tourId, state.status, storage]);

  if (typeof document === 'undefined') return null;

  if (state.status === 'completed') {
    return null;
  }

  if (state.status === 'error') {
    const errorMessage = state.metadata?.lastError as string | undefined;
    const errorTooltipWidth = 480;
    const errorTipStyle: CSSProperties = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: errorTooltipWidth,
      maxWidth: `calc(100vw - ${TOOLTIP_PADDING * 2}px)`,
      zIndex: 1002,
      maxHeight: Math.max(220, window.innerHeight - TOOLTIP_PADDING * 2),
      overflowY: 'auto',
    };
    
    return createPortal(
      <div className="gt-fixed gt-inset-0 gt-z-[1000] gt-pointer-events-none" style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none', cursor: 'default' }}>
        <div className="gt-fixed gt-inset-0 gt-bg-black/55 dark:gt-bg-black/60 gt-pointer-events-auto" style={{ position: 'fixed', inset: 0, pointerEvents: 'auto' }} />
        <div
          className="tour-tooltip gt-rounded-lg gt-border gt-border-red-500/50 gt-bg-red-50/95 dark:gt-bg-red-950/95 gt-pointer-events-auto gt-shadow-xl gt-transition-all gt-duration-150 gt-ease-in-out"
          style={{ ...errorTipStyle, pointerEvents: 'auto', overflow: 'visible' }}
        >
          <div className="gt-px-4 gt-py-3 gt-border-b gt-border-red-200/60 dark:gt-border-red-800/60">
            <div className="gt-flex gt-items-center gt-gap-2">
              <span className="gt-text-red-600 dark:gt-text-red-400 gt-text-lg">&#9888;&#65039;</span>
              <h3 className="gt-text-sm gt-font-semibold gt-text-red-900 dark:gt-text-red-100">
                Tour Configuration Error
              </h3>
            </div>
          </div>
          <div className="gt-px-4 gt-py-3">
            <p className="gt-text-sm gt-text-red-800 dark:gt-text-red-200 gt-mb-3">
              {errorMessage || 'An error occurred while initializing the tour. Please check the console for details.'}
            </p>
            <p className="gt-text-xs gt-text-red-700 dark:gt-text-red-300 gt-mb-4">
              This is a configuration error in the tour definition. The tour cannot start until this is fixed.
            </p>
            <div className="gt-flex gt-items-center gt-justify-end gt-gap-2">
              <button
                onClick={() => void actions.stop()}
                className="gt-inline-flex gt-items-center gt-gap-2 gt-rounded-md gt-bg-red-600 gt-px-4 gt-py-2 gt-text-sm gt-font-semibold gt-text-white hover:gt-bg-red-700 dark:gt-bg-red-800 dark:hover:gt-bg-red-900 tour-btn tour-btn-primary"
              >
                {labels.close ?? 'Close Tour'}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (state.status !== 'running' || !currentStep) return null;

  const title =
    ((content?.title as ReactNode | undefined) ??
      currentStep.title ??
      (currentStep.meta?.title as ReactNode | undefined)) ?? 'Guided Step';
  const rawBody = ((content?.body as ReactNode | undefined) ?? currentStep.body ?? '') as ReactNode;
  const body = parseInlineMarkup(rawBody);
  const hint = (content as StepContent | null | undefined)?.hint as ReactNode | undefined;
  const media = (content as StepContent | null | undefined)?.media as ReactNode | undefined;

  const pointerPadding = 8;
  const pointerPadOffset = pointerPadding / 2;

  const highlightStyle = spotlightRect
    ? {
        top: spotlightRect.top - pointerPadOffset,
        left: spotlightRect.left - pointerPadOffset,
        width: spotlightRect.width + pointerPadding,
        height: spotlightRect.height + pointerPadding,
        zIndex: 1001,
      }
    : null;

  const tooltipConfig: StepTooltipConfig | undefined = currentStep.tooltip ??
    (currentStep.tipPlacement || currentStep.tipOffset
      ? {
          placement: currentStep.tipPlacement as StepTooltipConfig['placement'],
          offset: currentStep.tipOffset,
        }
      : undefined);

  const tipStyle = computeTooltipStyle(anchorRect, tooltipConfig);
  const tooltipClassName = [
    'tour-tooltip gt-rounded-lg gt-border gt-border-border gt-pointer-events-auto',
    config.tooltip?.className ?? '',
    currentStep.tooltip?.className ?? '',
  ]
    .join(' ')
    .trim();

  return createPortal(
    <div className="gt-fixed gt-inset-0 gt-z-[1000] gt-pointer-events-none" style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none', cursor: 'default' }}>
      {!highlightStyle && (
        <div
          className="gt-fixed gt-inset-0 gt-pointer-events-auto"
          style={{ position: 'fixed', inset: 0, pointerEvents: 'auto', backgroundColor: `rgba(0,0,0,var(--tour-backdrop-opacity, 0.55))` }}
        />
      )}

      {highlightStyle && (
        <div
          className="gt-fixed gt-rounded-xl gt-ring-4 gt-ring-primary/85 gt-pointer-events-none tour-highlight-pointer tour-highlight-bounce"
          style={{
            position: 'fixed',
            borderRadius: '0.75rem',
            pointerEvents: 'none',
            ...highlightStyle,
            boxShadow: `0 0 0 9999px rgba(0,0,0,var(--tour-backdrop-opacity, 0.55))`,
            backgroundColor: `var(--tour-spotlight-bg, rgba(15, 23, 42, 0.12))`,
          }}
        />
      )}

      <div
        className={tooltipClassName}
        style={{ ...tipStyle, pointerEvents: 'auto' }}
      >
        <div
          className={`tour-tooltip-header gt-px-4 gt-py-3 gt-flex gt-items-center gt-justify-between ${
            selectorOpen ? '' : 'gt-border-b gt-border-border/60'
          }`}
        >
          <button
            type="button"
            onClick={handleTitleClick}
            className="tour-tooltip-title-btn gt-flex gt-items-center gt-gap-2 gt-text-left gt-text-sm gt-font-semibold gt-text-card-foreground focus:gt-outline-none"
            aria-expanded={selectorOpen}
          >
            <span>{title}</span>
            <span
              className={`tour-tooltip-caret gt-text-muted-foreground gt-transition-transform gt-duration-150 ${
                selectorOpen ? 'gt-rotate-180' : ''
              }`}
            >
              ▾
            </span>
          </button>
          <button
            className="tour-tooltip-skip-btn gt-text-xs gt-text-muted-foreground hover:gt-text-foreground"
            onClick={handleSkipOrHubReturn}
            disabled={isTransitioning}
            aria-label={showCustomSkipLabel ? skipButtonLabel : 'Skip tour'}
          >
            {skipButtonLabel}
          </button>
        </div>

        {selectorOpen && stepItems.length > 1 && (
          <div className="tour-tooltip-selector-area gt-px-4 gt-py-3 gt-border-b gt-border-border/60">
            {config.tooltip?.renderStepSelector
              ? (config.tooltip.renderStepSelector({
                  items: stepItems,
                  value: currentStepId,
                  onChange: handleStepSelect,
                }) as ReactNode)
              : (
                <TourStepDropdown
                  items={stepItems}
                  value={currentStepId}
                  onChange={handleStepSelect}
                />
              )
            }
          </div>
        )}

        {(hint || body || media) && (
          <div
            className="tour-tooltip-body-area gt-px-4"
          >
            {hint && (
              <div className="tour-tooltip-hint gt-pt-3 gt-text-xs gt-text-muted-foreground/90">{hint}</div>
            )}

            <div className="tour-tooltip-body gt-py-3 gt-text-sm gt-text-muted-foreground gt-whitespace-pre-line">{body}</div>

            {media && <div className="tour-tooltip-media gt-pb-3">{media}</div>}
          </div>
        )}

        {showBranchChooser && (
          <div className="tour-tooltip-branches">
            <span className="tour-tooltip-branch-label">Pick a path</span>
            <div className="tour-tooltip-branch-list">
              {availableTransitions.map((transition) => (
                <button
                  key={transition.target}
                  onClick={() => void actions.goTo(transition.target)}
                  disabled={isTransitioning}
                  className="tour-tooltip-branch-item"
                >
                  <span className="tour-tooltip-branch-item-text">
                    <span className="tour-tooltip-branch-item-label">
                      {transition.label ?? transition.target}
                    </span>
                    {transition.description && (
                      <span className="tour-tooltip-branch-item-description">
                        {transition.description}
                      </span>
                    )}
                  </span>
                  <span className="tour-tooltip-branch-item-chevron" aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="tour-tooltip-slot-area">{slots.footer}</div>

        <div className="tour-tooltip-footer gt-px-4 gt-py-3 gt-border-t gt-border-border/60 gt-flex gt-items-center gt-justify-between">
          {(config.tooltip?.showStepCounter !== false) && (
            <span className="tour-tooltip-counter gt-text-xs gt-text-muted-foreground">
              Step {displayStepNumber > 0 ? displayStepNumber : '–'} of {totalSteps || '–'}
            </span>
          )}
          <div className="tour-tooltip-nav gt-flex gt-items-center gt-gap-2" style={{ marginLeft: 'auto' }}>
            {slots.footerNav}
            <button
              onClick={() => void actions.back()}
              disabled={!canGoBack || isTransitioning}
              className="tour-btn tour-btn-secondary gt-inline-flex gt-items-center gt-gap-2 gt-rounded-md gt-border gt-border-border gt-px-3 gt-py-1.5 gt-text-xs gt-font-medium gt-text-muted-foreground disabled:gt-opacity-50 disabled:gt-cursor-not-allowed hover:gt-bg-accent"
            >
              {labels.back ?? 'Back'}
            </button>
            {!isLast ? (
              <button
                onClick={() => void actions.next()}
                disabled={!canGoNext || isTransitioning}
                className="tour-btn tour-btn-primary gt-inline-flex gt-items-center gt-gap-2 gt-rounded-md gt-bg-primary gt-px-3 gt-py-1.5 gt-text-xs gt-font-semibold gt-text-primary-foreground hover:gt-bg-primary/90 disabled:gt-cursor-not-allowed disabled:gt-bg-muted disabled:gt-text-muted-foreground disabled:hover:gt-bg-muted"
              >
                {isTransitioning ? (labels.loading ?? 'Loading...') : (labels.next ?? 'Next')}
              </button>
            ) : (
              <button
                onClick={() => void actions.stop()}
                disabled={isTransitioning}
                className="tour-btn tour-btn-primary gt-inline-flex gt-items-center gt-gap-2 gt-rounded-md gt-bg-primary gt-px-3 gt-py-1.5 gt-text-xs gt-font-semibold gt-text-primary-foreground hover:gt-bg-primary/90 disabled:gt-cursor-not-allowed disabled:gt-bg-muted disabled:gt-text-muted-foreground disabled:hover:gt-bg-muted"
              >
                {labels.finish ?? 'Finish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GuidedTourOverlay;
