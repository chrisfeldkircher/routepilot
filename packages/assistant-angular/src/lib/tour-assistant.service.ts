import {
  Inject,
  Injectable,
  OnDestroy,
  Optional,
  Signal,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { GuidedTourService } from '@routepilot/angular';
import type {
  AssistantMatch,
  AssistantSearchScope,
  QueryOptions,
  TourIndex,
} from '@routepilot/assistant';
import {
  resolveAssistantLoadingAnimation,
  type TourAssistantLoadingAnimationName,
} from '@routepilot/assistant';
import {
  TOUR_ASSISTANT_CONFIG,
  type TourAssistantConfig,
} from './tour-assistant-config';

@Injectable({ providedIn: 'root' })
export class TourAssistantService implements OnDestroy {
  private readonly _open = signal(false);
  private readonly _query = signal('');
  private readonly _results = signal<AssistantMatch[]>([]);
  private readonly _currentTourId = signal<string | undefined>(undefined);
  private readonly _loadingAnimation = signal<TourAssistantLoadingAnimationName>(
    resolveAssistantLoadingAnimation(undefined),
  );

  readonly open: Signal<boolean> = this._open.asReadonly();
  readonly query: Signal<string> = this._query.asReadonly();
  readonly results: Signal<AssistantMatch[]> = this._results.asReadonly();
  readonly currentTourId: Signal<string | undefined> = this._currentTourId.asReadonly();
  readonly loadingAnimation: Signal<TourAssistantLoadingAnimationName> =
    this._loadingAnimation.asReadonly();

  private readonly config: TourAssistantConfig | null;
  private readonly sub: Subscription;
  private searchRequestId = 0;

  constructor(
    private readonly tour: GuidedTourService,
    @Optional() @Inject(TOUR_ASSISTANT_CONFIG) config?: TourAssistantConfig | null,
  ) {
    this.config = config ?? null;

    let prevTourId: string | null | undefined;
    let prevNodeId: string | null | undefined;

    this.sub = this.tour.state$.subscribe((snapshot) => {
      const tourChanged = snapshot.tourId !== prevTourId;
      const nodeChanged = snapshot.nodeId !== prevNodeId;

      if (tourChanged) {
        this._currentTourId.set(snapshot.tourId ?? undefined);
        this._loadingAnimation.set(
          resolveAssistantLoadingAnimation(
            this.tour.config.assistant?.loadingAnimation,
          ),
        );
      }

      if (tourChanged || nodeChanged) {
        this.searchRequestId += 1;
        this._open.set(false);
        this._query.set('');
        this._results.set([]);
      }

      prevTourId = snapshot.tourId;
      prevNodeId = snapshot.nodeId;
    });
  }

  private get index(): TourIndex | null {
    return this.config?.index ?? null;
  }

  toggle(): void {
    const next = !this._open();
    if (!next) {
      this.searchRequestId += 1;
      this._query.set('');
      this._results.set([]);
    }
    this._open.set(next);
  }

  close(): void {
    this.searchRequestId += 1;
    this._open.set(false);
    this._query.set('');
    this._results.set([]);
  }

  setQuery(value: string): void {
    this._query.set(value);
    void this.runSearch(value);
  }

  submit(): void {
    const results = this._results();
    if (results.length > 0) {
      void this.jumpTo(results[0]);
      return;
    }
    void this.runSearch(this._query());
  }

  async jumpTo(match: AssistantMatch): Promise<void> {
    const registry = this.tour.getRegistry();
    const tour = match.tour ?? registry.get(match.tourId) ?? null;
    const currentTourId = this._currentTourId();

    if (currentTourId && match.tourId === currentTourId) {
      await this.tour.actions.goTo(match.stepId);
    } else if (tour) {
      await this.tour.actions.startWithDefinition(tour, {
        startNodeId: match.stepId,
      });
    }
    this.close();
  }

  private async runSearch(text: string): Promise<void> {
    const index = this.index;
    if (!index) return;

    this.searchRequestId += 1;
    const requestId = this.searchRequestId;

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      this._results.set([]);
      return;
    }

    const currentTourId = this._currentTourId();
    const scope: AssistantSearchScope =
      this.config?.queryOptions?.scope ??
      (currentTourId ? 'current-tour-first' : 'all-tours');

    const queryOptions: QueryOptions = {
      ...this.config?.queryOptions,
      currentTourId,
      scope,
      limit: this.config?.limit ?? 3,
    };

    const next = await index.queryAsync(trimmed, queryOptions);
    if (this.searchRequestId !== requestId) return;
    this._results.set(next);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
