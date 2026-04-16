import {
  createDemoController,
  createEventController,
  InMemoryDemoDataBridge,
  InMemoryEventBridge,
  type DemoDataBridge,
  type EventBridge,
} from '../services';
import type {
  StepDefinition,
  StepSelectorConfig,
  NodeId,
  StepRuntimeContext,
  StepSceneFactory,
  TourDefinition,
  TourLifecycleContext,
  TourMachineSnapshot,
  TourServices,
  StepTargetResolver,
  TourEventHandler,
  TourId,
  StepTransition,
  StepTransitionOption,
  PreparationScope,
  PreparationCleanup,
  PreparationOptions,
  StepPreparationDefinition,
} from '../types';

import type { DagTourDefinition, DagTourHistory, DagTourNode } from '../core/dagTourHistory';
import { buildDag } from '../core/buildDag';
import { handleInteractablesEnter, handleInteractablesExit } from '../core/interactables';
import { TourRouteGuard, normalizePath, type RoutePolicy } from '../navigation';

type StateListener = (state: TourMachineSnapshot) => void;

interface TourStateMachineOptions {
  demoBridge?: DemoDataBridge;
  eventBridge?: EventBridge;
  /** Enable debug logging to the browser console. Off by default. */
  debug?: boolean | TourDebugLogger;
}

const MAX_PERSISTED_HISTORY = 200;
const MAX_PERSISTED_STACK = 200;

/**
 * Optional debug logger for the tour engine.
 *
 * Consumers enable it via `new TourStateMachine({ debug: true })`.
 * When disabled (the default) this is a no-op — zero runtime cost.
 */
export type TourDebugLogger = (label: string, detail?: unknown) => void;

const noopLogger: TourDebugLogger = () => {};

const createConsoleLogger = (): TourDebugLogger => (label, detail) => {
  if (detail !== undefined) {
    console.debug(
      `%c[tour] %c${label}`,
      'color: #6366f1; font-weight: bold',
      'color: #22d3ee',
      detail
    );
  } else {
    console.debug(
      `%c[tour] %c${label}`,
      'color: #6366f1; font-weight: bold',
      'color: #22d3ee'
    );
  }
};

/**
 * Always-on log for non-fatal lifecycle errors.
 *
 * `severity`:
 * - `'error'` — for setup hooks (onEnter, preparation) whose failure leaves
 *   the step in a degraded state. Uses `console.error` so it's impossible to miss.
 * - `'warn'`  — for teardown hooks (onExit, onAdvance, onRetreat, scene, cleanup)
 *   whose failure is less impactful. Uses `console.warn`.
 */
const logLifecycleWarning = (
  hook: string,
  stepId: string,
  error: unknown,
  severity: 'warn' | 'error' = 'warn'
): void => {
  const message = error instanceof Error ? error.message : String(error);
  const log = severity === 'error' ? console.error : console.warn;
  log(
    `[guided-tour] ${hook} failed on step "${stepId}": ${message}`,
    error
  );
};

interface TransitionResult {
  entered: DagTourNode | null;
  nodeId: NodeId | null;
}

const cloneSelectorConfig = (config: StepSelectorConfig): StepSelectorConfig => ({
  ...config,
});

const cloneStepDefinition = (step: StepDefinition): StepDefinition => ({
  ...step,
  meta: step.meta ? { ...step.meta } : step.meta,
  selectors: step.selectors?.map(cloneSelectorConfig),
  tooltip: step.tooltip ? { ...step.tooltip } : step.tooltip,
  behavior: step.behavior ? { ...step.behavior } : step.behavior,
  spotlight: step.spotlight
    ? {
        ...step.spotlight,
        selectors: step.spotlight.selectors?.map(cloneSelectorConfig),
      }
    : step.spotlight,
  transitions: step.transitions?.map((transition) => ({ ...transition })),
  preparations: step.preparations?.map((prep) => ({
    ...prep,
    sharedWith: prep.sharedWith ? [...prep.sharedWith] : undefined,
  })),
});

const ensureArray = <T,>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
};

type PreparationFactoryResult = void | PreparationCleanup;
type PreparationFactory = () => PreparationFactoryResult | Promise<PreparationFactoryResult>;

type PreparationIndex = Map<NodeId, StepPreparationDefinition[]>;

const buildPreparationIndex = (tour: TourDefinition): PreparationIndex => {
  const index: PreparationIndex = new Map();
  
  const sharedPrepsByStep = new Map<NodeId, Set<string>>();
  
  for (const step of tour.steps) {
    if (!step.preparations?.length) continue;
    for (const prep of step.preparations) {
      if (prep.sharedWith && prep.sharedWith.length > 0) {
        for (const sharedStepId of prep.sharedWith) {
          if (!sharedPrepsByStep.has(sharedStepId)) {
            sharedPrepsByStep.set(sharedStepId, new Set());
          }
          sharedPrepsByStep.get(sharedStepId)!.add(prep.id);
        }
      }
    }
  }
  
  for (const step of tour.steps) {
    if (!step.preparations?.length) continue;
    for (const prep of step.preparations) {
      const scope = prep.scope ?? 'group';
      const participants = new Set<NodeId>([step.id, ...(prep.sharedWith ?? [])]);
      
      for (const nodeId of participants) {
        if (!nodeId) continue;
        const list = index.get(nodeId) ?? [];
        
        const alreadyIndexed = list.some(p => p.id === prep.id);
        if (!alreadyIndexed) {
          list.push({ ...prep, scope });
          index.set(nodeId, list);
        }
      }
    }
  }
  
  return index;
};

interface PreparationEntry {
  holders: Set<NodeId>;
  cleanup?: PreparationCleanup;
  scope: PreparationScope;
  pendingCleanup?: ReturnType<typeof setTimeout> | null;
}

