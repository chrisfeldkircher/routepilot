import { useEffect, useState } from 'react';
import { useGuidedTourActions, useGuidedTourState } from '@routepilot/react';
import {
  pickupState,
  computePriceLines,
  computeTotal,
  type PackageSize,
  type ServiceTier,
  type SlotId,
} from './pickupState';
import { pickupFaqTour } from './pickupTour';

type FaqCard = {
  nodeId: string;
  eyebrow: string;
  title: string;
  description?: string;
  variant?: 'hub' | 'deep-link';
};

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

const PICKUP_EVENT = 'pickup-tour:state-changed';

const notify = () => {
  window.dispatchEvent(new CustomEvent(PICKUP_EVENT));
};

const TOUR_ACTIVE_STATUSES = new Set(['preparing', 'running', 'paused']);

export default function PickupPage() {
  const state = useGuidedTourState();
  const pickupTourActive =
    state.tourId === pickupFaqTour.id && TOUR_ACTIVE_STATUSES.has(state.status);

  return pickupTourActive ? <PickupAppView /> : <FaqLandingView />;
}

function FaqLandingView() {
  const tourActions = useGuidedTourActions();

  const launchFaq = (nodeId: string) => {
    void tourActions.startWithDefinition(pickupFaqTour, { startNodeId: nodeId });
  };

  return (
    <div className="faq-landing-page">
      <header className="faq-landing-hero">
        <span className="faq-landing-eyebrow">ParcelRelay · Help Center</span>
        <h1>How can we help?</h1>
        <p>
          Quick answers for the courier pickup flow. Click a question and instead of reading a
          doc, the app itself walks you through the answer.
        </p>
        <div className="faq-landing-search" aria-hidden="true">
          <span className="faq-landing-search-icon">🔍</span>
          <span className="faq-landing-search-placeholder">
            Try "why is my total different from the estimate"…
          </span>
          <span className="faq-landing-search-shortcut">⌘ K</span>
        </div>
      </header>

      <section className="faq-landing-grid">
        {FAQ_CARDS.map((card) => (
          <button
            key={card.nodeId}
            type="button"
            className={`pickup-faq-card pickup-faq-card-${card.variant}`}
            onClick={() => launchFaq(card.nodeId)}
          >
            <span className="pickup-faq-eyebrow">{card.eyebrow}</span>
            <span className="pickup-faq-title">{card.title}</span>
            {card.description && (
              <span className="pickup-faq-description">{card.description}</span>
            )}
            <span className="pickup-faq-cta">
              {card.variant === 'hub' ? 'Open sub-menu' : 'Walk me through it'}
              <span aria-hidden="true">→</span>
            </span>
          </button>
        ))}
      </section>

      <footer className="faq-landing-footnote">
        <p>
          Under the hood: each card calls{' '}
          <code>startWithDefinition(pickupFaqTour, &#123; startNodeId &#125;)</code>. The hub
          card lands on <code>faq-picker</code> (sub-menu tooltip pattern); the others jump
          straight into their chapter intro step. Closing a tour returns you here.
        </p>
      </footer>
    </div>
  );
}

function PickupAppView() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener(PICKUP_EVENT, handler);
    return () => window.removeEventListener(PICKUP_EVENT, handler);
  }, []);

  useEffect(() => {
    pickupState.init();
    notify();
    return () => {
      pickupState.reset();
    };
  }, []);

  const state = pickupState.get();
  const slots = pickupState.getSlots();
  const priceLines = computePriceLines(state);
  const total = computeTotal(state);

  const setOriginField = (field: 'address' | 'zip', value: string) => {
    pickupState.setOrigin(
      field === 'address' ? value : state.origin.address,
      field === 'zip' ? value : state.origin.zip,
    );
    notify();
  };
  const setDestField = (field: 'address' | 'zip', value: string) => {
    pickupState.setDestination(
      field === 'address' ? value : state.destination.address,
      field === 'zip' ? value : state.destination.zip,
    );
    notify();
  };

  const updatePackage = (id: number, patch: { size?: PackageSize; weightKg?: number; label?: string }) => {
    pickupState.updatePackage(id, patch);
    notify();
  };
  const addPackage = () => {
    pickupState.addPackage({ label: 'Additional parcel', size: 'S', weightKg: 1.8 });
    notify();
  };
  const removePackage = (id: number) => {
    pickupState.removePackage(id);
    notify();
  };

  const selectSlot = (id: SlotId) => {
    const slot = slots.find((s) => s.id === id);
    if (!slot?.available) return;
    pickupState.selectSlot(id);
    notify();
  };

  const joinWaitlist = (id: SlotId) => {
    pickupState.joinWaitlist(id);
    notify();
  };

  const setTier = (tier: ServiceTier) => {
    pickupState.setTier(tier);
    notify();
  };

  const confirm = () => {
    pickupState.setConfirmed(true);
    notify();
  };

  return (
    <div className="pickup-page">
      <div className="pickup-hero" data-tour="pickup-hero">
        <div>
          <span className="pickup-eyebrow">ParcelRelay · Courier Pickup</span>
          <h2>Schedule a pickup</h2>
          <p>Enter the route, add your parcels, and pick a time. Your total updates as you go.</p>
        </div>
        <div className="pickup-total-card" data-tour="price-summary">
          <span className="pickup-total-label">Estimated total</span>
          <span className="pickup-total-value" data-tour="price-total">${total.toFixed(2)}</span>
          <span className="pickup-total-hint">USD · incl. tier multiplier</span>
        </div>
      </div>

      <div className="pickup-grid">
        <div className="pickup-main">
          <section className="card pickup-section" data-tour="route-section">
            <header className="pickup-section-header">
              <h3>Route</h3>
              <span className="pickup-section-hint">Pickup → drop-off</span>
            </header>
            <div className="pickup-route-grid">
              <div>
                <label className="pickup-label">Origin address</label>
                <input
                  className="form-input"
                  data-tour="origin-address"
                  placeholder="1 Market St, Suite 300"
                  value={state.origin.address}
                  onChange={(e) => setOriginField('address', e.target.value)}
                />
                <input
                  className="form-input pickup-zip"
                  data-tour="origin-zip"
                  placeholder="ZIP"
                  value={state.origin.zip}
                  onChange={(e) => setOriginField('zip', e.target.value)}
                />
              </div>
              <div>
                <label className="pickup-label">Destination address</label>
                <input
                  className="form-input"
                  data-tour="dest-address"
                  placeholder="500 Harbor Blvd"
                  value={state.destination.address}
                  onChange={(e) => setDestField('address', e.target.value)}
                />
                <input
                  className="form-input pickup-zip"
                  data-tour="dest-zip"
                  placeholder="ZIP"
                  value={state.destination.zip}
                  onChange={(e) => setDestField('zip', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="card pickup-section" data-tour="packages-section">
            <header className="pickup-section-header">
              <h3>Packages</h3>
              <button className="btn btn-sm" data-tour="add-package" onClick={addPackage}>
                + Add package
              </button>
            </header>
            <div className="pickup-package-list">
              {state.packages.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  className="pickup-package-row"
                  data-tour={idx === 0 ? 'first-package' : undefined}
                >
                  <input
                    className="form-input pickup-package-label"
                    value={pkg.label}
                    onChange={(e) => updatePackage(pkg.id, { label: e.target.value })}
                  />
                  <div className="pickup-size-picker" data-tour={idx === 0 ? 'first-package-size' : undefined}>
                    {(['S', 'M', 'L'] as const).map((size) => (
                      <button
                        key={size}
                        className={`pickup-size-btn ${pkg.size === size ? 'pickup-size-btn-active' : ''}`}
                        data-tour={idx === 0 ? `first-package-size-${size}` : undefined}
                        onClick={() => updatePackage(pkg.id, { size })}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input pickup-weight"
                    value={pkg.weightKg}
                    onChange={(e) => updatePackage(pkg.id, { weightKg: Number(e.target.value) || 0 })}
                  />
                  <span className="pickup-unit">kg</span>
                  {state.packages.length > 1 && (
                    <button
                      className="btn-icon-sm"
                      aria-label="Remove package"
                      onClick={() => removePackage(pkg.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="card pickup-section" data-tour="slots-section">
            <header className="pickup-section-header">
              <h3>Pickup window</h3>
              <span className="pickup-section-hint">6 slots over the next 48h</span>
            </header>
            <div className="pickup-slot-grid">
              {slots.map((slot) => {
                const isSelected = state.selectedSlot === slot.id;
                const isWaitlisted = state.joinedWaitlist === slot.id;
                return (
                  <button
                    key={slot.id}
                    className={[
                      'pickup-slot',
                      !slot.available ? 'pickup-slot-unavailable' : '',
                      isSelected ? 'pickup-slot-selected' : '',
                      slot.surge ? 'pickup-slot-surge' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-tour={`slot-${slot.id}`}
                    onClick={() =>
                      slot.available ? selectSlot(slot.id) : joinWaitlist(slot.id)
                    }
                  >
                    <span className="pickup-slot-day">{slot.day}</span>
                    <span className="pickup-slot-window">{slot.window}</span>
                    {!slot.available && (
                      <span className="pickup-slot-badge pickup-slot-badge-soldout">
                        {isWaitlisted ? 'On waitlist' : 'Unavailable'}
                      </span>
                    )}
                    {slot.surge && slot.available && (
                      <span className="pickup-slot-badge pickup-slot-badge-surge">+surge</span>
                    )}
                  </button>
                );
              })}
            </div>
            {state.joinedWaitlist && (
              <div className="pickup-waitlist-banner" data-tour="waitlist-banner">
                <span>⏱</span>
                <div>
                  <strong>You're on the waitlist</strong>
                  <p>
                    We'll text you if the <code>{state.joinedWaitlist.replace('-', ' ')}</code> slot frees up.
                    Until then, consider an alternative below.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="card pickup-section" data-tour="tier-section">
            <header className="pickup-section-header">
              <h3>Service tier</h3>
              <span className="pickup-section-hint">Changes your price instantly</span>
            </header>
            <div className="pickup-tier-row">
              {(['standard', 'express', 'priority'] as const).map((tier) => (
                <button
                  key={tier}
                  className={`pickup-tier ${state.tier === tier ? 'pickup-tier-active' : ''}`}
                  data-tour={`tier-${tier}`}
                  onClick={() => setTier(tier)}
                >
                  <span className="pickup-tier-name">{tier}</span>
                  <span className="pickup-tier-eta">
                    {tier === 'standard' ? '≤ 90 min' : tier === 'express' ? '≤ 45 min' : '≤ 20 min'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="pickup-sidebar">
          <div className="card pickup-section" data-tour="price-breakdown">
            <header className="pickup-section-header">
              <h3>Price breakdown</h3>
            </header>
            <div className="pickup-price-lines">
              {priceLines.map((line) => (
                <div
                  key={line.label}
                  className="pickup-price-line"
                  data-tour={`price-line-${line.label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
                >
                  <div>
                    <span className="pickup-price-label">{line.label}</span>
                    {line.hint && <span className="pickup-price-hint">{line.hint}</span>}
                  </div>
                  <span className="pickup-price-amount">${line.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="pickup-price-line pickup-price-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary pickup-confirm"
            data-tour="confirm-btn"
            disabled={!state.selectedSlot}
            onClick={confirm}
          >
            {state.confirmed ? 'Pickup confirmed ✓' : 'Confirm pickup'}
          </button>
          {!state.selectedSlot && (
            <p className="pickup-disabled-hint">Pick a time slot to continue.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
