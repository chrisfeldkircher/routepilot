import { createElement } from 'react';
import type { TourDefinition, StepDefinition } from '@routepilot/core';
import { createStep } from '@routepilot/core';
import { pickupState } from './pickupState';
import faqGifUrl from '../assets/faq_gif.gif';

const PICKUP_ROUTE = '/pickup';

const notify = () => {
  window.dispatchEvent(new CustomEvent('pickup-tour:state-changed'));
};

const seedPickupState = () => {
  pickupState.init();
  notify();
};

const resetPickupState = () => {
  pickupState.reset();
  notify();
};

const setRouteFilled = () => {
  pickupState.setOrigin('1 Market St, Suite 300', '94105');
  pickupState.setDestination('500 Harbor Blvd', '94103');
  notify();
};
const clearRoute = () => {
  pickupState.setOrigin('', '');
  pickupState.setDestination('', '');
  notify();
};

const selectSurgeSlot = () => {
  pickupState.selectSlot('today-afternoon');
  notify();
};
const clearSlot = () => {
  pickupState.selectSlot(null);
  notify();
};

const setTierExpress = () => {
  pickupState.setTier('express');
  notify();
};
const setTierStandard = () => {
  pickupState.setTier('standard');
  notify();
};

const setLargePackage = () => {
  const first = pickupState.get().packages[0];
  if (first) {
    pickupState.updatePackage(first.id, { size: 'L', weightKg: 9.6 });
    notify();
  }
};
const resetFirstPackage = () => {
  const first = pickupState.get().packages[0];
  if (first) {
    pickupState.updatePackage(first.id, { size: 'M', weightKg: 4.2 });
    notify();
  }
};

const joinMorningWaitlist = () => {
  pickupState.joinWaitlist('today-morning');
  notify();
};
const clearWaitlist = () => {
  pickupState.clearWaitlist();
  notify();
};

const faqIntroStep: StepDefinition = {
  id: 'faq-intro',
  route: PICKUP_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Still shipping a wall-of-text FAQ in 2026?',
    body: 'Your users don\'t read it. Your support team copy-pastes from it. Your PM keeps adding to it.\n\nMeanwhile the ==answer== lives ==inside the app== — two clicks and a highlight away. This tour is what an FAQ looks like when it ==actually runs the app== while it explains.\n\nPress ==|Next|== to see your new help center.',
    media: createElement('img', {
      src: faqGifUrl,
      alt: 'When devs still ship a static FAQ in 2026',
      loading: 'eager',
    }),
  },
};

const faqPickerStep: StepDefinition = {
  id: 'faq-picker',
  route: PICKUP_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'FAQs, but they actually use the app',
    body: 'You\'re looking at a ==sub-menu tooltip==. The user clicked a ==high-level help option== on the page (the ==|Browse help topics|== card on the FAQ landing) and the tooltip is now fanning out the ==granular paths== for that topic — right where they are, no redirect to a separate docs site.\n\nBranching uses ==|StepTransition[]|== on a single step. Each transition becomes a button; ==|goTo(target)|== fires when clicked. Same primitive powers policy gates, role-based paths, or experiment arms.\n\nTop-right ==|← Back to FAQ|== replaces the default ==Skip== label. It\'s opt-in per-tour via ==|TourDefinition.navigation|==:\n==|hubReturnLabel: \'← Back to FAQ\'|==\n==|hubAction: \'stop\'|==\n==|stepPickerScope: \'chapter\'|==\n\nUse ==|hubAction: \'stop\'|== when the canonical hub lives ==outside== the tour (like the page-level FAQ landing here). Use ==|hubAction: \'goToHub\'|== with ==|hubNodeId|== when the hub is a step ==inside== the tour. Onboarding tours that want the default ==skip-and-stop== behaviour simply omit the field.',
  },
  transitions: [
    {
      target: 'price-intro',
      label: 'Why does my total keep changing?',
      description: 'Walk through the live price breakdown',
    },
    {
      target: 'slot-intro',
      label: 'My slot is unavailable — what now?',
      description: 'See the waitlist + alternatives flow',
    },
    {
      target: 'flow-intro',
      label: 'How do I book a pickup end-to-end?',
      description: 'Guided happy-path walkthrough',
    },
    {
      target: 'faq-outro',
      label: "I'm good — exit the help tour",
      description: 'Leave the tour',
    },
  ],
};

const priceIntroStep = createStep(
  'price-intro', PICKUP_ROUTE, '[data-tour="price-breakdown"]',
  'Why your total changes',
  'Your total = ==base fare== + ==distance fee== + ==package surcharges== + ==peak surge== × ==tier multiplier==. Each line updates ==live== as you change inputs. Watch.',
  'left',
);

