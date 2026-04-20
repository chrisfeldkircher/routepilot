/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  toInteractableIds,
  setLockAttr,
  emitInteractableEvent,
  handleInteractablesEnter,
  handleInteractablesExit,
} from './interactables';

describe('toInteractableIds', () => {
  it('returns [] for undefined', () => {
    expect(toInteractableIds(undefined)).toEqual([]);
  });

  it('wraps a single ref', () => {
    expect(toInteractableIds({ id: 'x' })).toEqual(['x']);
  });

  it('maps an array of refs to ids', () => {
    expect(toInteractableIds([{ id: 'a' }, { id: 'b' }])).toEqual(['a', 'b']);
  });
});

describe('setLockAttr', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-tour-lock-open');
    document.documentElement.removeAttribute('data-tour-lock-close');
  });

  it('adds ids to the open lock attribute', () => {
    setLockAttr('open', ['a', 'b'], 'add');
    expect(document.documentElement.getAttribute('data-tour-lock-open')).toBe('a,b');
  });

  it('uses a separate attribute for close locks', () => {
    setLockAttr('close', ['x'], 'add');
    expect(document.documentElement.getAttribute('data-tour-lock-close')).toBe('x');
    expect(document.documentElement.getAttribute('data-tour-lock-open')).toBeNull();
  });

  it('deduplicates when the same id is added twice', () => {
    setLockAttr('open', ['a'], 'add');
    setLockAttr('open', ['a', 'b'], 'add');
    expect(document.documentElement.getAttribute('data-tour-lock-open')).toBe('a,b');
  });

  it('removes ids from the attribute', () => {
    setLockAttr('open', ['a', 'b', 'c'], 'add');
    setLockAttr('open', ['b'], 'remove');
    expect(document.documentElement.getAttribute('data-tour-lock-open')).toBe('a,c');
  });

  it('clears the attribute entirely when the set becomes empty', () => {
    setLockAttr('open', ['a'], 'add');
    setLockAttr('open', ['a'], 'remove');
    expect(document.documentElement.getAttribute('data-tour-lock-open')).toBeNull();
  });
});

describe('emitInteractableEvent', () => {
  it('dispatches a CustomEvent with the id in detail', () => {
    const listener = vi.fn();
    window.addEventListener('guided-tour:interactable-open', listener as EventListener);

    emitInteractableEvent('open', 'menu');

    expect(listener).toHaveBeenCalledOnce();
    const event = listener.mock.calls[0][0] as CustomEvent<{ id: string }>;
    expect(event.type).toBe('guided-tour:interactable-open');
    expect(event.detail).toEqual({ id: 'menu' });

    window.removeEventListener('guided-tour:interactable-open', listener as EventListener);
  });
});

describe('handleInteractablesEnter / Exit', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-tour-lock-open');
    document.documentElement.removeAttribute('data-tour-lock-close');
  });

  it('emits open/close events and sets locks on enter', () => {
    const opens: string[] = [];
    const closes: string[] = [];
    const openListener = (e: Event) => opens.push((e as CustomEvent<{ id: string }>).detail.id);
    const closeListener = (e: Event) => closes.push((e as CustomEvent<{ id: string }>).detail.id);
    window.addEventListener('guided-tour:interactable-open', openListener);
    window.addEventListener('guided-tour:interactable-close', closeListener);

    handleInteractablesEnter({
      open: [{ id: 'panel' }],
      close: { id: 'sidebar' },
      lockOpen: { id: 'panel' },
      lockClose: { id: 'sidebar' },
    });

    expect(opens).toEqual(['panel']);
    expect(closes).toEqual(['sidebar']);
    expect(document.documentElement.getAttribute('data-tour-lock-open')).toBe('panel');
    expect(document.documentElement.getAttribute('data-tour-lock-close')).toBe('sidebar');

    window.removeEventListener('guided-tour:interactable-open', openListener);
    window.removeEventListener('guided-tour:interactable-close', closeListener);
  });

  it('releases the same ids on exit when no explicit release* override is given', () => {
    handleInteractablesEnter({
      lockOpen: { id: 'panel' },
      lockClose: { id: 'sidebar' },
    });
    handleInteractablesExit({
      lockOpen: { id: 'panel' },
      lockClose: { id: 'sidebar' },
    });

    expect(document.documentElement.getAttribute('data-tour-lock-open')).toBeNull();
    expect(document.documentElement.getAttribute('data-tour-lock-close')).toBeNull();
  });

  it('honors an explicit releaseOpen list', () => {
    handleInteractablesEnter({ lockOpen: [{ id: 'a' }, { id: 'b' }] });
    handleInteractablesExit({ releaseOpen: { id: 'a' }, lockOpen: [{ id: 'a' }, { id: 'b' }] });
    expect(document.documentElement.getAttribute('data-tour-lock-open')).toBe('b');
  });

  it('accepts an array of configs', () => {
    handleInteractablesEnter([
      { lockOpen: { id: 'a' } },
      { lockClose: { id: 'z' } },
    ]);
    expect(document.documentElement.getAttribute('data-tour-lock-open')).toBe('a');
    expect(document.documentElement.getAttribute('data-tour-lock-close')).toBe('z');
  });
});
