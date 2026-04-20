/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { createStep } from './stepFactory';
import type { StepRuntimeContext } from '../types';

const ctx = (overrides: Partial<StepRuntimeContext> = {}): StepRuntimeContext =>
  ({
    setTourAttribute: vi.fn(),
    removeTourAttribute: vi.fn(),
    getTourAttribute: vi.fn(),
    waitForElement: vi.fn().mockRejectedValue(new Error('not found')),
    advance: vi.fn(),
    next: vi.fn(),
    back: vi.fn(),
    goTo: vi.fn(),
    registerCleanup: vi.fn(),
    resolveTarget: vi.fn(),
    interceptEvent: vi.fn().mockReturnValue(() => {}),
    ensurePreparation: vi.fn(),
    releasePreparation: vi.fn(),
    setShared: vi.fn(),
    getShared: vi.fn(),
    ...overrides,
  } as unknown as StepRuntimeContext);

describe('createStep: shape', () => {
  it('populates id/route/title/body and normalizes selectors', () => {
    const step = createStep('s1', '/a', '.btn', 'Hello', 'Body copy');
    expect(step.id).toBe('s1');
    expect(step.route).toBe('/a');
    expect(step.selector).toBe('.btn');
    expect(step.selectors).toEqual([{ target: '.btn' }]);
    expect(step.content).toEqual({ title: 'Hello', body: 'Body copy' });
    expect(step.title).toBe('Hello');
    expect(step.body).toBe('Body copy');
  });

  it('preserves multiple selectors', () => {
    const step = createStep('s1', '/a', ['.a', 'highlight:.b'], 't', 'b');
    expect(step.selectors).toEqual([
      { target: '.a' },
      { target: '.b', highlight: true },
    ]);
  });

  it('propagates next/previous', () => {
    const step = createStep('s1', '/a', '.btn', 't', 'b', undefined, undefined, 'next-id', 'prev-id');
    expect(step.next).toBe('next-id');
    expect(step.previous).toBe('prev-id');
  });
});

describe('createStep: tooltip', () => {
  it('omits tooltip when no placement or offset is given', () => {
    const step = createStep('s1', '/', '.btn', 't', 'b');
    expect(step.tooltip).toBeUndefined();
  });

  it('creates a tooltip when placement is set', () => {
    const step = createStep('s1', '/', '.btn', 't', 'b', 'top');
    expect(step.tooltip).toEqual({ placement: 'top', offset: undefined });
  });

  it('includes offset only when x or y is provided, defaulting the other to 0', () => {
    const step = createStep('s1', '/', '.btn', 't', 'b', 'top', { tipOffset: { x: 4 } });
    expect(step.tooltip).toEqual({ placement: 'top', offset: { x: 4, y: 0 } });
  });
});

describe('createStep: route modes', () => {
  it('adopts explicit routeMode from config', () => {
    const step = createStep('s1', '/', '.btn', 't', 'b', undefined, { routeMode: 'navigate' });
    expect(step.routeMode).toBe('navigate');
  });

  it('falls back to guard mode for restrictRoute: true', () => {
    const step = createStep('s1', '/', '.btn', 't', 'b', undefined, { restrictRoute: true });
    expect(step.routeMode).toBe('guard');
  });

  it('adopts an explicit path list from restrictRoute as the step route', () => {
    const step = createStep('s1', '/', '.btn', 't', 'b', undefined, {
      restrictRoute: ['/a', '/b'],
    });
    expect(step.routeMode).toBe('guard');
    expect(step.route).toEqual(['/a', '/b']);
  });
});

describe('createStep: click requirements', () => {
  it('exposes clickSelectors derived from both all and any', () => {
    const step = createStep('s1', '/', '.btn', 't', 'b', undefined, {
      click: { all: ['.a'], any: ['.b', '.c'] },
    });
    expect(step.clickSelectors).toEqual(['.a', '.b', '.c']);
  });

  it('canNavigateNext returns false when clicks are unsatisfied and true once they are', async () => {
    document.body.innerHTML = '<button class="a"></button><button class="b"></button>';
    const step = createStep('s1', '/', '.btn', 't', 'b', undefined, {
      click: { all: ['.a', '.b'] },
    });

    expect(step.canNavigateNext).toBeDefined();

    const waitForElement = vi.fn(async (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error('not found');
      return el;
    });
    await step.onEnter?.(ctx({ waitForElement }));
    const before = await step.canNavigateNext!(ctx());
    expect(before).toBe(false);

    (document.querySelector('.a') as HTMLElement).click();
    (document.querySelector('.b') as HTMLElement).click();
    const after = await step.canNavigateNext!(ctx());
    expect(after).toBe(true);

    await step.onExit?.(ctx());
  });
});

describe('createStep: text input requirement', () => {
  it('unlocks canNavigateNext once the input matches', async () => {
    document.body.innerHTML = '<input class="field" />';
    const step = createStep('s1', '/', '.btn', 't', 'b', undefined, {
      textInput: { selector: '.field', match: 'hello' },
    });

    await step.onEnter?.(ctx());

    const input = document.querySelector('.field') as HTMLInputElement;
    const before = await step.canNavigateNext!(ctx());
    expect(before).toBe(false);

    input.value = 'hello world';
    input.dispatchEvent(new Event('input'));
    const after = await step.canNavigateNext!(ctx());
    expect(after).toBe(true);

    await step.onExit?.(ctx());
  });
});

describe('createStep: lifecycle', () => {
  it('applies setTourAttributes onEnter', async () => {
    const setTourAttribute = vi.fn();
    const step = createStep('s1', '/', '.btn', 't', 'b', undefined, {
      setTourAttributes: { mode: 'editing' },
    });
    await step.onEnter?.(ctx({ setTourAttribute }));
    expect(setTourAttribute).toHaveBeenCalledWith('mode', 'editing');
  });

  it('invokes onInteractables with the config when provided', async () => {
    const onInteractables = vi.fn();
    const step = createStep(
      's1',
      '/',
      '.btn',
      't',
      'b',
      undefined,
      { interactables: { open: { id: 'x' } } },
      undefined,
      undefined,
      { onInteractables },
    );
    await step.onEnter?.(ctx());
    expect(onInteractables).toHaveBeenCalled();
    const [cfg] = onInteractables.mock.calls[0];
    expect(cfg).toEqual({ open: { id: 'x' } });
  });

  it('invokes onAllowTourActions with the resolved action map', async () => {
    const onAllowTourActions = vi.fn();
    const step = createStep(
      's1',
      '/',
      '.btn',
      't',
      'b',
      undefined,
      { allowTourActions: ['next', 'back'] },
      undefined,
      undefined,
      { onAllowTourActions },
    );
    await step.onEnter?.(ctx());
    expect(onAllowTourActions).toHaveBeenCalled();
    const [map] = onAllowTourActions.mock.calls[0];
    expect(map).toEqual({ next: 'allow', back: 'allow' });
  });
});
