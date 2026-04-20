import type {
  DemoDataController,
  EventController,
  EventInterceptorOptions,
  NodeId,
  TourEventHandler,
} from './types';

interface DemoBridgeScope {
  tourId: string;
  nodeId?: NodeId | null;
  shared: Map<string, unknown>;
}

interface EventBridgeScope {
  tourId: string;
  nodeId?: NodeId | null;
}

export interface DemoDataBridge {
  set(scope: DemoBridgeScope, key: string, value: unknown): Promise<void> | void;
  merge?(scope: DemoBridgeScope, key: string, value: Record<string, unknown>): Promise<void> | void;
  remove(scope: DemoBridgeScope, key: string): Promise<void> | void;
  clear(scope: DemoBridgeScope, namespace?: string): Promise<void> | void;
  read?(scope: DemoBridgeScope, key: string): unknown;
}

export interface EventBridge {
  emit<T = unknown>(scope: EventBridgeScope, event: string, payload: T): Promise<void> | void;
  intercept<T = unknown>(
    scope: EventBridgeScope,
    event: string,  
    handler: TourEventHandler<T>,
    options?: EventInterceptorOptions
  ): () => void;
  clear(scope: EventBridgeScope, event?: string): void;
  enable(scope: EventBridgeScope): void;
  disable(scope: EventBridgeScope): void;
}

class DemoDataService implements DemoDataController {
  private readonly bridge: DemoDataBridge;
  private readonly scope: DemoBridgeScope;

  constructor(bridge: DemoDataBridge, scope: DemoBridgeScope) {
    this.bridge = bridge;
    this.scope = scope;
  }

  set(key: string, value: unknown): Promise<void> | void {
    return this.bridge.set(this.scope, key, value);
  }

  merge(key: string, value: Record<string, unknown>): Promise<void> | void {
    if (this.bridge.merge) {
      return this.bridge.merge(this.scope, key, value);
    }

    const current = this.bridge.read?.(this.scope, key);
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      return this.bridge.set(this.scope, key, { ...current as Record<string, unknown>, ...value });
    }
    return this.bridge.set(this.scope, key, value);
  }

  remove(key: string): Promise<void> | void {
    return this.bridge.remove(this.scope, key);
  }

  clear(namespace?: string): Promise<void> | void {
    return this.bridge.clear(this.scope, namespace);
  }

  read(key: string): unknown {
    return this.bridge.read?.(this.scope, key);
  }
}

class EventService implements EventController {
  private readonly bridge: EventBridge;
  private readonly scope: EventBridgeScope;

  constructor(bridge: EventBridge, scope: EventBridgeScope) {
    this.bridge = bridge;
    this.scope = scope;
  }

  emit<T = unknown>(event: string, payload: T): Promise<void> | void {
    return this.bridge.emit<T>(this.scope, event, payload);
  }

  intercept<T = unknown>(
    event: string,
    handler: TourEventHandler<T>,
    options?: EventInterceptorOptions
  ): () => void {
    return this.bridge.intercept<T>(this.scope, event, handler, options);
  }

  once<T = unknown>(event: string, handler: TourEventHandler<T>): () => void {
    const unsubscribe = this.bridge.intercept<T>(this.scope, event, async (payload) => {
      try {
        await handler(payload);
      } finally {
        unsubscribe();
      }
    });
    return unsubscribe;
  }

  clear(event?: string): void {
    this.bridge.clear(this.scope, event);
  }

  enable(): void {
    this.bridge.enable(this.scope);
  }

  disable(): void {
    this.bridge.disable(this.scope);
  }
}

export class InMemoryDemoDataBridge implements DemoDataBridge {
  private readonly store = new Map<string, unknown>();

  async set(_: DemoBridgeScope, key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
  }

  async merge(_: DemoBridgeScope, key: string, value: Record<string, unknown>): Promise<void> {
    const current = this.store.get(key);
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      this.store.set(key, { ...(current as Record<string, unknown>), ...value });
    } else {
      this.store.set(key, value);
    }
  }

  async remove(_: DemoBridgeScope, key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(_: DemoBridgeScope, namespace?: string): Promise<void> {
    if (!namespace) {
      this.store.clear();
      return;
    }
    this.store.delete(namespace);
  }

  read(_: DemoBridgeScope, key: string): unknown {
    return this.store.get(key);
  }
}

type InterceptorEntry = {
  handler: TourEventHandler<unknown>;
  options: EventInterceptorOptions;
};

export class InMemoryEventBridge implements EventBridge {
  private readonly interceptors = new Map<string, Set<InterceptorEntry>>();
  private enabled = false;

  async emit<T = unknown>(_: EventBridgeScope, event: string, payload: T): Promise<void> {
    if (!this.enabled) return;
    const listeners = this.interceptors.get(event);
    if (!listeners || listeners.size === 0) return;

    const entries = Array.from(listeners);
    await Promise.all(
      entries.map(async (entry) => {
        await entry.handler(payload);
        if (entry.options.once) {
          listeners.delete(entry);
        }
      })
    );
  }

  intercept<T = unknown>(
    _scope: EventBridgeScope,
    event: string,
    handler: TourEventHandler<T>,
    options: EventInterceptorOptions = {}
  ): () => void {
    if (!this.enabled) {
      this.enabled = true;
    }
    if (!this.interceptors.has(event)) {
      this.interceptors.set(event, new Set());
    }
    const entry: InterceptorEntry = { handler: handler as TourEventHandler, options };
    const listeners = this.interceptors.get(event)!;
    listeners.add(entry);

    return () => {
      listeners.delete(entry);
      if (listeners.size === 0) {
        this.interceptors.delete(event);
      }
    };
  }

  clear(_: EventBridgeScope, event?: string): void {
    if (event) {
      this.interceptors.delete(event);
    } else {
      this.interceptors.clear();
    }
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
    this.interceptors.clear();
  }
}

export const createDemoController = (bridge: DemoDataBridge, scope: DemoBridgeScope): DemoDataController => {
  return new DemoDataService(bridge, scope);
};

export const createEventController = (bridge: EventBridge, scope: EventBridgeScope): EventController => {
  return new EventService(bridge, scope);
};