class PreparationManager {
  private readonly entries = new Map<string, PreparationEntry>();
  private readonly nodeClaims = new Map<NodeId, Set<string>>();

  async acquire(
    nodeId: NodeId,
    prepId: string,
    prepare: PreparationFactory,
    options?: PreparationOptions | PreparationCleanup
  ): Promise<void> 
  {
    let scope: PreparationScope = 'step';
    let cleanup: PreparationCleanup | undefined;

    if (typeof options === 'function') {
      cleanup = options;
    } else if (options) {
      scope = options.scope ?? 'step';
      cleanup = options.cleanup;
    }

    let entry = this.entries.get(prepId);
    if (!entry) {
      let resolvedCleanup = cleanup;
      const result = await prepare();
      if (!resolvedCleanup && typeof result === 'function') {
        resolvedCleanup = result;
      }
      entry = {
        holders: new Set(),
        cleanup: resolvedCleanup,
        scope,
        pendingCleanup: null,
      };
      this.entries.set(prepId, entry);
    }

    if (entry.pendingCleanup) {
      clearTimeout(entry.pendingCleanup);
      entry.pendingCleanup = null;
    }

    entry.holders.add(nodeId);
    if (!this.nodeClaims.has(nodeId)) {
      this.nodeClaims.set(nodeId, new Set());
    }
    this.nodeClaims.get(nodeId)!.add(prepId);
  }

  private async finalize(prepId: string): Promise<void> {
    const entry = this.entries.get(prepId);
    if (!entry) return;
    if (entry.pendingCleanup) {
      clearTimeout(entry.pendingCleanup);
      entry.pendingCleanup = null;
    }
    try {
      await entry.cleanup?.();
    } finally {
      this.entries.delete(prepId);
      for (const [nodeId, claims] of this.nodeClaims.entries()) {
        claims.delete(prepId);
        if (claims.size === 0) {
          this.nodeClaims.delete(nodeId);
        }
      }
    }
  }

  async release(nodeId: NodeId, prepId: string): Promise<void> {
    const entry = this.entries.get(prepId);
    if (!entry) return;

    entry.holders.delete(nodeId);
    const claims = this.nodeClaims.get(nodeId);
    claims?.delete(prepId);
    if (claims && claims.size === 0) {
      this.nodeClaims.delete(nodeId);
    }

    const isLastHolder = entry.holders.size === 0;
    if (entry.scope === 'step') {
      await this.finalize(prepId);
      return;
    }

    if (entry.scope === 'group' && isLastHolder) {
      if (entry.pendingCleanup) {
        clearTimeout(entry.pendingCleanup);
      }
      
      entry.pendingCleanup = setTimeout(async () => {
        entry.pendingCleanup = null;
        const current = this.entries.get(prepId);
        if (current && current.holders.size === 0) {
          await this.finalize(prepId);
        }
      }, 0);
    }
  }

  async releaseAllForNode(nodeId: NodeId, options?: { skip?: ReadonlySet<string> }): Promise<void> {
    const claims = this.nodeClaims.get(nodeId);
    if (!claims) return;
    const skip = options?.skip;
    const prepIds = Array.from(claims).filter((prepId) => !skip?.has(prepId));
    if (prepIds.length === 0) {
      return;
    }
    await Promise.all(prepIds.map((prepId) => this.release(nodeId, prepId)));
  }

  async releaseAll(): Promise<void> {
    const prepIds = Array.from(this.entries.keys());
    await Promise.all(prepIds.map((prepId) => this.finalize(prepId)));
    this.nodeClaims.clear();
  }
}

class StepContextImpl implements StepRuntimeContext {
  readonly tour: TourDefinition;
  readonly dag: DagTourDefinition;
  readonly nodeId: NodeId;
  readonly services: TourServices;
  readonly shared: Map<string, unknown>;
  readonly storage: Map<string, unknown>;
  readonly history: ReadonlyArray<DagTourHistory>;
  readonly totalSteps: number;

  private readonly machine: TourStateMachine;

  constructor(
    machine: TourStateMachine,
    dag: DagTourDefinition,
    nodeId: NodeId,
    history: ReadonlyArray<DagTourHistory>
  ) {
    this.machine = machine;
    const tour = machine.getCurrentTour();
    if (!tour) {
      throw new Error('Cannot build step context without an active tour');
    }

    this.tour = tour;
    this.dag = dag;
    this.nodeId = nodeId;
    this.shared = machine.getSharedState();
    this.storage = machine.getStorageForStep(this.nodeId);
    this.services = machine.createServices(this.nodeId);
    this.history = history;
    this.totalSteps = dag.totalSteps;
  }

  next(): Promise<void> {
    return this.machine.next();
  }

  back(): Promise<void> {
    return this.machine.back();
  }

  goTo(nodeId: NodeId): Promise<void> {
    return this.machine.goTo(nodeId);
  }

  registerCleanup(cleanup: () => void | Promise<void>): void {
    this.machine.registerCleanup(cleanup);
  }

  ensurePreparation(
    prepId: string,
    prepare: PreparationFactory,
    options?: PreparationOptions | PreparationCleanup
  ): Promise<void> {
    return this.machine.ensurePreparation(this.nodeId, prepId, prepare, options);
  }

  releasePreparation(prepId: string): Promise<void> {
    return this.machine.releasePreparation(this.nodeId, prepId);
  }

  resolveTarget(): Element | null {
    return this.machine.resolveTarget(this.nodeId);
  }

  async waitForElement(selector: string, timeout = 3000): Promise<Element> {
    const start = Date.now();
    const poll = async (): Promise<Element> => {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      if (Date.now() - start >= timeout) {
        throw new Error(`Element "${selector}" not found within ${timeout}ms`);
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
      return poll();
    
    };
    return poll();
  }

  setTourAttribute(name: string, value: string): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute(`data-tour-${name}`, value);
  }

