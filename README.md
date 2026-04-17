# routePilot

**A zero-intrusion guided tour engine for React.**

Build onboarding flows, error recovery wizards, interactive documentation, and contextual help — all without touching your application data or modifying your app code to accommodate the tour.

routePilot runs as a pure overlay. It observes your UI through CSS selectors, manages its own state machine, and tears down cleanly when the tour ends. Your app doesn't know a tour is running.

## Why routePilot?

Most tour libraries force you to wrap components, inject props, or restructure your code around the tour. routePilot takes a different approach:

- **Zero app code changes** — Target elements with `data-tour` attributes or any CSS selector. No wrapper components, no context providers in your app tree, no prop drilling.
- **Never touches real data** — Scoped preparations seed demo state and revert it automatically. Your production data stays untouched.
- **DAG-based navigation** — Steps form a directed acyclic graph with branching, conditional transitions, and hub navigation. Not just linear sequences.
- **Scoped lifecycle management** — Preparations can be scoped to a single step, a group of steps, or the entire tour. Cleanup is automatic.

## Features

- **DAG-based step navigation** — branching, conditional transitions, hub navigation, step picker
- **Scoped preparations** — step, group, or tour-scoped setup/teardown with automatic cleanup
- **Click gating** — block progression until users interact with specific elements
- **Text input validation** — require typed input matching a string or regex before advancing
- **Auto-advance** — timer-based, condition-polling, or trigger-on-interaction
- **Route-aware steps** — auto-navigate, guard against drift, or pause on route mismatch
- **Interactable system** — open, close, and lock modals/drawers during specific steps
- **Spotlight & highlight** — configurable backdrop, multi-element highlighting, custom outlines
- **Inline markup** — `==shimmer==`, `==|pill|==`, and `==|~shimmer pill~|==` in step text
- **Confetti** — celebration effect on tour completion
- **Keyboard navigation** — Arrow keys, Escape to close
- **Conditional steps** — `when` guards to skip steps based on runtime state
- **Lifecycle hooks** — `onEnter`, `onExit`, `onAdvance`, `onRetreat` per step; `onStart`, `onFinish` per tour
- **Shared state** — cross-step `Map` for passing data between steps
- **Event system** — emit/intercept custom events for cross-step communication
- **Dynamic content** — content factories that generate title/body/media from runtime context
- **React 18 & 19** — supports both major versions
- **TypeScript-first** — full type safety with IntelliSense

## Use Cases

- **Onboarding** — Guide users through complex first-time setup flows with click gating and auto-advance.
- **Contextual Help** — Trigger helpful tips based on where the user is in their journey, with conditional step logic.
- **Error Recovery** — Step-by-step resolution flows that accumulate fixes across steps using tour-scoped preparations.
- **Interactive Documentation** — Turn settings pages and complex UIs into self-documenting tours that demonstrate features live.

## Quick Start

```bash
npm install @routepilot/core
```

```tsx
import { GuidedTourProvider, GuidedTourOverlay } from '@routepilot/core';
import '@routepilot/core/tour.css';

function App() {
  return (
    <GuidedTourProvider>
      <GuidedTourOverlay />
      <YourApp />
    </GuidedTourProvider>
  );
}
```

Define a step:

```tsx
import { createStep } from '@routepilot/core';

const welcomeStep = createStep(
  'welcome',
  '/dashboard',
  '[data-tour="main-cta"]',
  'Welcome to the Platform',
  'Click here to create your ==first project==.',
  'bottom',
  {
    click: { all: ['[data-tour="main-cta"]'] },
    autoAdvance: true,
  },
);
```

Launch a tour:

```tsx
const actions = useGuidedTourActions();

await actions.startWithDefinition({
  id: 'onboarding',
  steps: [welcomeStep, secondStep, finishStep],
  confetti: { enabled: true },
});
```

## Project Structure

```
routepilot/
  packages/
    core/             # The library — this is what you install
  apps/
    site/             # Landing page and documentation
    demo/             # Live demo app (embedded in the site via iframe)
```

`packages/core` is the guided tour engine. This is the npm package (`@routepilot/core`) you install in your project.

`apps/site` and `apps/demo` power the project website. The demo app showcases four real-world scenarios — onboarding, FAQ-as-tour, error recovery, and interactive documentation — each running the actual engine against purpose-built mock applications.

## Key Concepts

### Preparations

Setup and teardown logic with automatic lifecycle management:

```tsx
preparations: [{
  id: 'seed-data',
  scope: 'step',     // cleanup when leaving this step
  factory: () => {
    seedDemoData();
    return () => clearDemoData();
  },
}]
```

Scopes: `'step'` (cleanup on exit), `'group'` (cleanup when all sharing steps exit), `'tour'` (cleanup when tour ends).

### Transitions & Branching

Steps can branch conditionally:

```tsx
transitions: [
  { target: 'advanced-flow', condition: (ctx) => isAdvancedUser(), label: 'Advanced' },
  { target: 'beginner-flow', label: 'Beginner' },
]
```

### Hub Navigation

For non-linear tours like FAQs, define a hub step that users return to between branches:

```tsx
navigation: {
  hubNodeId: 'faq-picker',
  hubReturnLabel: 'Back to topics',
  hubAction: 'goToHub',
}
```

### Click Gating & Text Input

Block navigation until the user actually interacts:

```tsx
config: {
  click: { all: ['[data-tour="submit-btn"]'] },
  textInput: { selector: 'input.name', match: /^.{2,}$/ },
  autoAdvance: true,
}
```

### Inline Markup

Highlight key terms in step body text:

- `==text==` — shimmer highlight
- `==|text|==` — pill badge
- `==|~text~|==` — shimmer pill

## Development

```bash
# Install dependencies
npm install

# Start the dev server (site + demo)
npm run dev

# Run tests
npm test

# Build everything
npm run build
```

## License

MIT
