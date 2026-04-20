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

export interface LockState {
  openLocked: boolean;
  closeLocked: boolean;
}

/**
 * Tracks interactable lock state for a given id.
 *
 * Usage:
 * ```html
 * <div [rpTourInteractableLocks]="'my-dropdown'" (lockStateChange)="onLocks($event)">
 * ```
 */
@Directive({
  selector: '[rpTourInteractableLocks]',
  standalone: true,
  exportAs: 'rpTourInteractableLocks',
})
export class TourInteractableLocksDirective implements OnInit, OnDestroy, OnChanges {
  @Input('rpTourInteractableLocks') id = '';
  @Output() lockStateChange = new EventEmitter<LockState>();

  openLocked = false;
  closeLocked = false;

  private observer: MutationObserver | null = null;

  ngOnInit(): void {
    this.setupObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id']) {
      this.read();
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private setupObserver(): void {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

    this.read();

    this.observer = new MutationObserver(() => this.read());
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-tour-lock-open', 'data-tour-lock-close'],
    });
  }

  private read(): void {
    if (typeof document === 'undefined') return;
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

    const newOpen = openIds.includes(this.id);
    const newClose = closeIds.includes(this.id);

    if (newOpen !== this.openLocked || newClose !== this.closeLocked) {
      this.openLocked = newOpen;
      this.closeLocked = newClose;
      this.lockStateChange.emit({ openLocked: newOpen, closeLocked: newClose });
    }
  }
}
