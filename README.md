# routePilot

**A zero-intrusion guided tour engine for the web.**

[![CI](https://github.com/chrisfeldkircher/routepilot/actions/workflows/ci.yml/badge.svg)](https://github.com/chrisfeldkircher/routepilot/actions/workflows/ci.yml)
[![Documentation](https://img.shields.io/badge/docs-routepilot.dev%2Fdocs-7c8cff?style=flat-square)](https://routepilot.dev/docs)
[![Angular Example](https://img.shields.io/badge/example-angular-0f6cbd?style=flat-square)](https://github.com/chrisfeldkircher/routepilot/tree/main/examples/angular)

Build onboarding flows, error recovery wizards, interactive documentation, and contextual help — all without touching your application data or modifying your app code to accommodate the tour.

routePilot runs as a pure overlay. It observes your UI through CSS selectors, manages its own state machine, and tears down cleanly when the tour ends. Your app doesn't know a tour is running. The core engine (`@routepilot/engine`) is fully framework-agnostic — framework packages provide thin UI bindings on top.

## Packages

- **`@routepilot/engine`** — framework-agnostic core: state machine, DAG navigation, preparations, shared types, bridges, and CSS.
- **`@routepilot/react`** — React bindings: provider, overlay, hooks, and React-first integration helpers.
- **`@routepilot/angular`** — Angular bindings: service, overlay component, router adapter, directives, and Angular-first integration helpers.

## Documentation

The canonical documentation lives here:

- **Docs:** [routepilot.dev/docs](https://routepilot.dev/docs)
- **Angular example:** [examples/angular](https://github.com/chrisfeldkircher/routepilot/tree/main/examples/angular)
- **Website/docs source:** [apps/site](https://github.com/chrisfeldkircher/routepilot/tree/main/apps/site)
- **Live demo source:** [apps/demo](https://github.com/chrisfeldkircher/routepilot/tree/main/apps/demo)

## Framework Support

| Framework | Package                | Status  |
| --------- | ---------------------- | ------- |
| React     | `@routepilot/react`    | Stable  |
| Angular   | `@routepilot/angular`  | Stable  |
| Vue       | —                      | Planned |
| Svelte    | —                      | Planned |

## Why routePilot?

Most tour libraries force you to wrap components, inject props, or restructure your code around the tour. routePilot takes a different approach:

- **Zero app code changes** — Target elements with `data-tour` attributes or any CSS selector. No wrapper components, no prop drilling.
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
- **TypeScript-first** — full type safety with IntelliSense

## Use Cases

- **Onboarding** — Guide users through complex first-time setup flows with click gating and auto-advance.
- **Contextual Help** — Trigger helpful tips based on where the user is in their journey, with conditional step logic.
- **Error Recovery** — Step-by-step resolution flows that accumulate fixes across steps using tour-scoped preparations.
- **Interactive Documentation** — Turn settings pages and complex UIs into self-documenting tours that demonstrate features live.

## Quick Start

### React

```bash
npm install @routepilot/engine @routepilot/react
```

```tsx
import { GuidedTourProvider, GuidedTourOverlay } from '@routepilot/react';
import '@routepilot/engine/tour.css';

function App() {
  return (
    <GuidedTourProvider>
      <GuidedTourOverlay />
      <YourApp />
    </GuidedTourProvider>
  );
}
```

### Angular

```bash
npm install @routepilot/engine @routepilot/angular
```

```typescript
// app.config.ts
import { GUIDED_TOUR_CONFIG } from '@routepilot/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: GUIDED_TOUR_CONFIG, useValue: { tours: [myTour] } },
  ],
};
```

```typescript
// app.component.ts
import { GuidedTourOverlayComponent, TourRouterAdapterService } from '@routepilot/angular';

@Component({
  imports: [GuidedTourOverlayComponent],
  template: `<router-outlet /><rp-guided-tour-overlay />`,
})
export class AppComponent {
  constructor(private _router: TourRouterAdapterService) {}
}
```

### Complete setup checklist

No matter which framework you use, the integration sequence is the same:

1. Install the framework package and import `@routepilot/engine/tour.css`.
2. Mount the provider/service and the overlay once at the application root.
3. Register your tours in the root config or a registry.
4. Add stable selectors such as `data-tour="..."` to the real UI you want to target.
5. Start tours from your own buttons, menus, docs pages, or help center entry points.
6. Optionally inject custom bridges if demo state or tour events should use your own store/event bus instead of the default in-memory bridges.

### What each setup part gets you

- **Provider / GuidedTourService** — owns the state machine, runtime lifecycle, shared state, and services for the whole app.
- **Overlay** — renders the tooltip, backdrop, spotlight, navigation controls, and keyboard handling on top of your existing UI.
- **Tours / Registry** — lets you organize definitions centrally and start them by ID from anywhere in the app.
- **Router adapter** — enables route-aware steps, automatic navigation, and route guards.
- **Stable selectors** — give the engine durable DOM anchors such as `data-tour="..."`.
- **Launch trigger** — connects your tours to real product entry points like onboarding, contextual help, or docs.
- **demoBridge** — only needed when preparations should read/write through your own fixture or demo-state layer.
- **eventBridge** — only needed when tour events should flow through your own event bus.

### Selectors

routePilot works best when the elements you target expose stable selectors:

```html
<button data-tour="create-project-btn">Create project</button>
<aside data-tour="billing-sidebar">…</aside>
<input data-tour="invite-email-input" />
```

### Bridges

By default, routePilot uses built-in in-memory bridges for demo state and tour events.
When you need to connect the engine to your own demo-store layer or event bus, pass
custom `demoBridge` / `eventBridge` implementations.

If you do not already know why you need a custom bridge, you probably do not need one.
The defaults are the right choice for most tours.

- Use a custom **demoBridge** when preparations must read/write an existing fixture store, app state layer, shared mock backend, or persisted demo state.
- Use a custom **eventBridge** when tour events should integrate with an existing event bus instead of staying inside routePilot.

```typescript
import type { DemoDataBridge, EventBridge } from '@routepilot/engine';

export const demoBridge: DemoDataBridge = {
  set(scope, key, value) {
    myDemoStore.set(scope.tourId, key, value);
  },
  remove(scope, key) {
    myDemoStore.remove(scope.tourId, key);
  },
  clear(scope, namespace) {
    myDemoStore.clear(scope.tourId, namespace);
  },
  read(scope, key) {
    return myDemoStore.read(scope.tourId, key);
  },
};

export const eventBridge: EventBridge = {
  emit(scope, event, payload) {
    myEventBus.emit(event, payload);
  },
  intercept(scope, event, handler, options) {
    return myEventBus.on(event, handler, options);
  },
  clear(scope, event) {
    myEventBus.clear(event);
  },
  enable() {},
  disable() {},
};
```

### Define a step (framework-agnostic)

```typescript
import { createStep } from '@routepilot/react'; // or '@routepilot/engine' — both work

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

### Launch a tour

Tour definitions and step definitions are identical across frameworks. Only the setup and the way you access actions differ.

For full setup guides, API reference, bridge wiring, and framework-specific examples see the **[Documentation](https://routepilot.dev/docs)**.

## Examples

- Angular example app: [`examples/angular`](https://github.com/chrisfeldkircher/routepilot/tree/main/examples/angular)
- Angular tours folder: [`examples/angular/src/app/tours`](https://github.com/chrisfeldkircher/routepilot/tree/main/examples/angular/src/app/tours)
- Website and docs source: [`apps/site`](https://github.com/chrisfeldkircher/routepilot/tree/main/apps/site)
- Live demo app source: [`apps/demo`](https://github.com/chrisfeldkircher/routepilot/tree/main/apps/demo)

## Project Structure

```
routepilot/
  packages/
    engine/           # Framework-agnostic core engine — types, state machine, DAG, services, CSS (@routepilot/engine)
    react/            # React bindings — Provider, Overlay, hooks (@routepilot/react) — re-exports everything from engine
    angular/          # Angular bindings — components, services, router adapter (@routepilot/angular)
  apps/
    site/             # Landing page and documentation
    demo/             # Live demo app (embedded in the site via iframe)
```

The core engine in `@routepilot/engine` (state machine, DAG builder, services, navigation adapter) is fully framework-agnostic. Each framework package provides the UI layer (overlay component, hooks/services, router integration) on top of the shared engine. `@routepilot/react` re-exports everything from `@routepilot/engine`, so React users only need a single import.

## Key Concepts

### Preparations

Setup and teardown logic with automatic lifecycle management:

```typescript
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

```typescript
transitions: [
  { target: 'advanced-flow', condition: (ctx) => isAdvancedUser(), label: 'Advanced' },
  { target: 'beginner-flow', label: 'Beginner' },
]
```

### Hub Navigation

For non-linear tours like FAQs, define a hub step that users return to between branches:

```typescript
navigation: {
  hubNodeId: 'faq-picker',
  hubReturnLabel: 'Back to topics',
  hubAction: 'goToHub',
}
```

### Click Gating & Text Input

Block navigation until the user actually interacts:

```typescript
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

## Documentation

Full API reference, framework-specific guides, and interactive examples:

**[https://routepilot.dev/docs](https://routepilot.dev/docs)**

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
