import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GuidedTourService } from '@routepilot/angular';
import {
  pickupState,
  computePriceLines,
  computeTotal,
  type PickupStateShape,
  type TimeSlot,
  type PriceLine,
  type ServiceTier,
  type SlotId,
  type PackageSize,
} from '../state/pickupState';
import { faqTour } from '../tours/faq.tour';

const PICKUP_EVENT = 'pickup-tour:state-changed';
const TOUR_ACTIVE_STATUSES = new Set(['preparing', 'running', 'paused']);

interface FaqCard {
  nodeId: string;
  eyebrow: string;
  title: string;
  description?: string;
  variant?: 'hub' | 'deep-link';
}

const FAQ_CARDS: FaqCard[] = [
  {
    nodeId: 'faq-intro',
    eyebrow: 'Not sure where to start?',
    title: 'Browse help topics',
    description:
      'Opens a sub-menu tooltip right here in the app — same pattern a high-level FAQ button would use on a landing page.',
    variant: 'hub',
  },
  {
    nodeId: 'price-intro',
    eyebrow: 'Pricing',
    title: 'Why does my total keep changing?',
    variant: 'deep-link',
  },
  {
    nodeId: 'slot-intro',
    eyebrow: 'Availability',
    title: 'My slot is unavailable — what now?',
    variant: 'deep-link',
  },
  {
    nodeId: 'flow-intro',
    eyebrow: 'End-to-end',
    title: 'How do I book a pickup?',
    variant: 'deep-link',
  },
];

