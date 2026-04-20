import { describe, it, expect, vi } from 'vitest';
import {
  InMemoryDemoDataBridge,
  InMemoryEventBridge,
  createDemoController,
  createEventController,
  type DemoDataBridge,
  type EventBridge,
} from './services';

const demoScope = () => ({ tourId: 't', nodeId: 'n', shared: new Map<string, unknown>() });
const eventScope = () => ({ tourId: 't', nodeId: 'n' });

describe('InMemoryDemoDataBridge', () => {
  it('round-trips set/read/remove', async () => {
    const bridge = new InMemoryDemoDataBridge();
    const scope = demoScope();

    await bridge.set(scope, 'user', { name: 'ada' });
    expect(bridge.read(scope, 'user')).toEqual({ name: 'ada' });

    await bridge.remove(scope, 'user');
    expect(bridge.read(scope, 'user')).toBeUndefined();
  });

  it('merges plain-object values into an existing record', async () => {
    const bridge = new InMemoryDemoDataBridge();
    const scope = demoScope();
    await bridge.set(scope, 'prefs', { dark: true });
    await bridge.merge(scope, 'prefs', { lang: 'en' });
    expect(bridge.read(scope, 'prefs')).toEqual({ dark: true, lang: 'en' });
  });

  it('replaces non-object values on merge', async () => {
    const bridge = new InMemoryDemoDataBridge();
    const scope = demoScope();
    await bridge.set(scope, 'count', 5);
    await bridge.merge(scope, 'count', { lang: 'en' });
    expect(bridge.read(scope, 'count')).toEqual({ lang: 'en' });
  });

  it('clears everything when no namespace is given', async () => {
    const bridge = new InMemoryDemoDataBridge();
    const scope = demoScope();
    await bridge.set(scope, 'a', 1);
    await bridge.set(scope, 'b', 2);
    await bridge.clear(scope);
    expect(bridge.read(scope, 'a')).toBeUndefined();
    expect(bridge.read(scope, 'b')).toBeUndefined();
  });

  it('clears only the given namespace when specified', async () => {
    const bridge = new InMemoryDemoDataBridge();
    const scope = demoScope();
    await bridge.set(scope, 'a', 1);
    await bridge.set(scope, 'b', 2);
    await bridge.clear(scope, 'a');
    expect(bridge.read(scope, 'a')).toBeUndefined();
    expect(bridge.read(scope, 'b')).toBe(2);
  });
});

