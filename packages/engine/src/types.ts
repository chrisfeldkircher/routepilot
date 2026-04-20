import type { DagTourDefinition, DagTourHistory } from './core/dagTourHistory';
import type { RouteMode } from './navigation';
import type { TourEngineConfig } from './config';

export type TourId = string;
export type StepId = string;
export type NodeId = StepId;

export type TourRunStatus = 'idle' | 'preparing' | 'running' | 'paused' | 'completed' | 'error';

export type StepTargetResolver =
  | string
  | (() => Element | Element[] | null)
  | {
      resolve: () => Element | Element[] | null;
      description?: string;
    };

export type ClickSelector = string;

export interface ClickRequirementGroup {
  selectors: ClickSelector | ClickSelector[];
  mode: 'any' | 'all';
}

export interface StepContent {
  title: string;
  body: unknown;
  media?: unknown;
  hint?: unknown;
}

export interface StepContentFactoryContext {
  tourId: TourId;
  nodeId: NodeId;
  shared: Map<string, unknown>;
  storage: Map<string, unknown>;
}

export type StepContentDefinition =
  | StepContent
  | ((ctx: StepContentFactoryContext) => StepContent);

export interface StepAutoAdvanceConfig {
  delay?: number;
  check?: (ctx: StepRuntimeContext) => boolean | Promise<boolean>;
  interval?: number;
  targetNodeId?: NodeId | 'next';
}

export interface StepTooltipConfig {
  placement?: 'auto' | 'above' | 'below' | 'left' | 'right' | 'top' | 'bottom' | 'center';
  offset?: { x?: number; y?: number };
  width?: number;
  className?: string;
}

export type TipPlacement = StepTooltipConfig['placement'];

export interface StepSelectorConfig {
  nodeId?: string;
  target: StepTargetResolver;
  highlight?: boolean;
  multiple?: boolean;
  optional?: boolean;
}

export interface StepSpotlightConfig {
  selectors?: StepSelectorConfig[];
  padding?: number;
  outlineClassName?: string;
  lockScroll?: boolean;
}

export interface StepBehaviorConfig {
  blockScroll?: boolean;
  lockFocus?: boolean;
  interactables?: StepInteractablesConfig | StepInteractablesConfig[];
}

export interface StepTransition {
  target: NodeId;
  condition?: (ctx: StepRuntimeContext) => boolean | Promise<boolean>;
  priority?: number;
  metadata?: Record<string, unknown>;
  label?: string;
  description?: string;
}

export type StepLifecycleHook = (ctx: StepRuntimeContext) => void | Promise<void>;

export type StepSceneFactory =
  | ((ctx: StepRuntimeContext) => void | (() => void | Promise<void>) | Promise<void | (() => void | Promise<void>)>)
  | StepSceneFactory[];

export interface StepClickRequirements {
  all?: string[];
  any?: string[];
}

