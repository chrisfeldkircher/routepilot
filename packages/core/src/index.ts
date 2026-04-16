// Styles — consumers import once in their entry point:
//   import '@routepilot/core/tour.css';

// Components
export { GuidedTourProvider } from './components/GuidedTourProvider';
export type { GuidedTourProviderProps } from './components/GuidedTourProvider';
export { default as GuidedTourOverlay } from './components/GuidedTourOverlay';
export { default as GuidedTourContext } from './components/GuidedTourContext';

// Hooks
export { useGuidedTour, useGuidedTourActions, useGuidedTourServices, useGuidedTourState } from './hooks/useGuidedTour';
export { useTourInteractableLocks } from './hooks/useTourInteractableLocks';
export type { LockState } from './hooks/useTourInteractableLocks';
export { useTourInteractableState } from './hooks/useTourInteractableState';

// State Management
export { TourRegistry, createTourRegistry } from './state/TourRegistry';
export { TourStateMachine } from './state/stateMachine';

// Services & Bridges
export { InMemoryDemoDataBridge, InMemoryEventBridge } from './services';
export type { DemoDataBridge, EventBridge } from './services';

// Core
export { createStep, prepareAndClick } from './core/stepFactory';
export { toStepSelectorConfig } from './core/selectors';

// Navigation
export { TourRouteGuard, normalizePath } from './navigation';
export type { TourNavigationAdapter, RouteMode, RoutePolicy } from './navigation';

// Configuration
export { DEFAULT_CONFIG, mergeConfig } from './config';
export type { TourEngineConfig, TourTooltipConfig, TourBackdropConfig, TourScrollConfig, TourHighlightConfig, TourConfettiConfig, StepSelectorRenderProps } from './config';

// Debug
export type { TourDebugLogger } from './state/stateMachine';

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
  ConfettiConfig,
  StepConfig,
  StepClickRequirements,
  StepInteractablesConfig,
  StepInteractableRef,
  PreparationScope,
  PreparationCleanup,
  PreparationOptions,
  StepPreparationDefinition,
  NodeId,
  TourId,
  StepLifecycleHook,
  TipPlacement,
} from './types';