const priceRouteStep = createStep(
  'price-route', PICKUP_ROUTE, '[data-tour="route-section"]',
  'Distance fee depends on ZIPs',
  'We filled the ZIPs for you. Look at ==|Distance fee|== in the breakdown — it went from ==|$0.00|== to a real number. Entering ZIPs unlocks the distance-based component.',
  'bottom',
);
priceRouteStep.preparations = [
  {
    id: 'fill-route',
    scope: 'step',
    factory: async () => {
      setRouteFilled();
      return async () => clearRoute();
    },
  },
];

const pricePackageStep = createStep(
  'price-package', PICKUP_ROUTE, '[data-tour="first-package"]',
  'Size is a surcharge, not a flat fee',
  'We just bumped the package to ==|L|==. The ==|Package surcharge|== line jumped to ==|$8.00|==. Small is free, Medium adds $3, Large adds $8. Stacking multiple parcels stacks the fees.',
  'top',
);
pricePackageStep.preparations = [
  {
    id: 'bump-package-size',
    scope: 'step',
    factory: async () => {
      setLargePackage();
      return async () => resetFirstPackage();
    },
  },
];

const priceTierStep = createStep(
  'price-tier', PICKUP_ROUTE, '[data-tour="tier-section"]',
  'Tier is a multiplier, not additive',
  'Flipping to ==|Express|== applied a ==|×1.45|== multiplier over the subtotal. Priority is ==|×1.90|==. That\'s why the same route can cost ==2x== depending on tier — the multiplier hits every line above.',
  'top',
);
priceTierStep.preparations = [
  {
    id: 'flip-tier',
    scope: 'step',
    factory: async () => {
      setTierExpress();
      return async () => setTierStandard();
    },
  },
];

const priceSurgeStep = createStep(
  'price-surge', PICKUP_ROUTE, '[data-tour="slot-today-afternoon"]',
  'Surge only on flagged slots',
  'We picked the ==|Today afternoon|== slot — it has a ==+surge== badge. A ==|Peak-hour surge|== line just appeared in the breakdown for ==|$2.50|==. Slots without the badge don\'t add this line.',
  'right',
);
priceSurgeStep.preparations = [
  {
    id: 'select-surge-slot',
    scope: 'step',
    factory: async () => {
      selectSurgeSlot();
      return async () => clearSlot();
    },
  },
];

const priceOutroStep: StepDefinition = {
  id: 'price-outro',
  route: PICKUP_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'That\'s the pricing model',
    body: 'Six inputs, one ==formula==. The tour just ==demonstrated== every line by actually mutating the app — no static screenshots, no "refer to section 4.2". If your docs could do this, support volume drops.',
  },
  transitions: [
    { target: 'faq-picker', label: '← Back to questions', description: 'Return to the FAQ picker' },
    { target: 'faq-outro', label: 'Done — exit', description: 'Finish the tour' },
  ],
};

const slotIntroStep = createStep(
  'slot-intro', PICKUP_ROUTE, '[data-tour="slot-today-morning"]',
  'Unavailable slots aren\'t dead ends',
  'This slot is marked ==Unavailable==. That doesn\'t mean "go away" — click it to ==join the waitlist==, or skim the neighbors for an open alternative. Let\'s do both.',
  'right',
);

const slotWaitlistStep = createStep(
  'slot-waitlist', PICKUP_ROUTE, '[data-tour="waitlist-banner"]',
  'Waitlist joined',
  'You\'re now on the waitlist for the morning slot. If it frees up, we text you. The ==banner== below the grid confirms the state. Nothing was emailed yet — the tour intercepts this write.',
  'top',
);
slotWaitlistStep.preparations = [
  {
    id: 'join-waitlist',
    scope: 'step',
    factory: async () => {
      joinMorningWaitlist();
      return async () => clearWaitlist();
    },
  },
];

const slotAlternativeStep = createStep(
  'slot-alternative', PICKUP_ROUTE, '[data-tour="slot-tomorrow-morning"]',
  'Take the next available window',
  'Same time tomorrow works. Grab it and you\'re done — the waitlist stays active as a fallback. ==Two parallel paths== from one dead-end, both unblocked in under 15 seconds.',
  'top',
);

const slotOutroStep: StepDefinition = {
  id: 'slot-outro',
  route: PICKUP_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'No more "contact support"',
    body: 'That entire flow — read the badge, join the waitlist, pick an alternative — lives in the ==tour itself==. The user saw it happen, in their app, with their data model. They don\'t need a human.',
  },
  transitions: [
    { target: 'faq-picker', label: '← Back to questions', description: 'Return to the FAQ picker' },
    { target: 'faq-outro', label: 'Done — exit', description: 'Finish the tour' },
  ],
};

const flowIntroStep: StepDefinition = {
  id: 'flow-intro',
  route: PICKUP_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Happy path in four steps',
    body: '1. Route. 2. Packages. 3. Slot. 4. Tier. That\'s it. Every other screen element is a ==detail== this tour will narrate as we go.',
  },
};

