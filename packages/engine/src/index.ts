// State machine & registry
export { TourStateMachine } from './state/stateMachine';
export type { TourDebugLogger } from './state/stateMachine';
export { TourRegistry, createTourRegistry } from './state/TourRegistry';

// Services
export { InMemoryDemoDataBridge, InMemoryEventBridge } from './services';
export type { DemoDataBridge, EventBridge } from './services';

// Core utilities
export { createStep, prepareAndClick } from './core/stepFactory';
export { toStepSelectorConfig } from './core/selectors';

// Navigation
export { TourRouteGuard, normalizePath } from './navigation';
export type { TourNavigationAdapter, RouteMode, RoutePolicy } from './navigation';

// Configuration
export { DEFAULT_CONFIG, mergeConfig } from './config';
export type {
  TourEngineConfig,
  TourTooltipConfig,
  TourBackdropConfig,
  TourScrollConfig,
  TourHighlightConfig,
  TourConfettiConfig,
  StepSelectorRenderProps,
} from './config';

// Confetti
export { startConfetti, setConfettiScriptUrl } from './utils/confetti';

// Types
export type {
  GuidedTourContextValue,
  GuidedTourActions,
  TourDefinition,
  StepDefinition,
  StepSceneFactory,
  StepSelectorConfig,
  StepTooltipConfig,
  StepSpotlightConfig,
  StepBehaviorConfig,
  StepTargetResolver,
  StepRuntimeContext,
  TourMachineSnapshot,
  TourRunStatus,
  TourServices,
  EventController,
  EventInterceptorOptions,
  TourEventHandler,
  DemoDataController,
  StepContent,
  StepContentDefinition,
  StepContentFactoryContext,
  ConfettiConfig,
  StepConfig,
  StepClickRequirements,
  StepTextInputRequirement,
  StepInteractablesConfig,
  StepInteractableRef,
  StepTransition,
  StepTransitionOption,
  StepAutoAdvanceConfig,
  PreparationScope,
  PreparationCleanup,
  PreparationOptions,
  StepPreparationDefinition,
  StepLifecycleHook,
  TourLifecycleContext,
  StepHistoryEntry,
  TourSharedState,
  TourNavigationConfig,
  NodeId,
  TourId,
  StepId,
  TipPlacement,
  ClickSelector,
  ClickRequirementGroup,
  TourRegistryLike,
} from './types';

// Internal types re-exported for framework adapters
export type { DagTourNode, DagTourDefinition, DagTourHistory } from './core/dagTourHistory';
export { buildDag } from './core/buildDag';
export { handleInteractablesEnter, handleInteractablesExit } from './core/interactables';