  removeTourAttribute(name: string): void {
    if (typeof document === 'undefined') return;
    document.documentElement.removeAttribute(`data-tour-${name}`);
  }

  getTourAttribute(name: string): string | null {
    if (typeof document === 'undefined') return null;
    return document.documentElement.getAttribute(`data-tour-${name}`);
  }

  advance(): Promise<void> {
    this.machine.debug('ctx.advance', { fromStep: this.nodeId });
    return this.machine.next();
  }

  interceptEvent<T = unknown>(event: string, handler: TourEventHandler<T>): () => void {
    const unsubscribe = this.services.events.intercept(event, handler);
    this.registerCleanup(unsubscribe);
    return unsubscribe;
  }

  setShared(key: string, value: unknown): void {
    this.machine.setShared(key, value);
  }

  getShared<T = unknown>(key: string): T | undefined {
    return this.machine.getShared(key);
  }
}

class TourLifecycleContextImpl implements TourLifecycleContext {

  private readonly machine: TourStateMachine;
  public readonly tour: TourDefinition;

  constructor(machine: TourStateMachine, tour: TourDefinition) {
    this.machine = machine;
    this.tour = tour;
  }

  get services(): TourServices {
    return this.machine.createServices(null);
  }

  setShared = (key: string, value: unknown): void => {
    this.machine.setShared(key, value);
  };

  getShared = <T = unknown>(key: string): T | undefined => {
    return this.machine.getSharedState().get(key) as T | undefined;
  };
}

export class TourStateMachine {
  private readonly listeners = new Set<StateListener>();
  private readonly demoBridge: DemoDataBridge;
  private readonly eventBridge: EventBridge;
  private readonly shared = new Map<string, unknown>();
  private readonly storage = new Map<NodeId, Map<string, unknown>>();
  private readonly stepCleanups: Array<() => void | Promise<void>> = [];
  private navigationStack: NodeId[] = [];
  private restoreNavigationStack: NodeId[] | null = null;
  private readonly preparationManager = new PreparationManager();
  private prepIndex: PreparationIndex = new Map();
  private dag: DagTourDefinition | null = null;
  private currentTour?: TourDefinition;
  private transitionQueue: Promise<void> = Promise.resolve();
  private autoAdvanceTimer: number | null = null;

  /** Centralized route guard — the UI layer binds its adapter here. */
  readonly routeGuard = new TourRouteGuard();

  /** Debug logger — no-op unless `debug` was passed to the constructor. */
  private readonly log: TourDebugLogger = noopLogger;

  private persistedKey(tourId: string): string {
    return `guidedTour.${tourId}.nodeId`;
  }

  private snapshot: TourMachineSnapshot = {
    isTransitioning: false,
    status: 'idle',
    tourId: null,
    dag: null,
    nodeId: null,
    history: [],
    shared: new Map(),
    canGoNext: false,
    canGoBack: false,
  };

  constructor(options: TourStateMachineOptions = {}) {
    this.demoBridge = options.demoBridge ?? new InMemoryDemoDataBridge();
    this.eventBridge = options.eventBridge ?? new InMemoryEventBridge();
    this.log = options.debug === true
      ? createConsoleLogger()
      : typeof options.debug === 'function'
        ? options.debug
        : noopLogger;
  }

  /** @internal — used by StepContextImpl. Consumers should not call this directly. */
  debug(label: string, detail?: unknown): void {
    this.log(label, detail);
  }

  private getDag(): DagTourDefinition {
    if (!this.dag) {
      throw new Error('Tour DAG is not initialized');
    }
    return this.dag;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): TourMachineSnapshot {
    return this.snapshot;
  }

  getCurrentTour(): TourDefinition | undefined {
    return this.currentTour;
  }

  getSharedState(): Map<string, unknown> {
    return this.shared;
  }

  getStorageForStep(nodeId: NodeId): Map<string, unknown> {
    if (!this.storage.has(nodeId)) {
      this.storage.set(nodeId, new Map());
    }

    return this.storage.get(nodeId)!;
  }

  private createStepContext(nodeId: NodeId): StepContextImpl {
    const dag = this.getDag();
    return new StepContextImpl(this, dag, nodeId, this.snapshot.history);
  }

  createServices(nodeId: NodeId | null): TourServices {
    const tourId = this.currentTour?.id ?? 'tour';
    return {
      demo: createDemoController(this.demoBridge, { tourId, nodeId, shared: this.shared }),
      events: createEventController(this.eventBridge, { tourId, nodeId }),
      state: {
        shared: this.shared,
        storage: this.storage,
      },
    };
  }

