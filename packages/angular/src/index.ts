export { GuidedTourService, GUIDED_TOUR_CONFIG } from './lib/guided-tour.service';
export type { GuidedTourConfig } from './lib/guided-tour.service';

export { GuidedTourOverlayComponent } from './lib/guided-tour-overlay.component';

export { TourRouterAdapterService } from './lib/tour-router-adapter.service';

export { TourInteractableLocksDirective } from './lib/tour-interactable-locks.directive';
export type { LockState } from './lib/tour-interactable-locks.directive';
export { TourInteractableStateDirective } from './lib/tour-interactable-state.directive';

export { TourStepDropdownComponent } from './lib/tour-step-dropdown.component';
export type { StepSelectorItem } from './lib/tour-step-dropdown.component';

export { TourInlineMarkupPipe } from './lib/tour-inline-markup.pipe';

// Re-exported so Angular consumers don't need @routepilot/engine as a direct dep.
export type {
  TourDefinition,
  StepDefinition,
  TourMachineSnapshot,
  GuidedTourActions,
  TourServices,
  NodeId,
  TourId,
  TourRunStatus,
  StepContent,
  StepContentDefinition,
  StepTransitionOption,
  TourNavigationAdapter,
  TourEngineConfig,
  TourTooltipConfig,
  StepSelectorConfig,
  StepTooltipConfig,
  StepTargetResolver,
  TipPlacement,
} from '@routepilot/engine';

export {
  createStep,
  prepareAndClick,
  toStepSelectorConfig,
  createTourRegistry,
  TourRegistry,
  TourStateMachine,
  TourRouteGuard,
  normalizePath,
  InMemoryDemoDataBridge,
  InMemoryEventBridge,
  DEFAULT_CONFIG,
  mergeConfig,
} from '@routepilot/engine';
