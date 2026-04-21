import {
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Mirror of the shadcn/Radix React tooltip used by @routepilot/assistant-react,
 * rendered with the same `.rp-tooltip-content` CSS classes from the shared
 * `tour-assistant.css`. The element is portalled to <body> via `position: fixed`
 * so it escapes any `overflow: hidden` ancestors inside the tour tooltip, and
 * the side flips from `top` to `bottom` when there is not enough room above.
 */
@Directive({
  selector: '[rpTooltip]',
  standalone: true,
})
export class RpTooltipDirective implements OnDestroy {
  @Input('rpTooltip') content: string | null | undefined = '';
  @Input() rpTooltipDelay = 150;

  private readonly doc = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private tip: HTMLDivElement | null = null;
  private openTimer: number | null = null;
  private closeTimer: number | null = null;
  private reposition = () => this.position();
  private onTipEnter = () => this.cancelClose();
  private onTipLeave = () => this.scheduleHide();

  constructor() {
    this.destroyRef.onDestroy(() => this.hide());
  }

  @HostListener('mouseenter') onEnter() {
    this.cancelClose();
    this.scheduleShow();
  }
  @HostListener('focusin') onFocus() {
    this.cancelClose();
    this.scheduleShow();
  }
  @HostListener('mouseleave') onLeave() {
    this.scheduleHide();
  }
  @HostListener('focusout') onBlur() {
    this.scheduleHide();
  }
  @HostListener('click') onClick() {
    this.hide();
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private scheduleShow() {
    if (!this.content) return;
    if (this.tip || this.openTimer !== null) return;
    this.openTimer = window.setTimeout(() => {
      this.openTimer = null;
      this.show();
    }, this.rpTooltipDelay);
  }

  private scheduleHide() {
    if (this.closeTimer !== null) return;
    this.closeTimer = window.setTimeout(() => {
      this.closeTimer = null;
      this.hide();
    }, 120);
  }

  private cancelClose() {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private show() {
    if (!this.content) return;
    const tip = this.doc.createElement('div');
    tip.className = 'rp-tooltip-content rp-tooltip-content--manual';
    tip.setAttribute('role', 'tooltip');
    tip.setAttribute('data-state', 'instant-open');
    tip.textContent = this.content;

    const arrow = this.doc.createElement('span');
    arrow.className = 'rp-tooltip-arrow';
    tip.appendChild(arrow);

    this.doc.body.appendChild(tip);
    this.tip = tip;

    tip.addEventListener('mouseenter', this.onTipEnter);
    tip.addEventListener('mouseleave', this.onTipLeave);

    this.position();
    window.addEventListener('scroll', this.reposition, true);
    window.addEventListener('resize', this.reposition);
  }

  private position() {
    if (!this.tip) return;
    const trigger = this.host.nativeElement.getBoundingClientRect();
    const tipRect = this.tip.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceAbove = trigger.top - margin;
    const spaceBelow = vh - trigger.bottom - margin;
    const side: 'top' | 'bottom' =
      tipRect.height <= spaceAbove || spaceAbove >= spaceBelow ? 'top' : 'bottom';

    let top =
      side === 'top'
        ? trigger.top - tipRect.height - margin
        : trigger.bottom + margin;
    const maxTop = vh - tipRect.height - 4;
    if (top > maxTop) top = maxTop;
    if (top < 4) top = 4;

    let left = trigger.left;
    const maxLeft = vw - tipRect.width - 4;
    if (left > maxLeft) left = maxLeft;
    if (left < 4) left = 4;

    this.tip.style.top = `${top}px`;
    this.tip.style.left = `${left}px`;
    this.tip.setAttribute('data-side', side);
    this.tip.style.setProperty(
      '--rp-tooltip-origin',
      side === 'top' ? 'center bottom' : 'center top',
    );
  }

  private hide() {
    if (this.openTimer !== null) {
      clearTimeout(this.openTimer);
      this.openTimer = null;
    }
    this.cancelClose();
    if (!this.tip) return;
    this.tip.removeEventListener('mouseenter', this.onTipEnter);
    this.tip.removeEventListener('mouseleave', this.onTipLeave);
    window.removeEventListener('scroll', this.reposition, true);
    window.removeEventListener('resize', this.reposition);
    this.tip.remove();
    this.tip = null;
  }
}