  async startWithDefinition(definition: TourDefinition, options?: { startNodeId?: NodeId }): Promise<void> {
    const cloned: TourDefinition = {
      ...definition,
      steps: definition.steps.map((step) => cloneStepDefinition(step)),
    };

    await this.enqueue(async () => {
      const canReusePersisted = options?.startNodeId === undefined;
      const persistedNodeId = canReusePersisted ? this.loadPersistedNodeId(cloned.id) : null;
      const persistedHistory = canReusePersisted ? this.loadPersistedHistory(cloned.id) : null;
      const persistedStack = canReusePersisted ? this.loadPersistedNavigationStack(cloned.id) : null;
      const persistedShared = canReusePersisted ? this.loadPersistedSharedState(cloned.id) : new Map();

      await this.stopInternal('aborted');
      this.currentTour = cloned;
      this.shared.clear();
      persistedShared.forEach((value, key) => {
        this.shared.set(key, value);
      });
      this.updateSnapshot({ shared: new Map(this.shared) });

      this.storage.clear();
      this.navigationStack = [];
      this.restoreNavigationStack = null;
      this.eventBridge.enable({ tourId: cloned.id, nodeId: null });
      this.updateSnapshot({
        status: 'preparing',
        tourId: cloned.id,
        tourName: cloned.name,
        nodeId: null,
        history: persistedHistory ?? [],
        metadata: cloned.metadata,
        isTransitioning: false,
      });

      if (cloned.onStart) {
        const lifecycleCtx = new TourLifecycleContextImpl(this, cloned);
        await cloned.onStart(lifecycleCtx);
      }

      let dagTour: DagTourDefinition;
      try {
        dagTour = buildDag(cloned);
        this.dag = dagTour;
        this.prepIndex = buildPreparationIndex(cloned);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const enhancedError = new Error(
          `Tour configuration error: ${errorMessage}\n\n` +
          `This error occurred while validating the tour definition. ` +
          `Please check for duplicate step IDs, missing step references, or invalid transitions.`
        );
        if (error instanceof Error && error.stack) {
          enhancedError.stack = error.stack;
        }
        throw enhancedError;
      }

      this.updateSnapshot({
        dag: dagTour,
      });

      if (persistedStack && persistedStack.length > 0) {
        this.restoreNavigationStack = [...persistedStack];
      }

      let targetNodeId: NodeId | null = options?.startNodeId ?? null;
      if (!targetNodeId && persistedNodeId) {
        targetNodeId = persistedNodeId;
      }
      const fallbackNodeId: NodeId = targetNodeId ?? dagTour.entryId;

      let resolvedNodeId: NodeId = fallbackNodeId;
      try {
        this.getNodeById(fallbackNodeId);
      } catch (error) {
        console.warn(`Unable to start tour at node "${fallbackNodeId}", falling back to entry`, error);
        resolvedNodeId = dagTour.entryId;
      }

      const result = await this.transitionToNode(null, resolvedNodeId, 'jump');
      if (!result.entered) {
        await this.completeInternal('completed');
      }
    });
  }

  async stop(): Promise<void> {
    this.log('stop', { currentNode: this.snapshot.nodeId, status: this.snapshot.status });
    await this.enqueue(async () => {
      await this.stopInternal('aborted');
      this.currentTour = undefined;
      this.updateSnapshot({
        status: 'idle',
        dag: null,
        tourId: null,
        tourName: undefined,
        nodeId: null,
        history: [],
        metadata: undefined,
        isTransitioning: false,
        canGoNext: false,
        canGoBack: false,
      });
      this.navigationStack = [];
    });
  }

  async complete(): Promise<void> {
    this.log('complete', { currentNode: this.snapshot.nodeId });
    await this.enqueue(async () => {
      await this.completeInternal('completed');
    });
  }

  async next(): Promise<void> {
    this.log('next', { currentNode: this.snapshot.nodeId });
    await this.enqueue(async () => {
      const tour = this.currentTour;
      if (!tour) return;

      const currentNodeId = this.getCurrentNode().id;
      const nextNodeId = await this.resolveNextNodeId(currentNodeId);

      if (!nextNodeId) {
        await this.completeInternal('completed');
        return;
      }

      await this.transitionToNode(currentNodeId, nextNodeId, 'next');
    });
  }

  async back(): Promise<void> {
    this.log('back', { currentNode: this.snapshot.nodeId, stackDepth: this.navigationStack.length });
    await this.enqueue(async () => {
      const tour = this.currentTour;
      if (!tour) return;

      if (this.navigationStack.length <= 1) {
        this.log('back:blocked', 'navigation stack has only 1 entry');
        return;
      }

      const currentNodeId = this.getCurrentNode().id;
      const previousNodeId = this.navigationStack[this.navigationStack.length - 2];
      if (!previousNodeId) return;

      this.log('back:transition', { from: currentNodeId, to: previousNodeId });
      await this.transitionToNode(currentNodeId, previousNodeId, 'back');
    });
  }

  async goTo(nodeId: NodeId): Promise<void>
  {
    this.log('goTo', { target: nodeId, currentNode: this.snapshot.nodeId });
    await this.enqueue(async () => {
      const tour = this.currentTour;
      if (!tour) return;

      const targetNode = this.getNodeById(nodeId);
      await this.transitionToNode(this.getCurrentNode().id, targetNode.id, 'jump');
    });
  }

  async getAvailableTransitions(nodeId?: NodeId | null): Promise<StepTransitionOption[]> {
    const resolvedNodeId = nodeId ?? this.snapshot.nodeId;
    if (!resolvedNodeId) return [];
    const node = this.getNodeById(resolvedNodeId);
    const step = node.step;
    if (!step?.transitions?.length) return [];
    const context = this.createStepContext(resolvedNodeId);
    const matches = await this.evaluateConditionalTransitions(step, context);
    return matches.map((transition) => ({
      target: transition.target,
      label: transition.label,
      description: transition.description,
      metadata: transition.metadata,
    }));
  }

  private getCurrentNode(): DagTourNode {
    const { nodeId } = this.getState();
    if (!nodeId) {
      throw new Error('Cannot get current node: no stepId in state');
    }
    const dag = this.getDag();
    const node = dag.nodes[nodeId];
    if (!node) {
      throw new Error(`Node "${nodeId}" not found in DAG`);
    }
    return node;
  }

  private getNodeById(nodeId: string): DagTourNode {
    const dag = this.getDag();
    const node = dag.nodes[nodeId];
    if (!node) {
      throw new Error(`Node "${nodeId}" not found in DAG`);
    }
    return node;
  }

  setShared(key: string, value: unknown): void {
    this.shared.set(key, value);
    this.persistSharedState();
    this.updateSnapshot({ shared: new Map(this.shared) });
  }

  getShared<T = unknown>(key: string): T | undefined {
    return this.shared.get(key) as T | undefined;
  }

  resetShared(): void {
    this.shared.clear();
    this.clearPersistedSharedState();
    this.updateSnapshot({ shared: new Map(this.shared) });
  }

