import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import GuidedTourContext from './GuidedTourContext';
import { TooltipSlotProvider } from './TooltipSlotContext';
import {
  TourRegistry,
  createTourRegistry,
  TourStateMachine,
  mergeConfig,
  normalizePath,
} from '@routepilot/engine';
import type {
  GuidedTourActions,
  GuidedTourContextValue,
  NodeId,
  TourDefinition,
  TourMachineSnapshot,
  TourNavigationAdapter,
  TourEngineConfig,
  DemoDataBridge,
  EventBridge,
} from '@routepilot/engine';
import type { JSX } from 'react';

export interface GuidedTourProviderProps {
  children: ReactNode;
  registry?: TourRegistry;
  tours?: TourDefinition[];
  demoBridge?: DemoDataBridge;
  eventBridge?: EventBridge;
  /** Enable debug logging in the tour engine. Off by default. */
  debug?: boolean;
  /** Current pathname from your router (e.g., `useLocation().pathname`). */
  location?: string;
  /** Navigation adapter for route enforcement. */
  navigation?: TourNavigationAdapter;
  /** Global configuration overrides. */
  config?: TourEngineConfig;
  /**
   * Optional ReactNode rendered inside the tour tooltip, between the body
   * and the step-counter/Back/Next footer. The surrounding divider only
   * renders when this node is truthy.
   */
  tooltipFooterSlot?: ReactNode;
  /**
   * Optional ReactNode rendered inline in the tour tooltip footer,
   * before the Back button. Use this for plugin toggles that should
   * sit next to the primary nav buttons.
   */
  tooltipFooterNavSlot?: ReactNode;
}

const useStableMachine = (demoBridge?: DemoDataBridge, eventBridge?: EventBridge, debug?: boolean): TourStateMachine => {
  const machineRef = useRef<TourStateMachine>(new TourStateMachine({ demoBridge, eventBridge, debug }));
  if (!machineRef.current) {
    machineRef.current = new TourStateMachine({ demoBridge, eventBridge, debug });
  }
  return machineRef.current;
};

const useRegistry = (registry?: TourRegistry, tours?: TourDefinition[]): TourRegistry => {
  const registryRef = useRef<TourRegistry>(registry ?? createTourRegistry());

  if (registry && registryRef.current !== registry) {
    registryRef.current = registry;
  }

  useEffect(() => {
    if (!tours || tours.length === 0) return;
    registryRef.current.registerMany(tours);
  }, [tours]);

  return registryRef.current;
};

const buildActions = (machine: TourStateMachine, registry: TourRegistry): GuidedTourActions => {
  const resolveStart = async (tourId: string, options?: { startNodeId?: NodeId }) => {
    const definition = registry.get(tourId);
    if (!definition) {
      throw new Error(`Tour "${tourId}" is not registered`);
    }
    await machine.startWithDefinition(definition, options);
  };

  return {
    start: resolveStart,
    startWithDefinition: (definition, options) => machine.startWithDefinition(definition, options),
    stop: () => machine.stop(),
    complete: () => machine.complete(),
    next: () => machine.next(),
    back: () => machine.back(),
    goTo: (nodeId) => machine.goTo(nodeId),
    getAvailableTransitions: (nodeId) => machine.getAvailableTransitions(nodeId),
    resetShared: () => machine.resetShared(),
  };
};

export const GuidedTourProvider = ({
  children,
  registry,
  tours,
  demoBridge,
  eventBridge,
  debug,
  location: locationProp,
  navigation,
  config: configProp,
  tooltipFooterSlot,
  tooltipFooterNavSlot,
}: GuidedTourProviderProps): JSX.Element => {
  const machine = useStableMachine(demoBridge, eventBridge, debug);
  const effectiveRegistry = useRegistry(registry, tours);

  const subscribe = (listener: (state: TourMachineSnapshot) => void) => machine.subscribe(listener);
  const getSnapshot = () => machine.getState();

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const actions = useMemo(() => buildActions(machine, effectiveRegistry), [machine, effectiveRegistry]);
  const services = useMemo(() => machine.createServices(snapshot.nodeId), [machine, snapshot.nodeId]);

  const sequence = useMemo(() => snapshot.dag?.sequence ?? [], [snapshot.dag]);

  const routeGuard = machine.routeGuard;
  const resolvedConfig = useMemo(() => mergeConfig(configProp), [configProp]);
  const currentPath = locationProp ?? (typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/');

  // Bind the navigation adapter to the route guard when provided.
  useEffect(() => {
    if (navigation) {
      routeGuard.setAdapter(navigation);
    }
  }, [routeGuard, navigation]);

  const contextValue: GuidedTourContextValue = useMemo(
    () => ({
      state: snapshot,
      actions,
      registry: effectiveRegistry,
      services,
      sequence,
      routeGuard,
      location: currentPath,
      config: resolvedConfig,
    }),
    [snapshot, actions, effectiveRegistry, services, sequence, routeGuard, currentPath, resolvedConfig]
  );

  const slotValue = useMemo(
    () => ({ footer: tooltipFooterSlot, footerNav: tooltipFooterNavSlot }),
    [tooltipFooterSlot, tooltipFooterNavSlot],
  );

  return (
    <GuidedTourContext.Provider value={contextValue}>
      <TooltipSlotProvider value={slotValue}>{children}</TooltipSlotProvider>
    </GuidedTourContext.Provider>
  );
};

export default GuidedTourProvider;
