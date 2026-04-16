export type PackageSize = 'S' | 'M' | 'L';
export type ServiceTier = 'standard' | 'express' | 'priority';
export type SlotId =
  | 'today-morning'
  | 'today-afternoon'
  | 'today-evening'
  | 'tomorrow-morning'
  | 'tomorrow-afternoon'
  | 'tomorrow-evening';

export interface PackageItem {
  id: number;
  label: string;
  size: PackageSize;
  weightKg: number;
}

export interface TimeSlot {
  id: SlotId;
  day: 'Today' | 'Tomorrow';
  window: string;
  available: boolean;
  surge?: boolean;
  waitlist?: boolean;
}

export interface PriceLine {
  label: string;
  amount: number;
  hint?: string;
}

export interface PickupStateShape {
  origin: { address: string; zip: string };
  destination: { address: string; zip: string };
  packages: PackageItem[];
  selectedSlot: SlotId | null;
  tier: ServiceTier;
  joinedWaitlist: SlotId | null;
  confirmed: boolean;
}

const DEFAULT_PACKAGE: PackageItem = {
  id: 1,
  label: 'Warehouse manifest box',
  size: 'M',
  weightKg: 4.2,
};

const SIZE_SURCHARGE: Record<PackageSize, number> = { S: 0, M: 3, L: 8 };
const TIER_MULTIPLIER: Record<ServiceTier, number> = {
  standard: 1,
  express: 1.45,
  priority: 1.9,
};
const TIER_BASE: Record<ServiceTier, number> = {
  standard: 8,
  express: 12,
  priority: 18,
};

const DEFAULT_SLOTS: TimeSlot[] = [
  { id: 'today-morning', day: 'Today', window: '9:00 – 11:00', available: false, waitlist: true },
  { id: 'today-afternoon', day: 'Today', window: '13:00 – 15:00', available: true, surge: true },
  { id: 'today-evening', day: 'Today', window: '17:00 – 19:00', available: true },
  { id: 'tomorrow-morning', day: 'Tomorrow', window: '9:00 – 11:00', available: true },
  { id: 'tomorrow-afternoon', day: 'Tomorrow', window: '13:00 – 15:00', available: true },
  { id: 'tomorrow-evening', day: 'Tomorrow', window: '17:00 – 19:00', available: true },
];

const defaultState = (): PickupStateShape => ({
  origin: { address: '', zip: '' },
  destination: { address: '', zip: '' },
  packages: [structuredClone(DEFAULT_PACKAGE)],
  selectedSlot: null,
  tier: 'standard',
  joinedWaitlist: null,
  confirmed: false,
});

class PickupStateManager {
  private state: PickupStateShape | null = null;
  private slots: TimeSlot[] = DEFAULT_SLOTS.map((s) => ({ ...s }));

  init(): PickupStateShape {
    if (!this.state) {
      this.state = defaultState();
    }
    return this.state;
  }

  get(): PickupStateShape {
    return this.init();
  }

  getSlots(): TimeSlot[] {
    return this.slots;
  }

  setOrigin(address: string, zip: string): void {
    const s = this.init();
    s.origin = { address, zip };
  }

  setDestination(address: string, zip: string): void {
    const s = this.init();
    s.destination = { address, zip };
  }

  addPackage(pkg: Omit<PackageItem, 'id'>): PackageItem {
    const s = this.init();
    const id = (s.packages.at(-1)?.id ?? 0) + 1;
    const created: PackageItem = { id, ...pkg };
    s.packages = [...s.packages, created];
    return created;
  }

  updatePackage(id: number, patch: Partial<Omit<PackageItem, 'id'>>): void {
    const s = this.init();
    s.packages = s.packages.map((p) => (p.id === id ? { ...p, ...patch } : p));
  }

  removePackage(id: number): void {
    const s = this.init();
    s.packages = s.packages.filter((p) => p.id !== id);
  }

  selectSlot(slot: SlotId | null): void {
    const s = this.init();
    s.selectedSlot = slot;
  }

  setTier(tier: ServiceTier): void {
    const s = this.init();
    s.tier = tier;
  }

  joinWaitlist(slot: SlotId): void {
    const s = this.init();
    s.joinedWaitlist = slot;
  }

  clearWaitlist(): void {
    const s = this.init();
    s.joinedWaitlist = null;
  }

  setConfirmed(confirmed: boolean): void {
    const s = this.init();
    s.confirmed = confirmed;
  }

  markSlotAvailable(id: SlotId, available: boolean): void {
    this.slots = this.slots.map((s) => (s.id === id ? { ...s, available } : s));
  }

  reset(): void {
    this.state = null;
    this.slots = DEFAULT_SLOTS.map((s) => ({ ...s }));
  }

  get isActive(): boolean {
    return this.state !== null;
  }
}

export const pickupState = new PickupStateManager();

export function computePriceLines(state: PickupStateShape): PriceLine[] {
  const base = TIER_BASE[state.tier];
  const distanceFee = state.origin.zip && state.destination.zip ? 4.5 : 0;
  const sizeFees = state.packages.reduce((sum, p) => sum + SIZE_SURCHARGE[p.size], 0);
  const surge = state.selectedSlot && state.selectedSlot.startsWith('today-afternoon') ? 2.5 : 0;
  const multiplier = TIER_MULTIPLIER[state.tier];
  const subtotal = (base + distanceFee + sizeFees + surge) * multiplier;

  return [
    { label: 'Base fare', amount: base, hint: `${state.tier} tier` },
    { label: 'Distance fee', amount: distanceFee, hint: distanceFee ? '0–15 km band' : 'enter ZIPs to compute' },
    { label: 'Package surcharge', amount: sizeFees, hint: `${state.packages.length} item(s)` },
    ...(surge ? [{ label: 'Peak-hour surge', amount: surge, hint: 'Today PM slot' }] : []),
    { label: 'Tier multiplier', amount: subtotal - (base + distanceFee + sizeFees + surge), hint: `×${multiplier.toFixed(2)}` },
  ];
}

export function computeTotal(state: PickupStateShape): number {
  return computePriceLines(state).reduce((sum, l) => sum + l.amount, 0);
}