const flowRouteStep = createStep(
  'flow-route', PICKUP_ROUTE, '[data-tour="route-section"]',
  '1 — Route',
  'Origin + destination ZIPs unlock the ==distance fee==. Addresses are for the courier; ZIPs are for pricing.',
  'bottom',
);
flowRouteStep.preparations = [
  {
    id: 'flow-fill-route',
    scope: 'step',
    factory: async () => {
      setRouteFilled();
      return async () => clearRoute();
    },
  },
];

const flowPackageStep = createStep(
  'flow-package', PICKUP_ROUTE, '[data-tour="packages-section"]',
  '2 — Packages',
  'Default is a Medium parcel. Add more with ==|+ Add package|==, switch sizes inline. Surcharges stack per item.',
  'top',
);

const flowSlotStep = createStep(
  'flow-slot', PICKUP_ROUTE, '[data-tour="slots-section"]',
  '3 — Slot',
  'Six windows across 48h. Greyed ones are full (waitlist available). Orange badge means ==surge pricing==.',
  'top',
);

const flowTierStep = createStep(
  'flow-tier', PICKUP_ROUTE, '[data-tour="tier-section"]',
  '4 — Tier',
  'Standard for "whenever today", Express for "within the hour", Priority for "ten minutes ago". Tier multiplies the subtotal.',
  'top',
);

const flowConfirmStep = createStep(
  'flow-confirm', PICKUP_ROUTE, '[data-tour="confirm-btn"]',
  'Lock it in',
  'The ==|Confirm pickup|== button enables once a slot is selected. In production, this POSTs the booking. Here, the engine intercepts — nothing leaves the browser.',
  'left',
);

const flowOutroStep: StepDefinition = {
  id: 'flow-outro',
  route: PICKUP_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'That\'s the whole flow',
    body: 'Four sections, one price breakdown, one confirm. Any user who saw this tour can finish a real booking in under a minute.',
  },
  transitions: [
    { target: 'faq-picker', label: '← Back to questions', description: 'Return to the FAQ picker' },
    { target: 'faq-outro', label: 'Done — exit', description: 'Finish the tour' },
  ],
};

const faqOutroStep: StepDefinition = {
  id: 'faq-outro',
  route: PICKUP_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'One tour, many answers',
    body: 'Every FAQ you just saw is a ==branch== off a single ==|TourDefinition|==. Ship one definition, route users by question, ==deflect tickets== before they\'re filed.\n\nThe ==same engine== that onboarded them also unblocks them ==months later==.',
  },
};

const allSteps: StepDefinition[] = [
  faqIntroStep,
  faqPickerStep,
  priceIntroStep,
  priceRouteStep,
  pricePackageStep,
  priceTierStep,
  priceSurgeStep,
  priceOutroStep,
  slotIntroStep,
  slotWaitlistStep,
  slotAlternativeStep,
  slotOutroStep,
  flowIntroStep,
  flowRouteStep,
  flowPackageStep,
  flowSlotStep,
  flowTierStep,
  flowConfirmStep,
  flowOutroStep,
  faqOutroStep,
];

faqPickerStep.preparations = [
  ...(faqPickerStep.preparations ?? []),
  {
    id: 'pickup-seed',
    scope: 'tour',
    sharedWith: allSteps.filter((s) => s.id !== 'faq-picker').map((s) => s.id),
    factory: async () => {
      seedPickupState();
      return async () => resetPickupState();
    },
  },
];

const withChapter = (steps: StepDefinition[], chapter: string): StepDefinition[] =>
  steps.map((s) => ({ ...s, chapter: s.chapter ?? chapter }));

export const pickupFaqTour: TourDefinition = {
  id: 'pickup-faq',
  name: 'ParcelRelay — FAQ as interactive tour',
  description: 'Branching FAQ tour demonstrating in-app self-service',
  navigation: {
    hubReturnLabel: '← Back to FAQ',
    hubAction: 'stop',
    stepPickerScope: 'chapter',
  },
  onStart: () => {
    seedPickupState();
  },
  onFinish: () => {
    resetPickupState();
  },
  steps: [
    ...withChapter([faqIntroStep, faqPickerStep], 'Help'),
    ...withChapter(
      [priceIntroStep, priceRouteStep, pricePackageStep, priceTierStep, priceSurgeStep, priceOutroStep],
      'FAQ — Pricing',
    ),
    ...withChapter(
      [slotIntroStep, slotWaitlistStep, slotAlternativeStep, slotOutroStep],
      'FAQ — Availability',
    ),
    ...withChapter(
      [flowIntroStep, flowRouteStep, flowPackageStep, flowSlotStep, flowTierStep, flowConfirmStep, flowOutroStep],
      'FAQ — End-to-end',
    ),
    ...withChapter([faqOutroStep], 'Done'),
  ],
};
