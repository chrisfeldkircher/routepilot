import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  OnInit,
  AfterViewInit,
  NgZone,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { startConfetti } from '@routepilot/engine';
import type {
  StepDefinition,
  StepContent,
  StepTooltipConfig,
  StepTransitionOption,
  TourMachineSnapshot,
  TourEngineConfig,
} from '@routepilot/engine';
import type { DagTourNode } from '@routepilot/engine';
import { GuidedTourService } from './guided-tour.service';
import { TourStepDropdownComponent, type StepSelectorItem } from './tour-step-dropdown.component';
import { TourInlineMarkupPipe } from './tour-inline-markup.pipe';
import {
  type Rect,
  type TooltipStyle,
  HIGHLIGHT_CLASS,
  TOOLTIP_PADDING,
  computeBoundingRect,
  computeTooltipStyle,
  expandRect,
  gatherSelectors,
  resolveElements,
  toRect,
} from './overlay-utils';

@Component({
  selector: 'rp-guided-tour-overlay',
  standalone: true,
  imports: [CommonModule, TourStepDropdownComponent, TourInlineMarkupPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Nothing rendered when not active -->
    <ng-container *ngIf="state.status === 'error'">
      <div
        class="gt-fixed gt-inset-0 gt-z-[1000] gt-pointer-events-none"
        [style.position]="'fixed'"
        [style.inset]="'0'"
        [style.zIndex]="1000"
        [style.pointerEvents]="'none'"
        [style.cursor]="'default'"
      >
        <div
          class="gt-fixed gt-inset-0 gt-bg-black/55 gt-pointer-events-auto"
          [style.position]="'fixed'"
          [style.inset]="'0'"
          [style.pointerEvents]="'auto'"
        ></div>
        <div
          class="tour-tooltip gt-rounded-lg gt-border gt-border-red-500/50 gt-bg-red-50/95 gt-pointer-events-auto gt-shadow-xl"
          [style.position]="'fixed'"
          [style.top]="'50%'"
          [style.left]="'50%'"
          [style.transform]="'translate(-50%, -50%)'"
          [style.width.px]="480"
          [style.zIndex]="1002"
          [style.pointerEvents]="'auto'"
          [style.overflow]="'visible'"
        >
          <div class="gt-px-4 gt-py-3 gt-border-b gt-border-red-200/60">
            <div class="gt-flex gt-items-center gt-gap-2">
              <span class="gt-text-red-600 gt-text-lg">&#9888;&#65039;</span>
              <h3 class="gt-text-sm gt-font-semibold gt-text-red-900">
                Tour Configuration Error
              </h3>
            </div>
          </div>
          <div class="gt-px-4 gt-py-3">
            <p class="gt-text-sm gt-text-red-800 gt-mb-3">
              {{ errorMessage || 'An error occurred while initializing the tour. Please check the console for details.' }}
            </p>
            <p class="gt-text-xs gt-text-red-700 gt-mb-4">
              This is a configuration error in the tour definition. The tour cannot start until this is fixed.
            </p>
            <div class="gt-flex gt-items-center gt-justify-end gt-gap-2">
              <button
                (click)="doStop()"
                class="gt-inline-flex gt-items-center gt-gap-2 gt-rounded-md gt-bg-red-600 gt-px-4 gt-py-2 gt-text-sm gt-font-semibold gt-text-white tour-btn tour-btn-primary"
              >
                {{ labels.close || 'Close Tour' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ng-container>

    <ng-container *ngIf="state.status === 'running' && currentStep">
      <div
        class="gt-fixed gt-inset-0 gt-z-[1000] gt-pointer-events-none"
        [style.position]="'fixed'"
        [style.inset]="'0'"
        [style.zIndex]="1000"
        [style.pointerEvents]="'none'"
        [style.cursor]="'default'"
      >
        <!-- Full backdrop (no spotlight) -->
        <div
          *ngIf="!highlightStyle"
          class="gt-fixed gt-inset-0 gt-pointer-events-auto"
          [style.position]="'fixed'"
          [style.inset]="'0'"
          [style.pointerEvents]="'auto'"
          [style.backgroundColor]="'rgba(0,0,0,var(--tour-backdrop-opacity, 0.55))'"
        ></div>

        <!-- Spotlight cutout -->
        <div
          *ngIf="highlightStyle"
          class="gt-fixed gt-rounded-xl gt-ring-4 gt-ring-primary/85 gt-pointer-events-none tour-highlight-pointer tour-highlight-bounce"
          [style.position]="'fixed'"
          [style.borderRadius]="'0.75rem'"
          [style.pointerEvents]="'none'"
          [style.top.px]="highlightStyle.top"
          [style.left.px]="highlightStyle.left"
          [style.width.px]="highlightStyle.width"
          [style.height.px]="highlightStyle.height"
          [style.zIndex]="1001"
          [style.boxShadow]="'0 0 0 9999px rgba(0,0,0,var(--tour-backdrop-opacity, 0.55))'"
          [style.backgroundColor]="'var(--tour-spotlight-bg, rgba(15, 23, 42, 0.12))'"
        ></div>

        <!-- Tooltip -->
        <div
          [class]="tooltipClassName"
          [style.position]="'fixed'"
          [style.top]="tipStyle.top"
          [style.left]="tipStyle.left"
          [style.width.px]="tipStyle.width"
          [style.zIndex]="tipStyle.zIndex"
          [style.maxHeight.px]="tipStyle.maxHeight"
          [style.overflowY]="tipStyle.overflowY"
          [style.pointerEvents]="'auto'"
          [style.transform]="tipStyle.transform || null"
        >
          <!-- Header -->
          <div
            class="tour-tooltip-header gt-px-4 gt-py-3 gt-flex gt-items-center gt-justify-between"
            [ngClass]="!selectorOpen ? 'gt-border-b gt-border-border/60' : ''"
          >
            <button
              type="button"
              (click)="toggleSelector()"
              class="tour-tooltip-title-btn gt-flex gt-items-center gt-gap-2 gt-text-left gt-text-sm gt-font-semibold gt-text-card-foreground"
              [attr.aria-expanded]="selectorOpen"
            >
              <span>{{ title }}</span>
              <span
                class="tour-tooltip-caret gt-text-muted-foreground gt-transition-transform gt-duration-150"
                [class.gt-rotate-180]="selectorOpen"
              >
                &#x25BE;
              </span>
            </button>
            <button
              class="tour-tooltip-skip-btn gt-text-xs gt-text-muted-foreground"
              (click)="handleSkipOrHubReturn()"
              [disabled]="isTransitioning"
              [attr.aria-label]="showCustomSkipLabel ? skipButtonLabel : 'Skip tour'"
            >
              {{ skipButtonLabel }}
            </button>
          </div>

          <!-- Step selector -->
          <div
            *ngIf="selectorOpen && stepItems.length > 1"
            class="tour-tooltip-selector-area gt-px-4 gt-py-3 gt-border-b gt-border-border/60"
          >
            <rp-tour-step-dropdown
              [items]="stepItems"
              [value]="currentStepId"
              (valueChange)="handleStepSelect($event)"
            ></rp-tour-step-dropdown>
          </div>

          <!-- Body -->
          <div
            *ngIf="hint || body || media"
            class="tour-tooltip-body-area gt-px-4"
          >
            <div
              *ngIf="hint"
              class="tour-tooltip-hint gt-pt-3 gt-text-xs gt-text-muted-foreground/90"
            >
              {{ hint }}
            </div>

            <div
              class="tour-tooltip-body gt-py-3 gt-text-sm gt-text-muted-foreground gt-whitespace-pre-line"
              [innerHTML]="body | tourInlineMarkup"
            ></div>

            <div *ngIf="media" class="tour-tooltip-media gt-pb-3">
              <!-- String → image URL -->
              <img
                *ngIf="mediaKind === 'image'"
                [src]="mediaSrc"
                [attr.alt]="mediaAlt"
                [attr.loading]="mediaLoading"
                style="display: block; width: 100%; height: auto; border-radius: 0.5rem"
              />
              <!-- Video (object media with type: 'video') -->
              <video
                *ngIf="mediaKind === 'video'"
                [src]="mediaSrc"
                [attr.poster]="mediaPoster"
                [muted]="true"
                [autoplay]="true"
                [loop]="true"
                playsinline
                style="display: block; width: 100%; height: auto; border-radius: 0.5rem"
              ></video>
              <!-- Raw HTML (object media with html field) -->
              <div
                *ngIf="mediaKind === 'html' && mediaHtml"
                [innerHTML]="mediaHtml"
              ></div>
            </div>
          </div>

          <!-- Branches -->
          <div *ngIf="showBranchChooser" class="tour-tooltip-branches">
            <span class="tour-tooltip-branch-label">Pick a path</span>
            <div class="tour-tooltip-branch-list">
              <button
                *ngFor="let transition of availableTransitions"
                (click)="goTo(transition.target)"
                [disabled]="isTransitioning"
                class="tour-tooltip-branch-item"
              >
                <span class="tour-tooltip-branch-item-text">
                  <span class="tour-tooltip-branch-item-label">
                    {{ transition.label || transition.target }}
                  </span>
                  <span
                    *ngIf="transition.description"
                    class="tour-tooltip-branch-item-description"
                  >
                    {{ transition.description }}
                  </span>
                </span>
                <span class="tour-tooltip-branch-item-chevron" aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="tour-tooltip-footer gt-px-4 gt-py-3 gt-border-t gt-border-border/60 gt-flex gt-items-center gt-justify-between">
            <span
              *ngIf="showStepCounter"
              class="tour-tooltip-counter gt-text-xs gt-text-muted-foreground"
            >
              Step {{ displayStepNumber > 0 ? displayStepNumber : '–' }}
              of {{ totalSteps || '–' }}
            </span>
            <div
              class="tour-tooltip-nav gt-flex gt-items-center gt-gap-2"
              style="margin-left: auto"
            >
              <button
                (click)="doBack()"
                [disabled]="!canGoBack || isTransitioning"
                class="tour-btn tour-btn-secondary gt-inline-flex gt-items-center gt-gap-2 gt-rounded-md gt-border gt-border-border gt-px-3 gt-py-1.5 gt-text-xs gt-font-medium gt-text-muted-foreground"
              >
                {{ labels.back || 'Back' }}
              </button>
              <button
                *ngIf="!isLast"
                (click)="doNext()"
                [disabled]="!canGoNext || isTransitioning"
                class="tour-btn tour-btn-primary gt-inline-flex gt-items-center gt-gap-2 gt-rounded-md gt-bg-primary gt-px-3 gt-py-1.5 gt-text-xs gt-font-semibold gt-text-primary-foreground"
              >
                {{ isTransitioning ? (labels.loading || 'Loading...') : (labels.next || 'Next') }}
              </button>
              <button
                *ngIf="isLast"
                (click)="doStop()"
                [disabled]="isTransitioning"
                class="tour-btn tour-btn-primary gt-inline-flex gt-items-center gt-gap-2 gt-rounded-md gt-bg-primary gt-px-3 gt-py-1.5 gt-text-xs gt-font-semibold gt-text-primary-foreground"
              >
                {{ labels.finish || 'Finish' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
})
export class GuidedTourOverlayComponent implements OnInit, AfterViewInit, OnDestroy {
  state!: TourMachineSnapshot;
  currentStep: StepDefinition | null = null;
  currentNode: DagTourNode | null = null;
  orderedNodes: DagTourNode[] = [];
  stepItems: StepSelectorItem[] = [];
  availableTransitions: StepTransitionOption[] = [];

  anchorRect: Rect | null = null;
  spotlightRect: Rect | null = null;
  highlightStyle: { top: number; left: number; width: number; height: number } | null = null;
  tipStyle: TooltipStyle = {
    position: 'fixed',
    top: '80px',
    left: '16px',
    width: 360,
    zIndex: 1002,
    maxHeight: 500,
    overflowY: 'auto',
  };

  title = 'Guided Step';
  body: unknown = '';
  hint: unknown = null;
  media: unknown = null;
  mediaKind: 'none' | 'image' | 'video' | 'html' = 'none';
  mediaSrc: string | null = null;
  mediaAlt: string | null = null;
  mediaLoading: string | null = null;
  mediaPoster: string | null = null;
  mediaHtml: SafeHtml | null = null;
  errorMessage = '';

  selectorOpen = false;
  currentStepId = '';
  displayStepNumber = 0;
  totalSteps = 0;
  isLast = false;
  canGoBack = false;
  canGoNext = false;
  isTransitioning = false;
  showBranchChooser = false;
  showStepCounter = true;
  tooltipClassName = 'tour-tooltip gt-rounded-lg gt-border gt-border-border gt-pointer-events-auto';

  labels: Record<string, string | undefined> = {};
  skipButtonLabel = 'Skip';
  showCustomSkipLabel = false;

  private highlightRef: { elements: HTMLElement[]; className: string } | null = null;
  private lastStepId: string | null = null;
  private confettiCleanup: (() => void) | null = null;
  private hubNodeId: string | undefined;
  private hubAction: string = 'stop';
  private hubReturnLabel: string | undefined;

  private sub!: Subscription;
  private rafId: number | null = null;
  private scrollListener: (() => void) | null = null;
  private resizeListener: (() => void) | null = null;
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;
  private clickGateListener: ((e: MouseEvent) => void) | null = null;
  private scrollBlockListeners: (() => void)[] = [];

  constructor(
    private tour: GuidedTourService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private host: ElementRef<HTMLElement>,
    private sanitizer: DomSanitizer,
  ) {}

  ngAfterViewInit(): void {
    // Portal-equivalent: relocate host element to document.body so the overlay
    // escapes any ancestor stacking context (transform/filter/overflow) that
    // would otherwise clip or repaint it.
    const el = this.host?.nativeElement;
    if (el && el.parentElement && el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
  }

  ngOnInit(): void {
    this.state = this.tour.state;
    this.sub = this.tour.state$.subscribe((snapshot) => {
      const prevStatus = this.state.status;
      const prevNodeId = this.state.nodeId;
      const prevIsTransitioning = this.state.isTransitioning;
      this.state = snapshot;
      this.deriveState(snapshot);

      if (snapshot.nodeId !== prevNodeId) {
        this.selectorOpen = false;
        // Defer so the engine's runEnter (which sets the new route policy)
        // has finished its synchronous portion before setupRouteEnforcement
        // reads the policy. rxjs subscribers fire synchronously from notify(),
        // which runs before runEnter; React's useEffect avoids this by design.
        queueMicrotask(() => this.onStepChanged());
      } else if (prevIsTransitioning && !snapshot.isTransitioning) {
        this.setupRouteEnforcement();
      }

      if (snapshot.status !== prevStatus) {
        this.onStatusChanged(prevStatus, snapshot.status);
      }

      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.teardownEffects();
    this.clearHighlight();
    if (this.confettiCleanup) {
      this.confettiCleanup();
      this.confettiCleanup = null;
    }
    // Remove the host element from body if we moved it there.
    const el = this.host?.nativeElement;
    if (el && el.parentElement === document.body) {
      el.parentElement.removeChild(el);
    }
  }

  private deriveState(s: TourMachineSnapshot): void {
    const config = this.tour.config;
    this.labels = config.tooltip?.buttonLabels ?? {};
    this.showStepCounter = config.tooltip?.showStepCounter !== false;

    if (s.dag) {
      const seq = s.dag.sequence.length > 0 ? s.dag.sequence : Object.keys(s.dag.nodes);
      this.orderedNodes = seq
        .map((id) => s.dag?.nodes[id])
        .filter((n): n is DagTourNode => Boolean(n));
    } else {
      this.orderedNodes = [];
    }

    if (s.status === 'running' && s.dag && s.nodeId) {
      this.currentNode = s.dag.nodes[s.nodeId] ?? null;
    } else {
      this.currentNode = null;
    }
    this.currentStep = this.currentNode?.step ?? null;
    this.currentStepId = this.currentStep?.id ?? '';

    const idx = this.currentNode
      ? this.orderedNodes.findIndex((n) => n.id === this.currentNode!.id)
      : -1;
    this.totalSteps = s.dag?.totalSteps ?? this.orderedNodes.length;
    this.displayStepNumber = idx >= 0 ? idx + 1 : 0;

    this.canGoBack = s.canGoBack;
    this.canGoNext = s.canGoNext;
    this.isTransitioning = s.isTransitioning;
    this.isLast =
      !!this.currentNode &&
      this.currentNode.next.length === 0 &&
      this.availableTransitions.length === 0;
    this.showBranchChooser = this.availableTransitions.length > 1;

    const navConfig = s.dag?.navigation;
    this.hubNodeId = navConfig?.hubNodeId;
    this.hubAction = navConfig?.hubAction ?? (this.hubNodeId ? 'goToHub' : 'stop');
    this.hubReturnLabel = navConfig?.hubReturnLabel;

    const canGoToHub =
      this.hubAction === 'goToHub' &&
      !!this.hubNodeId &&
      !!this.currentNode &&
      this.currentNode.id !== this.hubNodeId &&
      !!s.dag?.nodes[this.hubNodeId];

    this.showCustomSkipLabel =
      !!this.hubReturnLabel && !!this.currentNode && (this.hubAction === 'stop' || canGoToHub);
    this.skipButtonLabel = this.showCustomSkipLabel
      ? this.hubReturnLabel!
      : (this.labels['skip'] ?? 'Skip');

    this.resolveContent(s);

    this.errorMessage = (s.metadata?.['lastError'] as string) ?? '';

    this.tooltipClassName = [
      'tour-tooltip gt-rounded-lg gt-border gt-border-border gt-pointer-events-auto',
      config.tooltip?.className ?? '',
      this.currentStep?.tooltip?.className ?? '',
    ]
      .join(' ')
      .trim();

    this.buildStepItems();
  }

  private resolveContent(s: TourMachineSnapshot): void {
    const step = this.currentStep;
    const node = this.currentNode;
    if (s.status !== 'running' || !step || !node) {
      this.title = 'Guided Step';
      this.body = '';
      this.hint = null;
      this.media = null;
      this.resolveMedia(null);
      return;
    }

    let content: StepContent | null = null;
    if (step.content) {
      const resolved =
        typeof step.content === 'function'
          ? step.content({
              tourId: s.tourId ?? node.id,
              nodeId: node.id,
              shared: this.tour.createServices(node.id).state.shared,
              storage:
                this.tour.createServices(node.id).state.storage.get(node.id) ??
                new Map<string, unknown>(),
            })
          : step.content;
      if (resolved) content = resolved as StepContent;
    }

    this.title =
      ((content?.title as string) ??
        step.title ??
        (step.meta?.['title'] as string)) ?? 'Guided Step';
    this.body = (content?.body as unknown) ?? step.body ?? '';
    this.hint = (content as StepContent | null)?.hint ?? null;
    this.media = (content as StepContent | null)?.media ?? null;
    this.resolveMedia(this.media);
  }

  private resolveMedia(media: unknown): void {
    this.mediaKind = 'none';
    this.mediaSrc = null;
    this.mediaAlt = null;
    this.mediaLoading = null;
    this.mediaPoster = null;
    this.mediaHtml = null;

    if (!media) return;

    if (typeof media === 'string') {
      this.mediaKind = 'image';
      this.mediaSrc = media;
      this.mediaAlt = 'Step media';
      this.mediaLoading = 'eager';
      return;
    }

    if (typeof media === 'object') {
      const obj = media as {
        type?: 'image' | 'video' | 'html';
        src?: string;
        alt?: string;
        loading?: string;
        poster?: string;
        html?: string;
      };

      if (typeof obj.html === 'string') {
        this.mediaKind = 'html';
        this.mediaHtml = this.sanitizer.bypassSecurityTrustHtml(obj.html);
        return;
      }

      if (typeof obj.src === 'string') {
        const kind = obj.type === 'video' ? 'video' : 'image';
        this.mediaKind = kind;
        this.mediaSrc = obj.src;
        this.mediaAlt = obj.alt ?? 'Step media';
        this.mediaLoading = obj.loading ?? 'eager';
        this.mediaPoster = obj.poster ?? null;
        return;
      }
    }
  }

  private buildStepItems(): void {
    const currentChapter = this.getCurrentChapter();
    const stepPickerScope = this.state.dag?.navigation?.stepPickerScope ?? 'tour';

    const items = this.orderedNodes.map((node, index) => {
      const step = node.step;
      if (!step) {
        return {
          value: node.id,
          label: `Step ${index + 1}`,
          sublabel: 'Tour Overview',
          chapter: undefined as string | undefined,
        };
      }

      const chapter =
        (typeof step.chapter === 'string' && step.chapter.length > 0 && step.chapter) ||
        (typeof step.meta?.['chapter'] === 'string' &&
          (step.meta['chapter'] as string).length > 0 &&
          (step.meta['chapter'] as string)) ||
        undefined;

      const contentTitle =
        step.content && typeof step.content === 'object' && 'title' in step.content
          ? typeof step.content.title === 'string'
            ? step.content.title
            : undefined
          : undefined;

      const label =
        (typeof step.title === 'string' && step.title) ||
        contentTitle ||
        (typeof step.meta?.['title'] === 'string' && (step.meta['title'] as string)) ||
        `Step ${index + 1}`;

      return {
        value: step.id,
        label: `${index + 1}. ${label}`,
        sublabel: chapter ?? 'Tour Overview',
        chapter,
      };
    });

    if (stepPickerScope === 'chapter' && currentChapter) {
      const filtered = items.filter((item) => item.chapter === currentChapter);
      if (filtered.length > 0) {
        this.stepItems = filtered.map(({ chapter: _c, ...rest }) => rest);
        return;
      }
    }

    this.stepItems = items.map(({ chapter: _c, ...rest }) => rest);
  }

  private getCurrentChapter(): string | undefined {
    const step = this.currentNode?.step;
    if (!step) return undefined;
    return (
      (typeof step.chapter === 'string' && step.chapter.length > 0 && step.chapter) ||
      (typeof step.meta?.['chapter'] === 'string' &&
        (step.meta['chapter'] as string).length > 0 &&
        (step.meta['chapter'] as string)) ||
      undefined
    );
  }

  private onStatusChanged(prev: string, current: string): void {
    if (current === 'running') {
      this.setupEffects();
    } else {
      this.teardownEffects();
      this.clearHighlight();
      this.anchorRect = null;
      this.spotlightRect = null;
      this.highlightStyle = null;
      this.lastStepId = null;
    }

    if (current !== 'running' && this.confettiCleanup) {
      this.confettiCleanup();
      this.confettiCleanup = null;
    }
  }

  private onStepChanged(): void {
    this.fetchTransitions();
    this.syncPositions();
    this.scrollStepIntoView();
    this.checkConfetti();
    this.setupRouteEnforcement();
  }

  private setupEffects(): void {
    this.zone.runOutsideAngular(() => {
      this.setupPositionSync();
      this.setupScrollBlocking();
      this.setupKeyboardShortcuts();
      this.setupClickGating();
    });
  }

  private teardownEffects(): void {
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      this.scrollListener = null;
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }

    if (this.clickGateListener) {
      document.removeEventListener('click', this.clickGateListener, true);
      this.clickGateListener = null;
    }

    this.teardownScrollBlocking();
  }

  private setupPositionSync(): void {
    let pending = false;

    const requestSync = () => {
      if (pending) return;
      pending = true;
      this.rafId = window.requestAnimationFrame(() => {
        pending = false;
        this.rafId = null;
        this.syncPositions();
        this.cdr.markForCheck();
      });
    };

    this.scrollListener = requestSync;
    this.resizeListener = requestSync;
    window.addEventListener('scroll', requestSync, true);
    window.addEventListener('resize', requestSync);

    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(requestSync);
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(requestSync);
      this.resizeObserver.observe(document.body);
    }

    requestSync();
  }

  private syncPositions(): void {
    const step = this.currentStep;
    if (this.state.status !== 'running' || !step) {
      this.anchorRect = null;
      this.spotlightRect = null;
      this.highlightStyle = null;
      this.clearHighlight();
      return;
    }

    const routeGuard = this.tour.routeGuard;
    if (step.route && !routeGuard.isPathAllowed(this.tour.currentPath)) {
      this.anchorRect = null;
      this.spotlightRect = null;
      this.highlightStyle = null;
      this.clearHighlight();
      return;
    }

    const selectors = gatherSelectors(step);
    const highlightClass = step.spotlight?.outlineClassName ?? HIGHLIGHT_CLASS;

    const allElements: HTMLElement[] = [];
    const highlightElements: HTMLElement[] = [];
    let anchor: HTMLElement | null = null;

    for (const selector of selectors) {
      const elements = resolveElements(selector.target, selector.multiple);
      if (elements.length === 0) continue;

      if (!anchor && !selector.highlight) {
        anchor = elements[0];
      }
      if (selector.highlight) {
        highlightElements.push(...elements);
      }
      allElements.push(...elements);
    }

    if (!anchor && allElements.length > 0) {
      anchor = allElements[0];
    }

    const unionRect = computeBoundingRect(allElements);
    const padding = step.spotlight?.padding ?? 8;

    this.anchorRect = anchor ? toRect(anchor.getBoundingClientRect()) : unionRect;
    this.spotlightRect = expandRect(unionRect, padding);

    if (highlightElements.length > 0) {
      this.applyHighlight(highlightElements, highlightClass);
    } else {
      this.clearHighlight();
    }

    const pointerPadding = 8;
    const pointerPadOffset = pointerPadding / 2;
    this.highlightStyle = this.spotlightRect
      ? {
          top: this.spotlightRect.top - pointerPadOffset,
          left: this.spotlightRect.left - pointerPadOffset,
          width: this.spotlightRect.width + pointerPadding,
          height: this.spotlightRect.height + pointerPadding,
        }
      : null;

    const tooltipConfig: StepTooltipConfig | undefined =
      step.tooltip ??
      (step.tipPlacement || step.tipOffset
        ? {
            placement: step.tipPlacement as StepTooltipConfig['placement'],
            offset: step.tipOffset,
          }
        : undefined);
    this.tipStyle = computeTooltipStyle(this.anchorRect, tooltipConfig);
  }

  private clearHighlight(): void {
    const current = this.highlightRef;
    if (!current) return;
    current.elements.forEach((el) => {
      el.classList.remove(current.className);
      const saved = el.dataset['tourSavedOverflow'];
      if (saved !== undefined) {
        if (saved) {
          el.style.overflow = saved;
        } else {
          el.style.removeProperty('overflow');
        }
        delete el.dataset['tourSavedOverflow'];
      }
    });
    this.highlightRef = null;
  }

  private applyHighlight(elements: HTMLElement[], className: string): void {
    const previous = this.highlightRef;
    if (
      previous &&
      previous.className === className &&
      previous.elements.length === elements.length &&
      previous.elements.every((el, idx) => el === elements[idx])
    ) {
      return;
    }

    this.clearHighlight();
    if (elements.length === 0) return;
    elements.forEach((el) => {
      el.classList.add(className);
      const computed = getComputedStyle(el).overflow;
      if (computed !== 'visible') {
        el.dataset['tourSavedOverflow'] = el.style.overflow ?? '';
        el.style.overflow = 'visible';
      }
    });
    this.highlightRef = { elements, className };
  }

  private setupScrollBlocking(): void {
    this.teardownScrollBlocking();
    if (this.state.status !== 'running') return;
    const shouldBlock = this.currentStep?.behavior?.blockScroll ?? true;
    if (!shouldBlock) return;

    const findScrollableAncestor = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof Node)) return null;
      let node: Node | null = target;
      while (node && node !== document.body) {
        if (node instanceof HTMLElement) {
          const oy = getComputedStyle(node).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) {
            return node;
          }
        }
        node = node.parentNode;
      }
      return null;
    };

    const prevent = (e: Event) => {
      const scrollable = findScrollableAncestor(e.target);
      if (!scrollable) {
        e.preventDefault();
        return;
      }
      if (e instanceof WheelEvent) {
        const atTop = scrollable.scrollTop <= 0;
        const atBottom =
          scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
        if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
          e.preventDefault();
        }
      }
    };

    const preventKeys = (e: KeyboardEvent) => {
      if (findScrollableAncestor(e.target)) return;
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End'];
      if (scrollKeys.includes(e.code)) e.preventDefault();
    };

    window.addEventListener('wheel', prevent, { passive: false });
    window.addEventListener('touchmove', prevent, { passive: false });
    window.addEventListener('keydown', preventKeys, { passive: false });

    this.scrollBlockListeners = [
      () => window.removeEventListener('wheel', prevent),
      () => window.removeEventListener('touchmove', prevent),
      () => window.removeEventListener('keydown', preventKeys),
    ];
  }

  private teardownScrollBlocking(): void {
    this.scrollBlockListeners.forEach((fn) => fn());
    this.scrollBlockListeners = [];
  }

  private setupKeyboardShortcuts(): void {
    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
    }

    this.keydownListener = (event: KeyboardEvent) => {
      if (this.state.status !== 'running') return;
      if (event.key === 'Escape') {
        event.preventDefault();
        this.zone.run(() => void this.tour.actions.stop());
      } else if (event.key === 'ArrowRight') {
        if (this.isTransitioning || !this.canGoNext) return;
        event.preventDefault();
        this.zone.run(() => void this.tour.actions.next());
      } else if (event.key === 'ArrowLeft') {
        if (this.isTransitioning || !this.canGoBack) return;
        event.preventDefault();
        this.zone.run(() => void this.tour.actions.back());
      }
    };

    window.addEventListener('keydown', this.keydownListener);
  }

  private setupClickGating(): void {
    if (this.clickGateListener) {
      document.removeEventListener('click', this.clickGateListener, true);
    }

    this.clickGateListener = (e: MouseEvent) => {
      if (this.state.status !== 'running' || !this.currentStep) return;
      if (!e.isTrusted) return;

      const target = e.target;
      if (!(target instanceof Element)) return;

      const overlayRoot =
        document.querySelector('.gt-z-\\[1000\\]') ??
        document.querySelector('.z-\\[1000\\]');
      if (overlayRoot && overlayRoot.contains(target)) return;
      if (target.closest('.tour-tooltip')) return;

      // Escape hatch: any host-app element marked [data-tour-exit] always
      // aborts the tour and proceeds with its native behavior (e.g. a nav
      // link navigating away). Without this, the click gate would swallow it.
      if (target.closest('[data-tour-exit]')) {
        this.zone.run(() => void this.tour.actions.stop());
        return;
      }

      const routeGuard = this.tour.routeGuard;
      const allowed = this.currentStep.clickSelectors;
      if (allowed && allowed.length > 0) {
        for (const sel of allowed) {
          if (target.closest(sel)) {
            const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
            if (anchor) {
              try {
                const url = new URL(anchor.href, window.location.origin);
                routeGuard.allowPath(url.pathname);
              } catch {
                // ignore
              }
            }
            return;
          }
        }
      }

      if (routeGuard.getMode() === 'guard') {
        const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
        if (anchor) {
          try {
            const url = new URL(anchor.href, window.location.origin);
            if (!routeGuard.isPathAllowed(url.pathname)) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          } catch {
            // ignore
          }
        }
      }

      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('click', this.clickGateListener, true);
  }

  private setupRouteEnforcement(): void {
    const step = this.currentStep;
    if (!step || this.state.status !== 'running') return;

    const routeGuard = this.tour.routeGuard;
    const policy = routeGuard.getPolicy();
    if (!policy) return;
    if (routeGuard.isPathAllowed(this.tour.currentPath)) return;

    const mode = policy.mode;
    if (mode === 'pause') return;

    if (mode === 'guard') {
      if (routeGuard.hasSettled()) {
        void routeGuard.enforcePrimary();
      }
      return;
    }

    // navigate mode
    const navigateAndWait = async () => {
      await routeGuard.enforcePrimary();
      const selectors = gatherSelectors(step);
      const prioritized = [
        ...selectors.filter((s) => !s.highlight),
        ...selectors.filter((s) => s.highlight),
      ];
      const requiredSelectors = prioritized.filter((s) => !s.optional);
      const selectorsToCheck = requiredSelectors.length > 0 ? requiredSelectors : prioritized;

      if (selectorsToCheck.length === 0 && !step.target) return;

      const hasReadyElement = (): boolean => {
        if (selectorsToCheck.length === 0 && step.target) {
          return resolveElements(step.target).length > 0;
        }
        for (const sel of selectorsToCheck) {
          try {
            if (resolveElements(sel.target, sel.multiple).length > 0) return true;
          } catch {
            // selector may not exist yet
          }
        }
        return selectorsToCheck.length === 0;
      };

      for (let attempt = 0; attempt < 60; attempt++) {
        if (hasReadyElement()) break;
        await new Promise((r) => setTimeout(r, 50));
      }

      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    };

    void navigateAndWait();
  }

  private scrollStepIntoView(): void {
    const step = this.currentStep;
    if (this.state.status !== 'running' || !step) return;
    if (this.lastStepId === step.id) return;
    this.lastStepId = step.id;

    const selectors = gatherSelectors(step);
    const prioritized = [
      ...selectors.filter((s) => !s.highlight),
      ...selectors.filter((s) => s.highlight),
    ];
    const requiredSelectors = prioritized.filter((s) => !s.optional);
    const selectorsToCheck = requiredSelectors.length > 0 ? requiredSelectors : prioritized;

    const findFirstElement = (): HTMLElement | null => {
      if (selectorsToCheck.length === 0 && step.target) {
        const elements = resolveElements(step.target);
        return elements[0] ?? null;
      }
      for (const selector of selectorsToCheck) {
        try {
          const elements = resolveElements(selector.target, selector.multiple);
          if (elements.length > 0) return elements[0];
        } catch {
          // ignore
        }
      }
      return null;
    };

    const ensureInView = async () => {
      for (let attempt = 0; attempt < 60; attempt++) {
        const element = findFirstElement();
        if (element) {
          await new Promise((r) => requestAnimationFrame(r));
          try {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          } catch {
            // ignore
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 50));
      }
    };

    void ensureInView();
  }

  private fetchTransitions(): void {
    const node = this.currentNode;
    if (!node) {
      this.availableTransitions = [];
      this.isLast = false;
      this.showBranchChooser = false;
      this.checkConfetti();
      return;
    }

    this.tour.actions
      .getAvailableTransitions(node.id)
      .then((options) => {
        this.availableTransitions = options;
        this.isLast =
          !!this.currentNode &&
          this.currentNode.next.length === 0 &&
          this.availableTransitions.length === 0;
        this.showBranchChooser = this.availableTransitions.length > 1;
        this.checkConfetti();
        this.cdr.markForCheck();
      })
      .catch((err) => {
        console.error('[guided-tour] Failed to evaluate transitions', err);
        this.availableTransitions = [];
        this.isLast = false;
        this.showBranchChooser = false;
        this.checkConfetti();
        this.cdr.markForCheck();
      });
  }

  private checkConfetti(): void {
    if (
      this.state.status !== 'running' ||
      !this.state.tourId ||
      !this.isLast ||
      !this.currentStep
    ) {
      if (this.confettiCleanup) {
        this.confettiCleanup();
        this.confettiCleanup = null;
      }
      return;
    }

    if (this.confettiCleanup) return;

    const tour = this.tour.getRegistry().get(this.state.tourId);
    const confettiConfig = tour?.confetti;

    if (confettiConfig?.enabled !== false) {
      this.confettiCleanup = startConfetti({
        duration: confettiConfig?.duration ?? 5000,
        colors: confettiConfig?.colors ?? [
          '#76c893',
          '#52b69a',
          '#34a0a4',
          '#168aad',
          '#1a759f',
          '#1e6091',
        ],
        startVelocity: confettiConfig?.startVelocity ?? 30,
        spread: confettiConfig?.spread ?? 360,
        ticks: confettiConfig?.ticks ?? 60,
        zIndex: confettiConfig?.zIndex ?? 10000,
      });
    }
  }

  doNext(): void {
    void this.tour.actions.next();
  }

  doBack(): void {
    void this.tour.actions.back();
  }

  doStop(): void {
    void this.tour.actions.stop();
  }

  goTo(nodeId: string): void {
    void this.tour.actions.goTo(nodeId);
  }

  toggleSelector(): void {
    this.selectorOpen = !this.selectorOpen;
  }

  handleStepSelect(value: string | undefined): void {
    if (!value || value === this.currentStepId) return;
    void this.tour.actions.goTo(value);
  }

  handleSkipOrHubReturn(): void {
    const canGoToHub =
      this.hubAction === 'goToHub' &&
      !!this.hubNodeId &&
      !!this.currentNode &&
      this.currentNode.id !== this.hubNodeId &&
      !!this.state.dag?.nodes[this.hubNodeId];

    if (canGoToHub && this.hubNodeId) {
      void this.tour.actions.goTo(this.hubNodeId);
      return;
    }
    void this.tour.actions.stop();
  }

}
