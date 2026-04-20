import {
  Injectable,
  OnDestroy,
  Optional,
  Inject,
  InjectionToken,
} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import {
  TourStateMachine,
  TourRegistry,
  createTourRegistry,
  mergeConfig,
  normalizePath,
} from '@routepilot/engine';
import type {
  TourDefinition,
  TourMachineSnapshot,
  GuidedTourActions,
  TourServices,
  NodeId,
  TourNavigationAdapter,
  TourEngineConfig,
} from '@routepilot/engine';
import type { DemoDataBridge, EventBridge } from '@routepilot/engine';
import type { DagTourNode } from '@routepilot/engine';

export interface GuidedTourConfig {
  tours?: TourDefinition[];
  debug?: boolean;
  config?: TourEngineConfig;
  demoBridge?: DemoDataBridge;
  eventBridge?: EventBridge;
}

export const GUIDED_TOUR_CONFIG = new InjectionToken<GuidedTourConfig>(
  'GUIDED_TOUR_CONFIG',
);

@Injectable({ providedIn: 'root' })
export class GuidedTourService implements OnDestroy {
  private machine: TourStateMachine;
  private registry: TourRegistry;
  private resolvedConfig: TourEngineConfig;
  private unsubscribe: () => void;

  private stateSubject: BehaviorSubject<TourMachineSnapshot>;

  readonly state$: Observable<TourMachineSnapshot>;
  readonly routeGuard;

  constructor(
    @Optional() @Inject(GUIDED_TOUR_CONFIG) config?: GuidedTourConfig | null,
  ) {
    const cfg = config ?? {};
    this.machine = new TourStateMachine({
      demoBridge: cfg.demoBridge,
      eventBridge: cfg.eventBridge,
      debug: cfg.debug,
    });
    this.registry = createTourRegistry();
    this.resolvedConfig = mergeConfig(cfg.config);
    this.routeGuard = this.machine.routeGuard;

    if (cfg.tours) {
      this.registry.registerMany(cfg.tours);
    }

    this.stateSubject = new BehaviorSubject(this.machine.getState());
    this.unsubscribe = this.machine.subscribe((snapshot) => {
      this.stateSubject.next(snapshot);
    });

    this.state$ = this.stateSubject.asObservable();
  }

  get state(): TourMachineSnapshot {
    return this.stateSubject.value;
  }

  get config(): TourEngineConfig {
    return this.resolvedConfig;
  }

  getRegistry(): TourRegistry {
    return this.registry;
  }

  select<R>(selector: (s: TourMachineSnapshot) => R): Observable<R> {
    return this.state$.pipe(map(selector), distinctUntilChanged());
  }

  setNavigationAdapter(adapter: TourNavigationAdapter): void {
    this.routeGuard.setAdapter(adapter);
  }

  setLocation(path: string): void {
    this._currentPath = normalizePath(path);
  }

  private _currentPath = '/';
  get currentPath(): string {
    return this._currentPath;
  }

  registerTours(tours: TourDefinition[]): void {
    this.registry.registerMany(tours);
  }

  createServices(nodeId: NodeId | null): TourServices {
    return this.machine.createServices(nodeId);
  }

  getSequence(): string[] {
    const dag = this.state.dag;
    return dag?.sequence ?? [];
  }

  getOrderedNodes(): DagTourNode[] {
    const dag = this.state.dag;
    if (!dag) return [];
    const seq =
      dag.sequence.length > 0 ? dag.sequence : Object.keys(dag.nodes);
    return seq
      .map((id) => dag.nodes[id])
      .filter((node): node is DagTourNode => Boolean(node));
  }

  readonly actions: GuidedTourActions = {
    start: async (tourId: string, options?: { startNodeId?: NodeId }) => {
      const definition = this.registry.get(tourId);
      if (!definition) {
        throw new Error(`Tour "${tourId}" is not registered`);
      }
      await this.machine.startWithDefinition(definition, options);
    },
    startWithDefinition: (definition, options) =>
      this.machine.startWithDefinition(definition, options),
    stop: () => this.machine.stop(),
    complete: () => this.machine.complete(),
    next: () => this.machine.next(),
    back: () => this.machine.back(),
    goTo: (nodeId) => this.machine.goTo(nodeId),
    getAvailableTransitions: (nodeId) =>
      this.machine.getAvailableTransitions(nodeId),
    resetShared: () => this.machine.resetShared(),
  };

  ngOnDestroy(): void {
    this.unsubscribe();
    this.stateSubject.complete();
  }
}