  private async resolveNextNodeId(currentNodeId: NodeId): Promise<NodeId | null> {
    const currentNode = this.getNodeById(currentNodeId);
    const context = this.createStepContext(currentNode.id);
    const { canGoNext } = await this.evaluateNavigation(currentNode.id, context);
    if (!canGoNext) {
      return null;
    }

    const step = currentNode.step;
    if (step?.transitions?.length) {
      const matches = await this.evaluateConditionalTransitions(step, context);
      if (matches.length > 0) {
        return matches[0].target;
      }
    }

    if (currentNode.next.length === 0) {
      return null;
    }

    for (const candidateId of currentNode.next) {
      try {
        this.getNodeById(candidateId);
        return candidateId;
      } catch (error) {
        console.warn(`Skipping invalid next node "${candidateId}"`, error);
      }
    }
    return null;
  }

  resolveTarget(id: string): Element | null {
    const node = this.getNodeById(id);
    const step = node.step;

    const selectFirst = (resolver: StepTargetResolver, multiple?: boolean): Element | null => {
      const list = this.resolveResolverToElements(resolver, multiple);
      return list.length > 0 ? list[0] : null;
    };

    if (step.target) {
      return selectFirst(step.target);
    }

    const selectors = this.collectSelectors(step);

    for (const selector of selectors) {
      if (selector.highlight) continue;
      const element = selectFirst(selector.target, selector.multiple);
      if (element) {
        return element;
      }
    }

    for (const selector of selectors) {
      const element = selectFirst(selector.target, selector.multiple);
      if (element) {
        return element;
      }
    }

    return null;
  }

  private collectSelectors(step: StepDefinition): StepSelectorConfig[] {
    const base = step.selectors ?? [];
    const spotlight = step.spotlight?.selectors ?? [];
    const legacySelectors = (() => {
      if (!step.selector) return [] as StepSelectorConfig[];
      const list = ensureArray(step.selector);
      return list.map((raw) => {
        if (typeof raw !== 'string') {
          return { target: raw } as StepSelectorConfig;
        }
        const trimmed = raw.trim();
        if (trimmed.startsWith('highlight:')) {
          return { target: trimmed.slice('highlight:'.length).trim(), highlight: true };
        }
        return { target: trimmed };
      });
    })();

    const combined = [...base, ...legacySelectors];

    if (combined.length === 0 && spotlight.length === 0 && step.target) {
      return [
        {
          target: step.target,
        },
      ];
    }

    return [...combined, ...spotlight];
  }