describe('InMemoryEventBridge', () => {
  it('does not emit until it has been enabled (implicitly via intercept)', async () => {
    const bridge = new InMemoryEventBridge();
    const scope = eventScope();
    const handler = vi.fn();

    await bridge.emit(scope, 'click', { x: 1 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('delivers to interceptors after subscribing', async () => {
    const bridge = new InMemoryEventBridge();
    const scope = eventScope();
    const handler = vi.fn();
    bridge.intercept(scope, 'click', handler);

    await bridge.emit(scope, 'click', { x: 1 });
    expect(handler).toHaveBeenCalledWith({ x: 1 });
  });

  it('stops delivering after unsubscribe', async () => {
    const bridge = new InMemoryEventBridge();
    const scope = eventScope();
    const handler = vi.fn();
    const unsubscribe = bridge.intercept(scope, 'click', handler);

    unsubscribe();
    await bridge.emit(scope, 'click', { x: 1 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('honors the once option by removing the interceptor after first delivery', async () => {
    const bridge = new InMemoryEventBridge();
    const scope = eventScope();
    const handler = vi.fn();
    bridge.intercept(scope, 'click', handler, { once: true });

    await bridge.emit(scope, 'click', 1);
    await bridge.emit(scope, 'click', 2);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1);
  });

  it('clear(event) only drops interceptors for that event', async () => {
    const bridge = new InMemoryEventBridge();
    const scope = eventScope();
    const aHandler = vi.fn();
    const bHandler = vi.fn();
    bridge.intercept(scope, 'a', aHandler);
    bridge.intercept(scope, 'b', bHandler);

    bridge.clear(scope, 'a');
    await bridge.emit(scope, 'a', null);
    await bridge.emit(scope, 'b', null);
    expect(aHandler).not.toHaveBeenCalled();
    expect(bHandler).toHaveBeenCalled();
  });

  it('clear() with no event drops all interceptors', async () => {
    const bridge = new InMemoryEventBridge();
    const scope = eventScope();
    const handler = vi.fn();
    bridge.intercept(scope, 'x', handler);
    bridge.clear(scope);
    await bridge.emit(scope, 'x', null);
    expect(handler).not.toHaveBeenCalled();
  });

  it('disable() turns the bridge off and drops all listeners', async () => {
    const bridge = new InMemoryEventBridge();
    const scope = eventScope();
    const handler = vi.fn();
    bridge.intercept(scope, 'x', handler);

    bridge.disable();
    await bridge.emit(scope, 'x', null);
    expect(handler).not.toHaveBeenCalled();

    bridge.enable();
    await bridge.emit(scope, 'x', null);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('createDemoController', () => {
  it('routes calls through the bridge with the bound scope', async () => {
    const bridge: DemoDataBridge = {
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      merge: vi.fn(),
      read: vi.fn().mockReturnValue('x'),
    };
    const scope = demoScope();
    const controller = createDemoController(bridge, scope);

    controller.set('key', 'value');
    controller.remove('key');
    controller.clear('ns');
    controller.merge('key', { a: 1 });
    expect(controller.read('key')).toBe('x');

    expect(bridge.set).toHaveBeenCalledWith(scope, 'key', 'value');
    expect(bridge.remove).toHaveBeenCalledWith(scope, 'key');
    expect(bridge.clear).toHaveBeenCalledWith(scope, 'ns');
    expect(bridge.merge).toHaveBeenCalledWith(scope, 'key', { a: 1 });
  });

  it('falls back to read+set when the bridge does not implement merge', () => {
    const store = new Map<string, unknown>([['key', { a: 1 }]]);
    const bridge: DemoDataBridge = {
      set: vi.fn((_s, k, v) => { store.set(k, v); }),
      remove: vi.fn(),
      clear: vi.fn(),
      read: vi.fn((_s, k) => store.get(k)),
    };
    const controller = createDemoController(bridge, demoScope());
    controller.merge('key', { b: 2 });
    expect(bridge.set).toHaveBeenLastCalledWith(expect.anything(), 'key', { a: 1, b: 2 });
  });
});

describe('createEventController', () => {
  it('proxies emit/intercept/clear/enable/disable onto the bridge', () => {
    const scope = eventScope();
    const bridge: EventBridge = {
      emit: vi.fn(),
      intercept: vi.fn().mockReturnValue(() => {}),
      clear: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
    };
    const controller = createEventController(bridge, scope);

    controller.emit('click', { x: 1 });
    const handler = vi.fn();
    controller.intercept('click', handler);
    controller.clear('click');
    controller.enable();
    controller.disable();

    expect(bridge.emit).toHaveBeenCalledWith(scope, 'click', { x: 1 });
    expect(bridge.intercept).toHaveBeenCalledWith(scope, 'click', handler, undefined);
    expect(bridge.clear).toHaveBeenCalledWith(scope, 'click');
    expect(bridge.enable).toHaveBeenCalledWith(scope);
    expect(bridge.disable).toHaveBeenCalledWith(scope);
  });

  it('once() auto-unsubscribes after the handler runs', async () => {
    const bridge = new InMemoryEventBridge();
    const scope = eventScope();
    const controller = createEventController(bridge, scope);
    const handler = vi.fn();

    controller.once('tick', handler);
    await bridge.emit(scope, 'tick', 1);
    await bridge.emit(scope, 'tick', 2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1);
  });
});