@Component({
  selector: 'app-pickup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="!pickupTourActive; else appView">
      <div class="faq-landing-page">
        <header class="faq-landing-hero">
          <span class="faq-landing-eyebrow">ParcelRelay · Help Center</span>
          <h1>How can we help?</h1>
          <p>
            Quick answers for the courier pickup flow. Click a question and instead of reading a
            doc, the app itself walks you through the answer.
          </p>
          <div class="faq-landing-search" aria-hidden="true">
            <span class="faq-landing-search-icon"><span class="material-symbols-outlined">search</span></span>
            <span class="faq-landing-search-placeholder">
              Try "why is my total different from the estimate"…
            </span>
            <span class="faq-landing-search-shortcut">⌘ K</span>
          </div>
        </header>

        <section class="faq-landing-grid">
          <button
            *ngFor="let card of faqCards"
            type="button"
            class="pickup-faq-card"
            [class]="'pickup-faq-card pickup-faq-card-' + card.variant"
            (click)="launchFaq(card.nodeId)"
          >
            <span class="pickup-faq-eyebrow">{{ card.eyebrow }}</span>
            <span class="pickup-faq-title">{{ card.title }}</span>
            <span *ngIf="card.description" class="pickup-faq-description">
              {{ card.description }}
            </span>
            <span class="pickup-faq-cta">
              {{ card.variant === 'hub' ? 'Open sub-menu' : 'Walk me through it' }}
              <span aria-hidden="true">→</span>
            </span>
          </button>
        </section>

        <footer class="faq-landing-footnote">
          <p>
            Under the hood: each card calls
            <code>startWithDefinition(faqTour, &#123; startNodeId &#125;)</code>. The hub
            card lands on <code>faq-picker</code> (sub-menu tooltip pattern); the others jump
            straight into their chapter intro step. Closing a tour returns you here.
          </p>
        </footer>
      </div>
    </ng-container>

    <ng-template #appView>
      <div class="pickup-page">
        <div class="pickup-hero" data-tour="pickup-hero">
          <div>
            <span class="pickup-eyebrow">ParcelRelay · Courier Pickup</span>
            <h2>Schedule a pickup</h2>
            <p>Enter the route, add your parcels, and pick a time. Your total updates as you go.</p>
          </div>
          <div class="pickup-total-card" data-tour="price-summary">
            <span class="pickup-total-label">Estimated total</span>
            <span class="pickup-total-value" data-tour="price-total">\${{ total.toFixed(2) }}</span>
            <span class="pickup-total-hint">USD · incl. tier multiplier</span>
          </div>
        </div>

        <div class="pickup-grid">
          <div class="pickup-main">
            <section class="card pickup-section" data-tour="route-section">
              <header class="pickup-section-header">
                <h3>Route</h3>
                <span class="pickup-section-hint">Pickup → drop-off</span>
              </header>
              <div class="pickup-route-grid">
                <div>
                  <label class="pickup-label">Origin address</label>
                  <input
                    class="form-input"
                    data-tour="origin-address"
                    placeholder="1 Market St, Suite 300"
                    [value]="state.origin.address"
                    (input)="setOriginField('address', $event)"
                  />
                  <input
                    class="form-input pickup-zip"
                    data-tour="origin-zip"
                    placeholder="ZIP"
                    [value]="state.origin.zip"
                    (input)="setOriginField('zip', $event)"
                  />
                </div>
                <div>
                  <label class="pickup-label">Destination address</label>
                  <input
                    class="form-input"
                    data-tour="dest-address"
                    placeholder="500 Harbor Blvd"
                    [value]="state.destination.address"
                    (input)="setDestField('address', $event)"
                  />
                  <input
                    class="form-input pickup-zip"
                    data-tour="dest-zip"
                    placeholder="ZIP"
                    [value]="state.destination.zip"
                    (input)="setDestField('zip', $event)"
                  />
                </div>
              </div>
            </section>

            <section class="card pickup-section" data-tour="packages-section">
              <header class="pickup-section-header">
                <h3>Packages</h3>
                <button class="btn btn-sm" data-tour="add-package" (click)="addPackage()">
                  + Add package
                </button>
              </header>
              <div class="pickup-package-list">
                <div
                  *ngFor="let pkg of state.packages; let i = index"
                  class="pickup-package-row"
                  [attr.data-tour]="i === 0 ? 'first-package' : null"
                >
                  <input
                    class="form-input pickup-package-label"
                    [value]="pkg.label"
                    (input)="updatePackageLabel(pkg.id, $event)"
                  />
                  <div
                    class="pickup-size-picker"
                    [attr.data-tour]="i === 0 ? 'first-package-size' : null"
                  >
                    <button
                      *ngFor="let size of packageSizes"
                      class="pickup-size-btn"
                      [class.pickup-size-btn-active]="pkg.size === size"
                      [attr.data-tour]="i === 0 ? 'first-package-size-' + size : null"
                      (click)="updatePackageSize(pkg.id, size)"
                    >
                      {{ size }}
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    class="form-input pickup-weight"
                    [value]="pkg.weightKg"
                    (input)="updatePackageWeight(pkg.id, $event)"
                  />
                  <span class="pickup-unit">kg</span>
                  <button
                    *ngIf="state.packages.length > 1"
                    class="btn-icon-sm"
                    aria-label="Remove package"
                    (click)="removePackage(pkg.id)"
                  >
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
            </section>

            <section class="card pickup-section" data-tour="slots-section">
              <header class="pickup-section-header">
                <h3>Pickup window</h3>
                <span class="pickup-section-hint">6 slots over the next 48h</span>
              </header>
              <div class="pickup-slot-grid">
                <button
                  *ngFor="let slot of slots"
                  [class]="slotClasses(slot)"
                  [attr.data-tour]="'slot-' + slot.id"
                  (click)="onSlotClick(slot)"
                >
                  <span class="pickup-slot-day">{{ slot.day }}</span>
                  <span class="pickup-slot-window">{{ slot.window }}</span>
                  <span
                    *ngIf="!slot.available"
                    class="pickup-slot-badge pickup-slot-badge-soldout"
                  >
                    {{ state.joinedWaitlist === slot.id ? 'On waitlist' : 'Unavailable' }}
                  </span>
                  <span
                    *ngIf="slot.surge && slot.available"
                    class="pickup-slot-badge pickup-slot-badge-surge"
                  >
                    +surge
                  </span>
                </button>
              </div>
              <div
                *ngIf="state.joinedWaitlist"
                class="pickup-waitlist-banner"
                data-tour="waitlist-banner"
              >
                <span>⏱</span>
                <div>
                  <strong>You're on the waitlist</strong>
                  <p>
                    We'll text you if the <code>{{ waitlistLabel }}</code> slot frees up.
                    Until then, consider an alternative below.
                  </p>
                </div>
              </div>
            </section>

            <section class="card pickup-section" data-tour="tier-section">
              <header class="pickup-section-header">
                <h3>Service tier</h3>
                <span class="pickup-section-hint">Changes your price instantly</span>
              </header>
              <div class="pickup-tier-row">
                <button
                  *ngFor="let tier of tiers"
                  class="pickup-tier"
                  [class.pickup-tier-active]="state.tier === tier"
                  [attr.data-tour]="'tier-' + tier"
                  (click)="setTier(tier)"
                >
                  <span class="pickup-tier-name">{{ tier }}</span>
                  <span class="pickup-tier-eta">{{ tierEta(tier) }}</span>
                </button>
              </div>
            </section>
          </div>

          <aside class="pickup-sidebar">
            <div class="card pickup-section" data-tour="price-breakdown">
              <header class="pickup-section-header">
                <h3>Price breakdown</h3>
              </header>
              <div class="pickup-price-lines">
                <div
                  *ngFor="let line of priceLines"
                  class="pickup-price-line"
                  [attr.data-tour]="'price-line-' + priceLineKey(line.label)"
                >
                  <div>
                    <span class="pickup-price-label">{{ line.label }}</span>
                    <span *ngIf="line.hint" class="pickup-price-hint">{{ line.hint }}</span>
                  </div>
                  <span class="pickup-price-amount">\${{ line.amount.toFixed(2) }}</span>
                </div>
                <div class="pickup-price-line pickup-price-total">
                  <span>Total</span>
                  <span>\${{ total.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <button
              class="btn btn-primary pickup-confirm"
              data-tour="confirm-btn"
              [disabled]="!state.selectedSlot"
              (click)="confirm()"
            >
              {{ state.confirmed ? 'Pickup confirmed ✓' : 'Confirm pickup' }}
            </button>
            <p *ngIf="!state.selectedSlot" class="pickup-disabled-hint">
              Pick a time slot to continue.
            </p>
          </aside>
        </div>
      </div>
    </ng-template>
  `,
})
export class PickupComponent implements OnInit, OnDestroy {
  state: PickupStateShape = pickupState.get();
  slots: TimeSlot[] = pickupState.getSlots();
  priceLines: PriceLine[] = [];
  total = 0;
  pickupTourActive = false;

  readonly tiers: ServiceTier[] = ['standard', 'express', 'priority'];
  readonly packageSizes: PackageSize[] = ['S', 'M', 'L'];
  readonly faqCards = FAQ_CARDS;

  private listener = () => this.sync();
  private sub?: Subscription;

  constructor(
    private cdr: ChangeDetectorRef,
    private tour: GuidedTourService,
  ) {}

  ngOnInit(): void {
    this.sub = this.tour.state$.subscribe((snap) => {
      const active = snap.tourId === faqTour.id && TOUR_ACTIVE_STATUSES.has(snap.status);
      if (active !== this.pickupTourActive) {
        this.pickupTourActive = active;
        if (active) {
          pickupState.init();
          this.sync();
        }
        this.cdr.markForCheck();
      }
    });
    window.addEventListener(PICKUP_EVENT, this.listener);
  }

  ngOnDestroy(): void {
    window.removeEventListener(PICKUP_EVENT, this.listener);
    this.sub?.unsubscribe();
    pickupState.reset();
  }

  get waitlistLabel(): string {
    return this.state.joinedWaitlist ? this.state.joinedWaitlist.replace('-', ' ') : '';
  }

  slotClasses(slot: TimeSlot): string {
    const isSelected = this.state.selectedSlot === slot.id;
    return [
      'pickup-slot',
      !slot.available ? 'pickup-slot-unavailable' : '',
      isSelected ? 'pickup-slot-selected' : '',
      slot.surge ? 'pickup-slot-surge' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  tierEta(tier: ServiceTier): string {
    return tier === 'standard' ? '≤ 90 min' : tier === 'express' ? '≤ 45 min' : '≤ 20 min';
  }

  priceLineKey(label: string): string {
    return label.toLowerCase().replace(/[^a-z]+/g, '-');
  }

  launchFaq(nodeId: string): void {
    void this.tour.actions.startWithDefinition(faqTour, { startNodeId: nodeId });
  }

  setOriginField(field: 'address' | 'zip', ev: Event): void {
    const value = (ev.target as HTMLInputElement).value;
    pickupState.setOrigin(
      field === 'address' ? value : this.state.origin.address,
      field === 'zip' ? value : this.state.origin.zip,
    );
    this.notify();
  }

  setDestField(field: 'address' | 'zip', ev: Event): void {
    const value = (ev.target as HTMLInputElement).value;
    pickupState.setDestination(
      field === 'address' ? value : this.state.destination.address,
      field === 'zip' ? value : this.state.destination.zip,
    );
    this.notify();
  }

  addPackage(): void {
    pickupState.addPackage({ label: 'Additional parcel', size: 'S', weightKg: 1.8 });
    this.notify();
  }

  removePackage(id: number): void {
    pickupState.removePackage(id);
    this.notify();
  }

  updatePackageLabel(id: number, ev: Event): void {
    pickupState.updatePackage(id, { label: (ev.target as HTMLInputElement).value });
    this.notify();
  }

  updatePackageSize(id: number, size: PackageSize): void {
    pickupState.updatePackage(id, { size });
    this.notify();
  }

  updatePackageWeight(id: number, ev: Event): void {
    const num = Number((ev.target as HTMLInputElement).value) || 0;
    pickupState.updatePackage(id, { weightKg: num });
    this.notify();
  }

  onSlotClick(slot: TimeSlot): void {
    if (slot.available) {
      pickupState.selectSlot(slot.id);
    } else {
      pickupState.joinWaitlist(slot.id as SlotId);
    }
    this.notify();
  }

  setTier(tier: ServiceTier): void {
    pickupState.setTier(tier);
    this.notify();
  }

  confirm(): void {
    pickupState.setConfirmed(true);
    this.notify();
  }

  private notify(): void {
    window.dispatchEvent(new CustomEvent(PICKUP_EVENT));
  }

  private sync(): void {
    this.state = pickupState.get();
    this.slots = pickupState.getSlots();
    this.priceLines = computePriceLines(this.state);
    this.total = computeTotal(this.state);
    this.cdr.markForCheck();
  }
}