  private resolveResolverToElements(resolver: StepTargetResolver, multiple?: boolean): HTMLElement[] {
    const normalize = (value: Element | Element[] | null | undefined): HTMLElement[] => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value.filter((item): item is HTMLElement => item instanceof HTMLElement);
      }
      return value instanceof HTMLElement ? [value] : [];
    };

    if (typeof resolver === 'string') {
      if (typeof document === 'undefined') {
        return [];
      }
      if (multiple) {
        return Array.from(document.querySelectorAll<HTMLElement>(resolver));
      }
      const element = document.querySelector<HTMLElement>(resolver);
      return element ? [element] : [];
    }

    if (typeof resolver === 'function') {
      return normalize(resolver());
    }

    if ('resolve' in resolver) {
      return normalize(resolver.resolve());
    }

    return [];
  }

  private async evaluateConditionalTransitions(
    step: StepDefinition,
    context: StepContextImpl
  ): Promise<StepTransition[]> {
    const transitions = step.transitions ?? [];
    if (transitions.length === 0) return [];

    const ordered = [...transitions].sort((a, b) => {
      const left = a.priority ?? Number.MAX_SAFE_INTEGER;
      const right = b.priority ?? Number.MAX_SAFE_INTEGER;
      return left - right;
    });

    const matches: StepTransition[] = [];

    for (const transition of ordered) {
      const targetId = transition.target;
      let passes = true;
      if (transition.condition) {
        try {
          passes = await transition.condition(context);
        } catch (error) {
          console.error(`Error evaluating transition from "${context.nodeId}" to "${targetId}"`, error);
          passes = false;
        }
      }
      if (!passes) continue;

      try {
        this.getNodeById(targetId);
        matches.push(transition);
      } catch (error) {
        console.warn(`Transition target "${targetId}" not found, skipping`, error);
      }
    }
    return matches;
  }

  registerCleanup(cleanup: () => void | Promise<void>): void {
    this.stepCleanups.push(cleanup);
  }

  async ensurePreparation(
    nodeId: NodeId,
    prepId: string,
    prepare: PreparationFactory,
    options?: PreparationOptions | PreparationCleanup
  ): Promise<void> {
    await this.preparationManager.acquire(nodeId, prepId, prepare, options);
  }

  async releasePreparation(nodeId: NodeId, prepId: string): Promise<void> {
    await this.preparationManager.release(nodeId, prepId);
  }

  private async enqueue(task: () => Promise<void>): Promise<void> {
    this.transitionQueue = this.transitionQueue.then(() => task()).catch((error) => this.handleError(error));
    await this.transitionQueue;
  }

  private async transitionToNode(fromNodeId: NodeId | null, toNodeId: NodeId, cause: DagTourHistory['cause']): Promise<TransitionResult> {
    this.log('transition:start', { from: fromNodeId, to: toNodeId, cause });
    const tour = this.currentTour;
    if (!tour) {
      this.log('transition:abort', 'no current tour');
      return { entered: null, nodeId: null };
    }

    const dag = this.getDag();
    const toNode = dag.nodes[toNodeId];
    if (!toNode) {
      this.log('transition:abort', `node "${toNodeId}" not found in DAG`);
      return { entered: null, nodeId: null };
    }

    this.updateSnapshot({ isTransitioning: true });

    const deferredGroupPrepIds =
      fromNodeId !== null ? this.getGroupPreparationHandoffIds(fromNodeId, toNodeId) : null;

    if (fromNodeId) {
      await this.runExit(fromNodeId, cause, {
        skipPreparationIds: deferredGroupPrepIds ?? undefined,
      });
    }

    this.updateSnapshot({
      status: 'running',
      nodeId: toNodeId,
      history: [
        ...this.snapshot.history,
        {
          from: fromNodeId,
          to: toNodeId,
          cause,
          at: Date.now(),
        },
      ],
      isTransitioning: true,
    });

    const context = this.createStepContext(toNodeId);
    await this.runEnter(toNode.step, context);
    if (fromNodeId && deferredGroupPrepIds && deferredGroupPrepIds.size > 0) {
      await this.releaseDeferredPreparations(fromNodeId, deferredGroupPrepIds);
    }
    const { canGoNext, canGoBack } = await this.evaluateNavigation(toNodeId, context);
    this.updateSnapshot({ isTransitioning: false, canGoNext, canGoBack });
    this.updateNavigationStack(fromNodeId, toNodeId, cause);
    if (this.currentTour) {
      this.persistNavigationStack(this.navigationStack);
    }

    this.log('transition:done', { to: toNodeId, canGoNext, canGoBack });
    return { entered: toNode, nodeId: toNodeId };
  }

  private async runEnter(step: StepDefinition, context: StepContextImpl): Promise<void> {
    this.log('runEnter:start', { step: step.id, route: step.route, routeMode: step.routeMode });
    this.clearAutoAdvance();

    // Set route policy BEFORE preparations so the overlay can start navigating
    // while preparations run. Otherwise the overlay's route effect runs with
    // policy=null on nodeId change and never re-fires after setPolicy.
    if (step.route) {
      const routes = (Array.isArray(step.route) ? step.route : [step.route])
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .map(normalizePath);

      if (routes.length > 0) {
        const policy: RoutePolicy = {
          paths: routes,
          mode: step.routeMode ?? 'navigate',
        };
        this.routeGuard.setPolicy(policy);
        context.registerCleanup(() => {
          this.routeGuard.clear();
        });
      }
    }

    const nodePreparations = this.prepIndex.get(context.nodeId) ?? [];
    for (const prep of nodePreparations) {
      try {
        await this.ensurePreparation(
          context.nodeId,
          prep.id,
          () => prep.factory(context),
          { scope: prep.scope ?? 'group' }
        );
      } catch (error) {
        logLifecycleWarning(`preparation:${prep.id}`, context.nodeId, error, 'error');
      }
    }

    if (step.behavior?.interactables) {
      handleInteractablesEnter(step.behavior.interactables);
    }

    if (step.onEnter) {
      try {
        await step.onEnter(context);
      } catch (error) {
        logLifecycleWarning('onEnter', step.id, error, 'error');
      }
    }

    if (step.scene) {
      const processFactory = async (factory: StepSceneFactory): Promise<void> => {
        if (Array.isArray(factory)) {
          for (const item of factory) {
            await processFactory(item);
          }
        } else {
          const cleanup = await factory(context);
          if (typeof cleanup === 'function') {
            context.registerCleanup(cleanup);
          }
        }
      };

      try {
        await processFactory(step.scene);
      } catch (error) {
        logLifecycleWarning('scene', step.id, error);
      }
    }

    if (!step.disableAutoAdvance) {
      if (step.autoAdvance) {
        this.scheduleAutoAdvance(step.autoAdvance, context);
      } else if (step.autoAdvanceTimeout !== undefined) {
        this.scheduleAutoAdvance({ delay: step.autoAdvanceTimeout }, context);
      }
    }
    this.log('runEnter:done', { step: step.id });
  }

  private async runExit(
    fromNodeId: NodeId | undefined,
    cause: DagTourHistory['cause'],
    options?: { skipPreparationIds?: ReadonlySet<string> }
  ): Promise<void> {
    if (!fromNodeId) return;
    this.log('runExit:start', { step: fromNodeId, cause });
    this.clearAutoAdvance();

    const dag = this.getDag();
    const node = dag.nodes[fromNodeId];
    if (!node) {
      this.log('runExit:abort', `node "${fromNodeId}" not found`);
      return;
    }

    const step = node.step;

    if (step && this.currentTour) {
      const context = this.createStepContext(fromNodeId);

      if (step.behavior?.interactables) {
        handleInteractablesExit(step.behavior.interactables);
      }

      if (step.onExit) {
        try {
          await step.onExit(context);
        } catch (error) {
          logLifecycleWarning('onExit', step.id, error);
        }
      }
      if (cause === 'next' && step.onAdvance) {
        try {
          await step.onAdvance(context);
        } catch (error) {
          logLifecycleWarning('onAdvance', step.id, error);
        }
      }
      if (cause === 'back' && step.onRetreat) {
        try {
          await step.onRetreat(context);
        } catch (error) {
          logLifecycleWarning('onRetreat', step.id, error);
        }
      }
    }

    while (this.stepCleanups.length) {
      const cleanup = this.stepCleanups.pop();
      if (!cleanup) continue;
      try {
        await cleanup();
      } catch (error) {
        logLifecycleWarning('cleanup', fromNodeId ?? 'unknown', error);
      }
    }

    await this.preparationManager.releaseAllForNode(fromNodeId, {
      skip: options?.skipPreparationIds,
    });
  }

  private getGroupPreparationHandoffIds(fromNodeId: NodeId, toNodeId: NodeId | null): ReadonlySet<string> {
    if (!toNodeId) {
      return new Set();
    }

    const fromPreps = this.prepIndex.get(fromNodeId);
    const toPreps = this.prepIndex.get(toNodeId);
    if (!fromPreps?.length || !toPreps?.length) {
      return new Set();
    }

    const toGroupPrepIds = new Set(
      toPreps
        .filter((prep) => (prep.scope ?? 'group') === 'group')
        .map((prep) => prep.id)
    );

    const shared = new Set<string>();
    for (const prep of fromPreps) {
      if ((prep.scope ?? 'group') !== 'group') {
        continue;
      }
      if (toGroupPrepIds.has(prep.id)) {
        shared.add(prep.id);
      }
    }
    return shared;
  }

  private async releaseDeferredPreparations(nodeId: NodeId, prepIds: ReadonlySet<string>): Promise<void> {
    if (!prepIds.size) {
      return;
    }
    await Promise.all(Array.from(prepIds).map((prepId) => this.preparationManager.release(nodeId, prepId)));
  }

  private scheduleAutoAdvance(config: NonNullable<StepDefinition['autoAdvance']>, context: StepRuntimeContext): void {
    const target = config.targetNodeId ?? 'next';
    if (config.delay !== undefined && config.delay >= 0) {
      this.autoAdvanceTimer = window.setTimeout(() => {
        this.performAutoAdvance(target);
      }, config.delay);
      return;
    }

    if (config.check) {
      const interval = config.interval ?? 250;
      const poll = async () => {
        try {
          const ready = await config.check!(context);
          if (ready) {
            this.performAutoAdvance(target);
            return;
          }
        } catch (error) {
          this.handleError(error);
        }
        this.autoAdvanceTimer = window.setTimeout(poll, interval);
      };
      this.autoAdvanceTimer = window.setTimeout(poll, interval);
    }
  }

  private performAutoAdvance(target: NodeId | 'next'): void {
    if (target === 'next') {
      void this.next();
    } else {
      void this.goTo(target);
    }
  }

  private async evaluateNavigation(nodeId: NodeId, context: StepContextImpl): Promise<{ canGoNext: boolean; canGoBack: boolean }> {
    const dag = this.getDag();
    const node = dag.nodes[nodeId];
    if (!node) {
      return { canGoNext: false, canGoBack: false };
    }
    
    const step = node.step;
    if (step === undefined) {
      return { canGoNext: false, canGoBack: false };
    }

    const contextTransitions = await this.evaluateConditionalTransitions(step, context);
    const transitionCount = contextTransitions.length;
    let canGoNext = node.next.length > 0 || transitionCount > 0;
    let canGoBack = node.previous.length > 0 || this.navigationStack.length > 1;

    if (step.canNavigateNext) 
    {
      try 
      {
        const result = await step.canNavigateNext(context);
        canGoNext = Boolean(result) && canGoNext;
      } 
      catch (error) 
      {
        console.error('Error evaluating canNavigateNext', error);
      }
    }

    if (step.canNavigateBack) 
    {
      try 
      {
        const result = await step.canNavigateBack(context);
        canGoBack = Boolean(result) && canGoBack;
      } 
      catch (error) 
      {
        console.error('Error evaluating canNavigateBack', error);
      }
    }

    return { canGoNext, canGoBack };
  }

  private clearAutoAdvance(): void {
    if (this.autoAdvanceTimer !== null) {
      window.clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  private async stopInternal(reason: 'aborted' | 'completed'): Promise<void> {
    this.log('stopInternal', { reason, currentNode: this.snapshot.nodeId });
    this.clearAutoAdvance();
    this.routeGuard.clear();

    const activeNodeId = this.snapshot.nodeId;
    if (activeNodeId && this.dag) {
      await this.runExit(activeNodeId, reason === 'completed' ? 'next' : 'jump');
    }

    if (this.currentTour?.onFinish) {
      const lifecycleCtx = new TourLifecycleContextImpl(this, this.currentTour);
      await this.currentTour.onFinish(lifecycleCtx);
    }

    await this.demoBridge.clear({ tourId: this.currentTour?.id ?? 'tour', nodeId: null, shared: this.shared });
    this.eventBridge.clear({ tourId: this.currentTour?.id ?? 'tour', nodeId: null }, undefined);
    this.eventBridge.disable({ tourId: this.currentTour?.id ?? 'tour', nodeId: null });
    this.shared.clear();
    this.clearPersistedSharedState();
    this.storage.clear();
    await this.preparationManager.releaseAll();
    this.persistStepIndex(null);
    this.dag = null;
    this.prepIndex = new Map();
    this.navigationStack = [];
    this.persistNavigationStack(null);

    // Include nodeId: null so updateSnapshot's persistence block doesn't
    // immediately re-write the step index we just cleared above. The persist
    // condition `status === 'running' && currentNodeId !== null` would
    // otherwise still be satisfied because basePatch doesn't change status.
    const basePatch = {
      dag: null,
      nodeId: null,
      shared: new Map(this.shared),
      isTransitioning: false,
      canGoNext: false,
      canGoBack: false,
    } as const;

    if (reason === 'completed') {
      this.updateSnapshot({ status: 'completed', ...basePatch });
    } else {
      this.updateSnapshot(basePatch);
    }
  }

  private async completeInternal(reason: 'completed'): Promise<void> {
    await this.stopInternal(reason);
    this.currentTour = undefined;
    this.updateSnapshot({
      status: 'completed',
      dag: null,
      nodeId: null,
      canGoNext: false,
      canGoBack: false,
      isTransitioning: false,
    });
  }

  private updateSnapshot(patch: Partial<TourMachineSnapshot>): void 
  {
    const next: TourMachineSnapshot = {
      ...this.snapshot,
      ...patch,
      shared: patch.shared ?? new Map(this.shared),
      isTransitioning: patch.isTransitioning ?? this.snapshot.isTransitioning,
      canGoNext: patch.canGoNext ?? this.snapshot.canGoNext,
      canGoBack: patch.canGoBack ?? this.snapshot.canGoBack,
    };

    this.snapshot = next;

    if (typeof document !== 'undefined') 
    {
      const isActive = next.status === 'running' || next.status === 'preparing';
      if (isActive && !document.documentElement.hasAttribute('data-tour-active')) 
        document.documentElement.setAttribute('data-tour-active', 'true');

      else if (!isActive && document.documentElement.hasAttribute('data-tour-active')) 
        document.documentElement.removeAttribute('data-tour-active');
    }

    const currentNodeId = next.nodeId;

    if (this.currentTour) {
      if (next.status === 'running' && currentNodeId !== null) {
        this.persistStepIndex(currentNodeId);
        this.persistHistory([...next.history]);
      } else if (next.status === 'idle' || next.status === 'completed' || next.status === 'error') {
        this.persistStepIndex(null);
        this.persistHistory(null);
        this.persistNavigationStack(null);
      }
    }

    this.notify();
  }

  private updateNavigationStack(fromNodeId: NodeId | null, toNodeId: NodeId, cause: DagTourHistory['cause']): void {
    if (this.restoreNavigationStack) {
      this.navigationStack = [...this.restoreNavigationStack];
      this.restoreNavigationStack = null;
      return;
    }

    if (cause === 'back') {
      this.navigationStack.pop();
      if (this.navigationStack.length === 0) {
        this.navigationStack = [toNodeId];
      }
      return;
    }

    if (cause === 'jump' && fromNodeId === null) {
      this.navigationStack = [toNodeId];
      return;
    }

    if (fromNodeId === null && this.navigationStack.length === 0) {
      this.navigationStack = [toNodeId];
      return;
    }

    this.navigationStack.push(toNodeId);
  }

  private notify(): void {
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(
      `[guided-tour] Fatal error on step "${this.snapshot.nodeId ?? '?'}": ${errorMessage}`,
      error
    );
    this.log('handleError', {
      step: this.snapshot.nodeId,
      status: this.snapshot.status,
      isTransitioning: this.snapshot.isTransitioning,
      navigationStack: [...this.navigationStack.slice(-5)],
    });

    this.updateSnapshot({
      status: 'error',
      isTransitioning: false,
      metadata: {
        ...this.snapshot.metadata,
        lastError: errorMessage,
      },
    });
  }

  private loadPersistedNodeId(tourId: TourId): NodeId | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(this.persistedKey(tourId));
      return raw ?? null;
    } catch (error) {
      console.error('Error loading persisted node id', error);
      return null;
    }
  }

  private persistStepIndex(nodeId: NodeId | null): void 
  {
    if (typeof window === 'undefined') return;
    const tourId = this.currentTour?.id;
    if (!tourId) return;

    const key = this.persistedKey(tourId);
    try 
    {
      if (nodeId === null)
        window.localStorage.removeItem(key);
      else
        window.localStorage.setItem(key, nodeId);
    } 
    catch (error) 
    {
      console.error('Error persisting node id', error); 
    }
  }

  private historyStorageKey(tourId: TourId): string {
    return `guidedTour.${tourId}.history`;
  }

  private navigationStackKey(tourId: TourId): string {
    return `guidedTour.${tourId}.navigation`;
  }

  private sharedStateKey(tourId: TourId): string {
    return `guidedTour.${tourId}.shared`;
  }

  private loadPersistedSharedState(tourId: TourId): Map<string, unknown> {
    if (typeof window === 'undefined') return new Map();
    try {
      const raw = window.sessionStorage.getItem(this.sharedStateKey(tourId));
      if (!raw) return new Map();
      const parsed = JSON.parse(raw) as Array<[string, unknown]>;
      return new Map(parsed);
    } catch (error) {
      console.error('Error loading persisted shared state', error);
      return new Map();
    }
  }

  private persistSharedState(): void {
    if (typeof window === 'undefined') return;
    const tourId = this.currentTour?.id;
    if (!tourId) return;

    const key = this.sharedStateKey(tourId);
    try {
      const entries = Array.from(this.shared.entries());
      window.sessionStorage.setItem(key, JSON.stringify(entries));
    } catch (error) {
      console.error('Error persisting shared state', error);
    }
  }

  private clearPersistedSharedState(): void {
    if (typeof window === 'undefined') return;
    const tourId = this.currentTour?.id;
    if (!tourId) return;

    const key = this.sharedStateKey(tourId);
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing persisted shared state', error);
    }
  }

  private loadPersistedHistory(tourId: TourId): DagTourHistory[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(this.historyStorageKey(tourId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DagTourHistory[];
      return parsed.slice(-MAX_PERSISTED_HISTORY);
    } catch (error) {
      console.error('Error loading persisted history', error);
      return null;
    }
  }

  private persistHistory(history: DagTourHistory[] | null): void {
    if (typeof window === 'undefined') return;
    const tourId = this.currentTour?.id;
    if (!tourId) return;
    const key = this.historyStorageKey(tourId);
    try {
      if (!history || history.length === 0) {
        window.localStorage.removeItem(key);
      } else {
        const trimmed = history.slice(-MAX_PERSISTED_HISTORY);
        window.localStorage.setItem(key, JSON.stringify(trimmed));
      }
    } catch (error) {
      console.error('Error persisting history', error);
    }
  }

  private loadPersistedNavigationStack(tourId: TourId): NodeId[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(this.navigationStackKey(tourId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as NodeId[];
      return parsed.slice(-MAX_PERSISTED_STACK);
    } catch (error) {
      console.error('Error loading persisted navigation stack', error);
      return null;
    }
  }

  private persistNavigationStack(stack: NodeId[] | null): void {
    if (typeof window === 'undefined') return;
    const tourId = this.currentTour?.id;
    if (!tourId) return;
    const key = this.navigationStackKey(tourId);
    try {
      if (!stack || stack.length === 0) {
        window.localStorage.removeItem(key);
      } else {
        const trimmed = stack.slice(-MAX_PERSISTED_STACK);
        window.localStorage.setItem(key, JSON.stringify(trimmed));
      }
    } catch (error) {
      console.error('Error persisting navigation stack', error);
    }
  }
}
