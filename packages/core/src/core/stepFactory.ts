import type { StepConfig, StepDefinition, StepSelectorConfig, StepRuntimeContext, TipPlacement, StepClickRequirements, StepInteractablesConfig } from '../types';
import { toStepSelectorConfig } from './selectors';

export async function prepareAndClick(
  ctx: StepRuntimeContext,
  prepId: string,
  open: () => void,
  selector: string,
  options?: { timeoutMs?: number; cleanup?: () => void }): Promise<void> {
    
  const timeoutMs = options?.timeoutMs ?? 2000;
  await ctx.ensurePreparation(prepId, async () => {
    open();
    const el = await ctx.waitForElement(selector, timeoutMs).catch(() => null);
    if (el instanceof HTMLElement) {
      el.click();
    }
    return async () => {
      if (options?.cleanup) {
        options.cleanup();
      }
    };
  });
}

export interface StepFactoryOptions {
  onAllowTourActions?: (
    map: Record<string, string>,
    ctx: StepRuntimeContext,
    step: StepDefinition,
  ) => void | Promise<void>;

  onInteractables?: (
    cfg: StepInteractablesConfig | StepInteractablesConfig[],
    ctx: StepRuntimeContext,
    step: StepDefinition,
  ) => void | Promise<void>;
}

export function createStep(
  id: string,
  route: string,
  selector: string | string[],
  title: string,
  body: string,
  tipPlacement?: TipPlacement,
  config?: StepConfig,
  next?: string,
  previous?: string,
  options?: StepFactoryOptions,
): StepDefinition {
  const selectors: StepSelectorConfig[] = toStepSelectorConfig(selector);
  const stepConfig: StepConfig = config ?? {};
  const clickedSelectors = new Set<string>();
  let clickHandlersRef: Array<{ element: HTMLElement; handler: () => void }> = [];
  let pollIntervalRef: ReturnType<typeof setInterval> | null = null;
  let textInputSatisfied = false;
  let textInputListenerRef: { element: HTMLElement; handler: () => void } | null = null;
  let textInputPollRef: ReturnType<typeof setInterval> | null = null;

  const tooltip =
    tipPlacement || stepConfig.tipOffset
      ? {
          placement: tipPlacement,
          offset:
            stepConfig.tipOffset &&
            (stepConfig.tipOffset.x !== undefined || stepConfig.tipOffset.y !== undefined)
              ? { x: stepConfig.tipOffset.x ?? 0, y: stepConfig.tipOffset.y ?? 0 }
              : undefined,
        }
      : undefined;

  const step: StepDefinition = {
    id,
    route,
    selector,
    selectors,
    content: {
      title,
      body,
    },
    title,
    body,
    next,
    previous,
  };

  if (tooltip) {
    step.tooltip = tooltip;
  }

  const allowTourActionsMap: Record<string, string> = (() => {
    const source = stepConfig.allowTourActions;
    if (!source) {
      return {};
    }
    if (typeof source === 'string') {
      return { [source]: 'allow' };
    }
    if (Array.isArray(source)) {
      return source.reduce<Record<string, string>>((acc, action) => {
        acc[action] = 'allow';
        return acc;
      }, {});
    }
    return Object.entries(source).reduce<Record<string, string>>((acc, [action, value]) => {
      acc[action] = value ?? 'allow';
      return acc;
    }, {});
  })();

  let combinedOnExit = step.onExit;

  const hasClickRequirements = !!stepConfig.click &&
    ((stepConfig.click.all && stepConfig.click.all.length > 0) ||
      (stepConfig.click.any && stepConfig.click.any.length > 0));

  const hasTextInputRequirement = !!stepConfig.textInput;

  if (hasClickRequirements) {
    step.clickSelectors = [
      ...(stepConfig.click!.all ?? []),
      ...(stepConfig.click!.any ?? []),
    ];
  }

  // Map route mode from config onto the step definition at construction time
  // (before onEnter, so the state machine sees it when building the route policy).
  if (!step.routeMode) {
    if (stepConfig.routeMode) {
      step.routeMode = stepConfig.routeMode;
    } else if (stepConfig.restrictRoute) {
      step.routeMode = 'guard';
      // If restrictRoute specified explicit paths, expose them as the step's route
      // so the route policy includes all of them (not just the primary).
      if (Array.isArray(stepConfig.restrictRoute) && stepConfig.restrictRoute.length > 0) {
        step.route = stepConfig.restrictRoute.filter(Boolean);
      }
    }
  }

  if (hasClickRequirements || hasTextInputRequirement) {
    step.canNavigateNext = () => {
      const clickOk = !hasClickRequirements || isClickRequirementsSatisfied(stepConfig.click!, clickedSelectors);
      const textOk = !hasTextInputRequirement || textInputSatisfied;
      return clickOk && textOk;
    };
  }

  const originalOnEnter = step.onEnter;

  step.onEnter = async (ctx: StepRuntimeContext) => {
    if (originalOnEnter) {
      await originalOnEnter(ctx);
    }

    if (stepConfig.setTourAttributes) {
      Object.entries(stepConfig.setTourAttributes).forEach(([name, value]) => {
        ctx.setTourAttribute(name, value);
      });
    }

    if (stepConfig.interactables && options?.onInteractables) {
      await options.onInteractables(stepConfig.interactables, ctx, step);
    }

    if (Object.keys(allowTourActionsMap).length > 0 && options?.onAllowTourActions) {
      await options.onAllowTourActions(allowTourActionsMap, ctx, step);
    }

    if (hasClickRequirements && stepConfig.click) {
      clickedSelectors.clear();
      clickHandlersRef.forEach(({ element, handler }) => {
        try {
          element.removeEventListener('click', handler, true);
        } catch {}
      });
      clickHandlersRef = [];
      if (pollIntervalRef) {
        clearInterval(pollIntervalRef);
        pollIntervalRef = null;
      }

      const allSelectors: string[] = [
        ...(stepConfig.click.all ?? []),
        ...(stepConfig.click.any ?? []),
      ];

      const autoAdvance = stepConfig.autoAdvance ?? false;
      const autoAdvanceDelay = stepConfig.autoAdvanceDelay ?? 60;

      const attachHandler = (element: HTMLElement, selector: string) => {
        const handler = async () => {
            clickedSelectors.add(selector);

          if (pollIntervalRef) {
            clearInterval(pollIntervalRef);
            pollIntervalRef = null;
          }

          if (autoAdvance && isClickRequirementsSatisfied(stepConfig.click!, clickedSelectors)) {
            setTimeout(async () => {
              try {
                await ctx.advance();
              } catch {
                console.debug('Failed to advance');
              }
            }, autoAdvanceDelay);
          }
        };

        element.addEventListener('click', handler, { once: true, capture: true });
        clickHandlersRef.push({ element, handler });
      };

      const clickWaitTimeout = 0;
      for (const selector of allSelectors) 
      {
        try 
        {
          const element = await ctx.waitForElement(selector, clickWaitTimeout);
          if (element instanceof HTMLElement) {
            attachHandler(element, selector);
          }
        } 
        catch 
        {}
      }

      let pollCount = 0;
      const maxPolls = 50;
      pollIntervalRef = setInterval(() => {
        pollCount++;
        if (pollCount >= maxPolls || isClickRequirementsSatisfied(stepConfig.click!, clickedSelectors)) {
          if (pollIntervalRef) {
            clearInterval(pollIntervalRef);
            pollIntervalRef = null;
          }
          return;
        }

        for (const selector of allSelectors) {
          const element = document.querySelector(selector);
          if (
            element instanceof HTMLElement &&
            !clickHandlersRef.some((entry) => entry.element === element)
          ) {
            attachHandler(element, selector);
          }
        }
      }, 100);

      const prevOnExit = combinedOnExit;
      combinedOnExit = async (ctx2: StepRuntimeContext) => {
        if (pollIntervalRef) {
          clearInterval(pollIntervalRef);
          pollIntervalRef = null;
        }
        clickHandlersRef.forEach(({ element, handler }) => {
          try {
            element.removeEventListener('click', handler, true);
          } catch {
            console.debug('Click handler not found for element', element);
          }
        });
        clickHandlersRef = [];
        clickedSelectors.clear();
        if (prevOnExit) {
          await prevOnExit(ctx2);
        }
      };
    }

    if (hasTextInputRequirement && stepConfig.textInput) {
      textInputSatisfied = false;

      // Allow clicks on the text input element
      if (!step.clickSelectors) {
        step.clickSelectors = [];
      }
      if (!step.clickSelectors.includes(stepConfig.textInput.selector)) {
        step.clickSelectors.push(stepConfig.textInput.selector);
      }

      const textReq = stepConfig.textInput;
      const textAutoAdvance = textReq.autoAdvance ?? false;
      const textAutoAdvanceDelay = textReq.autoAdvanceDelay ?? 60;

      const checkMatch = (value: string): boolean => {
        if (typeof textReq.match === 'string') {
          return value.includes(textReq.match);
        }
        return textReq.match.test(value);
      };

      const attachTextListener = (element: HTMLElement) => {
        const handler = () => {
          const value = (element as HTMLInputElement | HTMLTextAreaElement).value ?? '';
          const matched = checkMatch(value);

          if (matched && !textInputSatisfied) {
            textInputSatisfied = true;

            if (textInputPollRef) {
              clearInterval(textInputPollRef);
              textInputPollRef = null;
            }

            if (textAutoAdvance) {
              setTimeout(async () => {
                try {
                  await ctx.advance();
                } catch {
                  console.debug('Failed to auto-advance after text input');
                }
              }, textAutoAdvanceDelay);
            }
          } else if (!matched) {
            textInputSatisfied = false;
          }
        };

        element.addEventListener('input', handler);
        textInputListenerRef = { element, handler };
      };

      const inputEl = document.querySelector(textReq.selector);
      if (inputEl instanceof HTMLElement) {
        attachTextListener(inputEl);
        // Check initial value
        const initialValue = (inputEl as HTMLInputElement | HTMLTextAreaElement).value ?? '';
        if (checkMatch(initialValue)) {
          textInputSatisfied = true;
        }
      }

      // Poll for element if not found yet
      let textPollCount = 0;
      const textMaxPolls = 50;
      textInputPollRef = setInterval(() => {
        textPollCount++;
        if (textPollCount >= textMaxPolls || textInputSatisfied) {
          if (textInputPollRef) {
            clearInterval(textInputPollRef);
            textInputPollRef = null;
          }
          return;
        }

        if (!textInputListenerRef) {
          const el = document.querySelector(textReq.selector);
          if (el instanceof HTMLElement) {
            attachTextListener(el);
            const val = (el as HTMLInputElement | HTMLTextAreaElement).value ?? '';
            if (checkMatch(val)) {
              textInputSatisfied = true;
            }
          }
        }
      }, 100);

      const prevTextOnExit = combinedOnExit;
      combinedOnExit = async (ctx2: StepRuntimeContext) => {
        if (textInputPollRef) {
          clearInterval(textInputPollRef);
          textInputPollRef = null;
        }
        if (textInputListenerRef) {
          textInputListenerRef.element.removeEventListener('input', textInputListenerRef.handler);
          textInputListenerRef = null;
        }
        textInputSatisfied = false;
        if (prevTextOnExit) {
          await prevTextOnExit(ctx2);
        }
      };
    }
  };

  step.onExit = async (ctx: StepRuntimeContext) => {
    if (combinedOnExit) {
      await combinedOnExit(ctx);
    }
  };

  return step;
}

function isClickRequirementsSatisfied(req: StepClickRequirements, clicked: Set<string>): boolean {
  const allOk = !req.all || req.all.every((sel) => clicked.has(sel));
  const anyOk = !req.any || req.any.some((sel) => clicked.has(sel));
  return allOk && anyOk;
}