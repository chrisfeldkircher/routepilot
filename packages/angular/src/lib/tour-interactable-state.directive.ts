import {
  Directive,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

/**
 * Manages interactable open/close state with tour lock override.
 *
 * Usage:
 * ```html
 * <div
 *   [rpTourInteractableState]="'my-dropdown'"
 *   (openChange)="setOpen($event)"
 *   [tourCanOverrideLocks]="true"
 * >
 * ```
 *
 * Or programmatically:
 * ```ts
 * @ViewChild(TourInteractableStateDirective)
 * interactable!: TourInteractableStateDirective;
 *
 * safeSetOpen(next: boolean) {
 *   this.interactable.safeSetOpen(next);
 * }
 * ```
 */
@Directive({
  selector: '[rpTourInteractableState]',
  standalone: true,
  exportAs: 'rpTourInteractableState',
})
export class TourInteractableStateDirective implements OnInit, OnDestroy, OnChanges {
  @Input('rpTourInteractableState') id = '';
  @Input() tourCanOverrideLocks = true;
  @Output() openChange = new EventEmitter<boolean>();

  openLocked = false;
  closeLocked = false;

  private observer: MutationObserver | null = null;
  private openHandler: ((e: Event) => void) | null = null;
  private closeHandler: ((e: Event) => void) | null = null;

  ngOnInit(): void {
    this.setup();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id']) {
      this.teardown();
      this.setup();
    }
  }

  ngOnDestroy(): void {
    this.teardown();
  }

  safeSetOpen(next: boolean): void {
    if (next && this.openLocked) return;
    if (!next && this.closeLocked) return;
    this.openChange.emit(next);
  }

  private setup(): void {
    if (typeof document === 'undefined') return;

    this.readLocks();

    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => this.readLocks());
      this.observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-tour-lock-open', 'data-tour-lock-close'],
      });
    }

    this.openHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (!detail || detail.id !== this.id) return;
      if (!this.tourCanOverrideLocks && this.openLocked) return;
      this.openChange.emit(true);
    };

    this.closeHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (!detail || detail.id !== this.id) return;
      if (!this.tourCanOverrideLocks && this.closeLocked) return;
      this.openChange.emit(false);
    };

    window.addEventListener(
      'guided-tour:interactable-open',
      this.openHandler as EventListener,
    );
    window.addEventListener(
      'guided-tour:interactable-close',
      this.closeHandler as EventListener,
    );
  }

  private teardown(): void {
    this.observer?.disconnect();
    this.observer = null;

    if (this.openHandler) {
      window.removeEventListener(
        'guided-tour:interactable-open',
        this.openHandler as EventListener,
      );
      this.openHandler = null;
    }
    if (this.closeHandler) {
      window.removeEventListener(
        'guided-tour:interactable-close',
        this.closeHandler as EventListener,
      );
      this.closeHandler = null;
    }
  }

  private readLocks(): void {
    const openAttr =
      document.documentElement.getAttribute('data-tour-lock-open') ?? '';
    const closeAttr =
      document.documentElement.getAttribute('data-tour-lock-close') ?? '';
    const openIds = openAttr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const closeIds = closeAttr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.openLocked = openIds.includes(this.id);
    this.closeLocked = closeIds.includes(this.id);
  }
}