export interface StepTextInputRequirement {
  selector: string;
  match: string | RegExp;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

export interface StepInteractableRef {
  id: string;
}

export interface StepInteractablesConfig {
  open?: StepInteractableRef | StepInteractableRef[];
  close?: StepInteractableRef | StepInteractableRef[];
  lockOpen?: StepInteractableRef | StepInteractableRef[];
  releaseOpen?: StepInteractableRef | StepInteractableRef[];
  lockClose?: StepInteractableRef | StepInteractableRef[];
  releaseClose?: StepInteractableRef | StepInteractableRef[];
}

export interface StepConfig {
  click?: StepClickRequirements;
  textInput?: StepTextInputRequirement;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  interactables?: StepInteractablesConfig | StepInteractablesConfig[];
  setTourAttributes?: Record<string, string>;
  tipOffset?: { x?: number; y?: number };
  allowTourActions?: string | string[] | Record<string, string | null | undefined>;
  /**
   * @deprecated Use `routeMode` instead. Will be removed in the next major version.
   * When `true`, restricts navigation to the step's `route`.
   * When `string[]`, restricts to those specific paths.
   */
  restrictRoute?: boolean | string[];
  /** How the tour engine handles route mismatches for this step. */
  routeMode?: RouteMode;
}

export interface StepPreparationDefinition {
  id: string;
  scope?: PreparationScope;
  sharedWith?: NodeId[];
  factory: (
    ctx: StepRuntimeContext
  ) => void | PreparationCleanup | Promise<void | PreparationCleanup>;
}

export interface StepDefinition {
  id: NodeId;
  route?: string | string[];
  target?: StepTargetResolver;
  selectors?: StepSelectorConfig[];
  selector?: string | string[];
  content?: StepContentDefinition;
  title?: string;
  body?: unknown;
  chapter?: string;
  meta?: Record<string, unknown>;
  autoAdvance?: StepAutoAdvanceConfig;
  tooltip?: StepTooltipConfig;
  spotlight?: StepSpotlightConfig;
  behavior?: StepBehaviorConfig;
  when?: (ctx: StepRuntimeContext) => boolean | Promise<boolean>;
  onEnter?: StepLifecycleHook;
  onExit?: StepLifecycleHook;
  scene?: StepSceneFactory;
  onAdvance?: StepLifecycleHook;
  onRetreat?: StepLifecycleHook;
  tipPlacement?: TipPlacement;
  tipOffset?: { x: number; y: number };
  clickSelectors?: string[];
  routeMode?: RouteMode;
  canNavigateNext?: (ctx: StepRuntimeContext) => boolean | Promise<boolean>;
  canNavigateBack?: (ctx: StepRuntimeContext) => boolean | Promise<boolean>;
  disableAutoAdvance?: boolean;
  autoAdvanceTimeout?: number;
  next?: NodeId | NodeId[];
  previous?: NodeId | NodeId[];
  transitions?: StepTransition[];
  preparations?: StepPreparationDefinition[];
}

export interface StepTransitionOption {
  target: NodeId;
  label?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ConfettiConfig {
  enabled?: boolean;
  duration?: number;
  colors?: string[];
  startVelocity?: number;
  spread?: number;
  ticks?: number;
  zIndex?: number;
}

export interface TourNavigationConfig {
  /**
   * When set and `hubAction` is `'goToHub'` (the default), this node acts as
   * an in-tour hub: from any other step the skip button jumps back here
   * instead of stopping the tour.
   */
  hubNodeId?: NodeId;
  /** Custom label that replaces the default `Skip` label. */
  hubReturnLabel?: string;
  /**
   * What the relabeled skip button does:
   *   'goToHub' — navigate to `hubNodeId` (requires `hubNodeId`). Falls back
   *               to stopping the tour when the user is already on the hub.
   *   'stop'    — always stop the tour (useful when the "hub" lives outside
   *               the tour, e.g. a page-level FAQ landing).
   * Defaults to `'goToHub'` when `hubNodeId` is set, otherwise `'stop'`.
   */
  hubAction?: 'goToHub' | 'stop';
  /**
   * Scope of the built-in step selector dropdown.
   *   'tour' (default) — lists every step in the tour.
   *   'chapter'        — lists only steps that share the current step's chapter.
   */
  stepPickerScope?: 'tour' | 'chapter';
}

export interface TourDefinition {
  id: TourId;
  name?: string;
  description?: string;
  steps: StepDefinition[];
  onStart?: (ctx: TourLifecycleContext) => void | Promise<void>;
  onFinish?: (ctx: TourLifecycleContext) => void | Promise<void>;
  metadata?: Record<string, unknown>;
  confetti?: ConfettiConfig;
  navigation?: TourNavigationConfig;
}

export interface DemoDataController {
  set(key: string, value: unknown): Promise<void> | void;
  merge?(key: string, value: Record<string, unknown>): Promise<void> | void;
  remove(key: string): Promise<void> | void;
  clear(namespace?: string): Promise<void> | void;
  read?(key: string): unknown;
}

export interface EventInterceptorOptions {
  preventDefault?: boolean;
  once?: boolean;
}

export type TourEventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export interface EventController {
  emit<T = unknown>(event: string, payload: T): Promise<void> | void;
  intercept<T = unknown>(
    event: string,
    handler: TourEventHandler<T>,
    options?: EventInterceptorOptions
  ): () => void;
  once<T = unknown>(event: string, handler: TourEventHandler<T>): () => void;
  clear(event?: string): void;
}

export interface TourSharedState {
  readonly shared: Map<string, unknown>;
  readonly storage: Map<string, Map<string, unknown>>;
}

export interface TourServices {
  readonly demo: DemoDataController;
  readonly events: EventController;
  readonly state: TourSharedState;
}

export type PreparationScope = 'step' | 'group' | 'tour';

export type PreparationCleanup = () => void | Promise<void>;

export interface PreparationOptions {
  scope?: PreparationScope;
  cleanup?: PreparationCleanup;
}

export interface TourLifecycleContext {
  readonly tour: TourDefinition;
  readonly services: TourServices;
  setShared(key: string, value: unknown): void;
  getShared<T = unknown>(key: string): T | undefined;
}

export interface StepRuntimeContext {
  readonly tour: TourDefinition;
  readonly dag: DagTourDefinition;
  readonly nodeId: NodeId;
  readonly services: TourServices;
  readonly shared: Map<string, unknown>;
  readonly storage: Map<string, unknown>;
  readonly history: ReadonlyArray<DagTourHistory>;
  readonly totalSteps: number;
  next(): Promise<void>;
  back(): Promise<void>;
  goTo(nodeId: NodeId): Promise<void>;
  registerCleanup(cleanup: () => void | Promise<void>): void;
  resolveTarget(): Element | null;
  waitForElement(selector: string, timeout?: number): Promise<Element>;
  setTourAttribute(name: string, value: string): void;
  removeTourAttribute(name: string): void;
  getTourAttribute(name: string): string | null;
  advance(): Promise<void>;
  interceptEvent<T = unknown>(event: string, handler: TourEventHandler<T>): () => void;
  ensurePreparation(
    prepId: string,
    prepare: () => void | Promise<void> | (() => void | Promise<void>) | Promise<() => void | Promise<void> | void>,
    options?: PreparationOptions | PreparationCleanup
  ): Promise<void>;
  releasePreparation(prepId: string): Promise<void>;
  setShared(key: string, value: unknown): void;
  getShared<T = unknown>(key: string): T | undefined;
}

export interface StepHistoryEntry {
  from: NodeId | null;
  to: NodeId;
  direction: 'forward' | 'backward' | 'jump';
  at: number;
}

export interface TourMachineSnapshot {
  status: TourRunStatus;
  tourId: TourId | null;
  dag: DagTourDefinition | null;
  tourName?: string;
  nodeId: NodeId | null;
  history: readonly DagTourHistory[];
  shared: ReadonlyMap<string, unknown>;
  isTransitioning: boolean;
  canGoNext: boolean;
  canGoBack: boolean;
  metadata?: Record<string, unknown>;
}

export interface GuidedTourActions {
  start: (tourId: TourId, options?: { startNodeId?: NodeId }) => Promise<void>;
  startWithDefinition: (definition: TourDefinition, options?: { startNodeId?: NodeId }) => Promise<void>;
  stop: () => Promise<void>;
  complete: () => Promise<void>;
  next: () => Promise<void>;
  back: () => Promise<void>;
  goTo: (nodeId: NodeId) => Promise<void>;
  getAvailableTransitions: (nodeId?: NodeId | null) => Promise<StepTransitionOption[]>;
  resetShared: () => void;
}

export interface GuidedTourContextValue {
  state: TourMachineSnapshot;
  actions: GuidedTourActions;
  registry: TourRegistryLike;
  services: TourServices;
  sequence: NodeId[];
  routeGuard: import('./navigation').TourRouteGuard;
  /** Current pathname, provided by the consumer's router. */
  location: string;
  /** Merged engine configuration. */
  config: TourEngineConfig;
}

export interface TourRegistryLike {
  register: (definition: TourDefinition) => void;
  registerMany: (definitions: TourDefinition[]) => void;
  get: (id: TourId) => TourDefinition | undefined;
  list: () => TourDefinition[];
}
