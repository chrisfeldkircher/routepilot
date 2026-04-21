import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';

type Framework = 'react' | 'angular';
const DEFAULT_FRAMEWORK: Framework = 'react';
const GITHUB_REPO_URL = 'https://github.com/chrisfeldkircher/routepilot';
const ANGULAR_EXAMPLE_URL = `${GITHUB_REPO_URL}/tree/main/examples/angular`;
const ANGULAR_TOURS_URL = `${ANGULAR_EXAMPLE_URL}/src/app/tours`;

function isFramework(value: string | null): value is Framework {
  return value === 'react' || value === 'angular';
}

const ReactTabIcon = () => (
  <svg viewBox="-11.5 -10.232 23 20.463" className="w-3.5 h-3.5" fill="currentColor">
    <circle r="2.05" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);

const AngularTabIcon = () => (
  <svg viewBox="0 0 250 250" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M125 30L31.9 63.2l14.2 123.1L125 230l78.9-43.7 14.2-123.1z" opacity="0.5" />
    <path d="M125 30v22.2-.1V230l78.9-43.7 14.2-123.1L125 30z" opacity="0.7" />
    <path d="M125 52.1L66.8 182.6h21.7l11.7-29.2h49.4l11.7 29.2H183L125 52.1zm17 83.3h-34l17-40.9 17 40.9z" fill="white" />
  </svg>
);

function FrameworkTabs({
  framework,
  onChange,
  react,
  angular,
}: {
  framework: Framework;
  onChange: (framework: Framework) => void;
  react: ReactNode;
  angular: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex gap-1 mb-3 bg-surface-container-lowest rounded-lg p-1 w-fit border border-outline-variant/10">
        <button
          type="button"
          onClick={() => onChange('react')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
            framework === 'react'
              ? 'bg-primary/15 text-primary'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <ReactTabIcon />
          React
        </button>
        <button
          type="button"
          onClick={() => onChange('angular')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
            framework === 'angular'
              ? 'bg-primary/15 text-primary'
              : 'text-on-surface-variant hover:text-white'
          }`}
        >
          <AngularTabIcon />
          Angular
        </button>
      </div>
      {framework === 'react' ? react : angular}
    </div>
  );
}

const sections = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'provider-setup', label: 'Provider Setup' },
  { id: 'tour-definition', label: 'Tour Definition' },
  { id: 'step-definition', label: 'Step Definition' },
  { id: 'create-step', label: 'createStep()' },
  { id: 'runtime-context', label: 'Runtime Context' },
  { id: 'preparations', label: 'Preparations' },
  { id: 'click-gating', label: 'Click Gating' },
  { id: 'text-input', label: 'Text Input Validation' },
  { id: 'auto-advance', label: 'Auto-Advance' },
  { id: 'lifecycle-hooks', label: 'Lifecycle Hooks' },
  { id: 'conditional-steps', label: 'Conditional Steps' },
  { id: 'transitions', label: 'Transitions & Branching' },
  { id: 'navigation-config', label: 'Navigation Config' },
  { id: 'hooks', label: 'Hooks & Services' },
  { id: 'events', label: 'Event System' },
  { id: 'tooltip-config', label: 'Tooltip & Overlay' },
  { id: 'spotlight', label: 'Spotlight & Highlight' },
  { id: 'inline-markup', label: 'Inline Markup' },
  { id: 'interactables', label: 'Interactables' },
  { id: 'routing', label: 'Routing' },
  { id: 'dag-validation', label: 'DAG Validation' },
  { id: 'confetti', label: 'Confetti' },
  { id: 'assistant', label: 'Ask the Tour (Assistant)' },
  { id: 'engine-config', label: 'Engine Config' },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Synced via history.replaceState rather than react-router navigate() —
  // navigate() resets scroll on search-param changes, which jumps the page
  // whenever the reader switches framework tabs mid-scroll.
  const [framework, setFrameworkState] = useState<Framework>(() => {
    if (typeof window === 'undefined') return DEFAULT_FRAMEWORK;
    const params = new URLSearchParams(window.location.search);
    const value = params.get('framework');
    return isFramework(value) ? value : DEFAULT_FRAMEWORK;
  });

  const setFramework = useCallback((next: Framework) => {
    const scrollY = window.scrollY;
    setFrameworkState(next);

    const params = new URLSearchParams(window.location.search);
    params.set('framework', next);
    const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', newUrl);

    requestAnimationFrame(() => {
      if (window.scrollY !== scrollY) {
        window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
      }
    });
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Nav />
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-primary text-on-primary-fixed w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-all"
        aria-label="Toggle navigation"
      >
        <span className="material-symbols-outlined">{sidebarOpen ? 'close' : 'menu_book'}</span>
      </button>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 flex gap-8 lg:gap-12">
        <aside className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-64 bg-surface-container p-6 pt-16 shadow-2xl overflow-y-auto' : 'hidden'} lg:block lg:w-56 lg:p-0 lg:shadow-none lg:bg-transparent flex-shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto`}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-tertiary mb-4">
            Documentation
          </p>
          <nav className="flex flex-col gap-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { scrollTo(s.id); setSidebarOpen(false); }}
                className={`text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                  activeSection === s.id
                    ? 'text-primary bg-primary/10 font-medium'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 max-w-4xl">
          <header className="mb-10 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-white mb-4">Documentation</h1>
            <p className="text-on-surface-variant text-base sm:text-lg">
              Everything you need to build guided tours, onboarding flows, error recovery
              wizards, and interactive documentation with routePilot.
              Available for <Code>React</Code> and <Code>Angular</Code>.
            </p>
            <div className="mt-6 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest/70 p-4 sm:p-5">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-tertiary mb-2">
                Current framework
              </p>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                The framework switchers on this page are synced. Links from{' '}
                <Code>Works with your stack</Code> preselect the matching integration,
                and opening <Code>/docs</Code> directly defaults to <Code>react</Code>.
                The Angular walkthrough mirrors the example app in{' '}
                <a
                  href={ANGULAR_EXAMPLE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  examples/angular
                </a>
                , including the tour files under{' '}
                <a
                  href={ANGULAR_TOURS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  src/app/tours
                </a>
                .
              </p>
            </div>
          </header>

          <Section id="getting-started" title="Getting Started">
            <P>Install the package with your preferred package manager:</P>
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={<>
                <CodeBlock>{`npm install @routepilot/engine @routepilot/react`}</CodeBlock>
                <H3>What to create</H3>
                <P>
                  A typical React integration needs three things: a root mount for the
                  provider and overlay, one or more tour definition files, and a place
                  in your UI that starts a tour.
                </P>
                <CodeBlock>{`src/
  main.tsx
  App.tsx
  tours/
    onboarding.tour.ts
    faq.tour.ts        // optional
    bridges.ts         // optional custom demo/event bridges
  components/
    TourLauncher.tsx   // optional`}</CodeBlock>
                <P>
                  Mount routePilot once in the app shell so the overlay can sit on
                  top of every route in your existing application:
                </P>
                <CodeBlock>{`import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { GuidedTourProvider, GuidedTourOverlay } from '@routepilot/react';
import '@routepilot/engine/tour.css';
import { onboardingTour } from './tours/onboarding.tour';

function TourRoot() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <GuidedTourProvider
      tours={[onboardingTour]}
      location={pathname}
      navigation={{
        getPath: () => pathname,
        navigate: (path, opts) => navigate(path, opts),
      }}
    >
      <YourApp />
      <GuidedTourOverlay />
    </GuidedTourProvider>
  );
}`}</CodeBlock>
                <P>
                  Your routed screens do not need special wrappers. In practice, the
                  only tour-specific additions inside feature code are stable selectors
                  such as <Code>data-tour</Code> attributes and whatever button or menu
                  item starts <Code>actions.start()</Code>.
                </P>
              </>}
              angular={<>
                <CodeBlock>{`npm install @routepilot/engine @routepilot/angular`}</CodeBlock>
                <H3>What to create</H3>
                <P>
                  The Angular setup maps cleanly onto a standalone app: configure the
                  tour service at the root, mount the overlay once in the root template,
                  and keep tour definitions in a dedicated <Code>tours/</Code> folder.
                </P>
                <CodeBlock>{`src/app/
  app.config.ts
  app.component.ts
  app.routes.ts
  pages/
    dashboard.component.ts
    settings.component.ts
  tours/
    onboarding.tour.ts
    faq.tour.ts
    error-recovery.tour.ts
    interactive-docs.tour.ts
    bridges.ts`}</CodeBlock>
                <P>
                  The Angular example in this repo follows exactly that layout. See{' '}
                  <a
                    href={ANGULAR_EXAMPLE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    examples/angular
                  </a>{' '}
                  and the tours folder at{' '}
                  <a
                    href={ANGULAR_TOURS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    examples/angular/src/app/tours
                  </a>
                  .
                </P>
                <P>
                  Configure the tours in <Code>app.config.ts</Code> and mount the
                  overlay in <Code>app.component.ts</Code>:
                </P>
                <CodeBlock>{`// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { GUIDED_TOUR_CONFIG } from '@routepilot/angular';
import { routes } from './app.routes';
import { onboardingTour } from './tours/onboarding.tour';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: GUIDED_TOUR_CONFIG,
      useValue: {
        tours: [onboardingTour],
      },
    },
  ],
};`}</CodeBlock>
                <CodeBlock>{`// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  GuidedTourOverlayComponent,
  TourRouterAdapterService,
} from '@routepilot/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GuidedTourOverlayComponent],
  template: \`
    <router-outlet />
    <rp-guided-tour-overlay />
  \`,
})
export class AppComponent {
  // Inject the router adapter to connect the tour engine to Angular Router
  constructor(private _router: TourRouterAdapterService) {}
}`}</CodeBlock>
                <P>
                  That is the minimum viable mount. The <Code>GuidedTourService</Code>
                  is provided at root automatically, the router adapter syncs the
                  current path, and the overlay stays above your existing routed app
                  without requiring page-level wrappers.
                </P>
              </>}
            />

            <H3>Complete setup flow</H3>
            <P>
              A full routePilot integration usually follows the same sequence in both
              frameworks:
            </P>
            <ol className="list-decimal list-inside text-on-surface-variant space-y-2 mb-6 ml-2">
              <li>Install the framework package and import <Code>@routepilot/engine/tour.css</Code>.</li>
              <li>Mount the provider or service once at the application root together with the overlay.</li>
              <li>Register your tours, either directly from the root config or through a registry.</li>
              <li>Add stable selectors to the real UI you want to target.</li>
              <li>Wire a trigger that starts the tour from a button, menu, docs page, or help center.</li>
              <li>Optionally inject custom bridges if demo data or events should flow through your own store or bus instead of the in-memory defaults.</li>
            </ol>

            <H3>What each setup part gets you</H3>
            <PropTable
              rows={[
                ['Provider / GuidedTourService', 'Required', 'Owns the tour state machine, shared state, services, and runtime lifecycle for the whole app.'],
                ['Overlay', 'Required', 'Renders the tooltip, backdrop, spotlight, buttons, step picker, and keyboard handling on top of your existing UI.'],
                ['Tours / Registry', 'Required', 'Gives you named tours you can start by ID and keeps definitions centralized instead of scattering them through components.'],
                ['Router adapter', 'Required for route-aware tours', 'Enables route navigation, route guards, and steps that target pages other than the current one.'],
                ['Stable selectors', 'Required', 'Give the engine durable DOM anchors so steps survive normal app refactors and re-renders.'],
                ['Launch trigger', 'Required', 'Connects routePilot to a real user entry point such as onboarding, contextual help, FAQ, or docs.'],
                ['demoBridge', 'Optional', 'Only needed when demo/preparation state should go through your own store or fixture layer instead of the built-in in-memory bridge.'],
                ['eventBridge', 'Optional', 'Only needed when tour events should go through your own event bus instead of the built-in in-memory bridge.'],
              ]}
            />

            <H3>Add stable selectors</H3>
            <P>
              routePilot works best when the elements you target expose stable
              selectors. In most apps that means <Code>data-tour</Code> attributes on
              existing UI, not special wrapper components:
            </P>
            <CodeBlock>{`<button data-tour="create-project-btn">Create project</button>
<aside data-tour="billing-sidebar">…</aside>
<input data-tour="invite-email-input" />`}</CodeBlock>

            <H3>Start a tour from your UI</H3>
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={<>
                <CodeBlock>{`import { useGuidedTourActions } from '@routepilot/react';

function TourLauncher() {
  const actions = useGuidedTourActions();

  return (
    <button onClick={() => actions.start('onboarding')}>
      Start onboarding
    </button>
  );
}`}</CodeBlock>
              </>}
              angular={<>
                <CodeBlock>{`import { Component, inject } from '@angular/core';
import { GuidedTourService } from '@routepilot/angular';

@Component({
  selector: 'app-tour-launcher',
  standalone: true,
  template: \`
    <button type="button" (click)="start()">
      Start onboarding
    </button>
  \`,
})
export class TourLauncherComponent {
  private readonly tour = inject(GuidedTourService);

  start(): void {
    void this.tour.actions.start('onboarding');
  }
}`}</CodeBlock>
              </>}
            />

            <H3>Self-hosted assets (GDPR)</H3>
            <P>
              routePilot ships no network dependencies of its own — all markup,
              styles, and logic are served from your origin. If your tooltips
              use icons or custom fonts, install them via npm rather than
              loading from a third-party CDN so EU users aren't silently
              phoned home to Google/Cloudflare:
            </P>
            <CodeBlock>{`npm install @fontsource/inter material-symbols`}</CodeBlock>
            <CodeBlock>{`/* styles.css */
@import '@fontsource/inter/400.css';
@import 'material-symbols/outlined.css';`}</CodeBlock>
            <P>
              The <Code>confetti</Code> helper (see the Confetti section) loads{' '}
              <Code>canvas-confetti</Code> from jsDelivr by default; point
              <Code>confetti.scriptUrl</Code> at a self-hosted copy to avoid
              the CDN request entirely.
            </P>
          </Section>

          <Section id="provider-setup" title="Provider Setup">
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={<>
                <P>
                  <Code>GuidedTourProvider</Code> accepts several optional props to
                  customize behavior:
                </P>
                <PropTable
                  rows={[
                    ['tours', 'TourDefinition[]', 'Pre-register tour definitions on mount'],
                    ['registry', 'TourRegistry', 'Custom registry instance (created via createTourRegistry)'],
                    ['location', 'string', 'Current pathname from your router — enables route-aware steps'],
                    ['navigation', 'TourNavigationAdapter', 'Router integration for auto-navigation'],
                    ['config', 'TourEngineConfig', 'Global config overrides (tooltip, backdrop, scroll, etc.)'],
                    ['debug', 'boolean', 'Enable console debug logging'],
                    ['demoBridge', 'DemoDataBridge', 'Custom demo data store (defaults to in-memory)'],
                    ['eventBridge', 'EventBridge', 'Custom event bus (defaults to in-memory)'],
                  ]}
                />
                <H3>Mount it in the app shell, not per page</H3>
                <P>
                  In an existing React app, keep the provider near your router and let
                  the overlay render once for the whole application. That keeps route
                  transitions, modals, and shared state consistent across the entire
                  tour.
                </P>
                <CodeBlock>{`function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <GuidedTourProvider
      tours={[onboardingTour, faqTour]}
      location={pathname}
      navigation={{
        getPath: () => pathname,
        navigate: (path, opts) => navigate(path, opts),
      }}
    >
      <AppLayout />
      <GuidedTourOverlay />
    </GuidedTourProvider>
  );
}`}</CodeBlock>
                <H3>Tour registration and bridges</H3>
                <P>
                  You can let the provider register tours from the <Code>tours</Code>
                  prop, or pass a prebuilt registry. The two bridge props are optional:
                  if omitted, routePilot uses the built-in in-memory implementations.
                </P>
                <CodeBlock>{`import {
  GuidedTourProvider,
  GuidedTourOverlay,
  createTourRegistry,
  InMemoryDemoDataBridge,
  InMemoryEventBridge,
} from '@routepilot/react';

const registry = createTourRegistry([onboardingTour, faqTour]);
const demoBridge = new InMemoryDemoDataBridge();
const eventBridge = new InMemoryEventBridge();

function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <GuidedTourProvider
      registry={registry}
      demoBridge={demoBridge}
      eventBridge={eventBridge}
      location={pathname}
      navigation={{
        getPath: () => pathname,
        navigate: (path, opts) => navigate(path, opts),
      }}
    >
      <AppLayout />
      <GuidedTourOverlay />
    </GuidedTourProvider>
  );
}`}</CodeBlock>
                <P>
                  Use <Code>demoBridge</Code> when preparations should talk to your own
                  demo-state layer or fixture store. Use <Code>eventBridge</Code> when
                  the tour event system should run through your own event bus.
                </P>
                <H3>When custom bridges are actually needed</H3>
                <P>
                  Most integrations do <strong>not</strong> need custom bridges. If
                  your tours are self-contained and your preparations only touch the DOM
                  or local tour-owned demo state, the built-in in-memory bridges are the
                  right default.
                </P>
                <ul className="list-disc list-inside text-on-surface-variant space-y-2 mb-6 ml-2">
                  <li>Use a custom <Code>demoBridge</Code> when your preparations need to read/write a real fixture layer, Zustand/Redux store, NgRx store, shared mock backend, or persisted demo state.</li>
                  <li>Use a custom <Code>eventBridge</Code> when your app already has an event bus and you want tour events to participate in that same system instead of living inside routePilot only.</li>
                  <li>If you are building a live product tour, contextual docs flow, or FAQ tour that does not need shared external state, skip both and stay on the defaults.</li>
                </ul>
                <H3>Router integration</H3>
                <P>
                  To enable route-aware steps (auto-navigation, route guards), pass your
                  router's current path and a navigation adapter:
                </P>
                <CodeBlock>{`import { useLocation, useNavigate } from 'react-router-dom';

function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <GuidedTourProvider
      location={pathname}
      navigation={{
        getPath: () => pathname,
        navigate: (path, opts) => navigate(path, opts),
      }}
    >
      <GuidedTourOverlay />
      <YourApp />
    </GuidedTourProvider>
  );
}`}</CodeBlock>
              </>}
              angular={<>
                <P>
                  Provide <Code>GUIDED_TOUR_CONFIG</Code> at the application root to
                  configure the tour engine:
                </P>
                <PropTable
                  rows={[
                    ['tours', 'TourDefinition[]', 'Pre-register tour definitions'],
                    ['config', 'TourEngineConfig', 'Global config overrides (tooltip, backdrop, scroll, etc.)'],
                    ['debug', 'boolean', 'Enable console debug logging'],
                    ['demoBridge', 'DemoDataBridge', 'Custom demo data store (defaults to in-memory)'],
                    ['eventBridge', 'EventBridge', 'Custom event bus (defaults to in-memory)'],
                  ]}
                />
                <H3>Mount it above the routed app</H3>
                <P>
                  The recommended Angular pattern is to keep your existing shell
                  component intact and append <Code>rp-guided-tour-overlay</Code> once
                  at the root. The example app does exactly this while still rendering
                  navigation, header, footer, and routed pages normally.
                </P>
                <CodeBlock>{`@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GuidedTourOverlayComponent],
  template: \`
    <div class="site-shell">
      <router-outlet />
    </div>
    <rp-guided-tour-overlay />
  \`,
})
export class AppComponent {
  constructor(private _router: TourRouterAdapterService) {}
}`}</CodeBlock>
                <CodeBlock>{`// app.config.ts
import {
  GUIDED_TOUR_CONFIG,
  InMemoryDemoDataBridge,
  InMemoryEventBridge,
} from '@routepilot/angular';

const demoBridge = new InMemoryDemoDataBridge();
const eventBridge = new InMemoryEventBridge();

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: GUIDED_TOUR_CONFIG,
      useValue: {
        tours: [onboardingTour, faqTour],
        demoBridge,
        eventBridge,
        debug: true,
        config: {
          tooltip: { buttonLabels: { next: 'Continue' } },
        },
      },
    },
  ],
};`}</CodeBlock>
                <P>
                  Angular always creates a registry internally and pre-registers the
                  <Code>tours</Code> you provide here. The bridge slots are optional
                  and only needed when you want to replace the default in-memory demo
                  state or event bus.
                </P>
                <H3>When custom bridges are actually needed</H3>
                <P>
                  Leave both bridge slots out unless you already have a concrete system
                  they should integrate with. The built-in bridges are enough for the
                  common case: isolated tours, local preparations, and routePilot-owned
                  event flow.
                </P>
                <ul className="list-disc list-inside text-on-surface-variant space-y-2 mb-6 ml-2">
                  <li>Choose a custom <Code>demoBridge</Code> when preparations should read/write an existing Angular state layer, fixture service, or shared mock backend.</li>
                  <li>Choose a custom <Code>eventBridge</Code> when tour events should connect to an existing RxJS/event-bus style infrastructure used elsewhere in the app.</li>
                  <li>If you do not already know why you need a custom bridge, you almost certainly do not need one yet.</li>
                </ul>
                <H3>Router integration</H3>
                <P>
                  Inject <Code>TourRouterAdapterService</Code> in your root component.
                  It automatically bridges the Angular Router with the tour engine — no
                  manual path or adapter wiring needed:
                </P>
                <CodeBlock>{`import { TourRouterAdapterService } from '@routepilot/angular';

@Component({ /* ... */ })
export class AppComponent {
  constructor(private _router: TourRouterAdapterService) {}
}`}</CodeBlock>
                <P>
                  The adapter listens to <Code>NavigationEnd</Code> events and keeps the
                  tour engine's current path in sync. Route enforcement, auto-navigation,
                  and guard mode all work automatically.
                </P>
              </>}
            />

            <H3>Custom bridge shape</H3>
            <P>
              When you do need custom bridges, these are the two interfaces you
              implement. They sit behind <Code>ctx.services.demo</Code> and{' '}
              <Code>ctx.services.events</Code>:
            </P>
            <CodeBlock>{`import type { DemoDataBridge, EventBridge } from '@routepilot/engine';

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
};`}</CodeBlock>
            <P>
              In practice: <Code>demoBridge</Code> is about <em>state storage</em>,
              while <Code>eventBridge</Code> is about <em>message transport</em>. If
              you need neither external storage nor external transport, keep the
              defaults.
            </P>
          </Section>

          <Section id="tour-definition" title="Tour Definition">
            <P>
              A <Code>TourDefinition</Code> is the top-level object that describes an
              entire tour. It contains an array of steps, optional lifecycle hooks,
              navigation config, and more.
            </P>
            <CodeBlock>{`import type { TourDefinition } from '@routepilot/engine';

const onboardingTour: TourDefinition = {
  id: 'onboarding',
  name: 'Welcome Tour',
  steps: [welcomeStep, dashboardStep, createTaskStep, finishStep],
  onStart: (ctx) => {
    console.log('Tour started');
  },
  onFinish: (ctx) => {
    console.log('Tour finished');
  },
  confetti: { enabled: true, duration: 3000 },
  navigation: {
    hubNodeId: 'hub',
    hubReturnLabel: 'Back to overview',
    hubAction: 'goToHub',
    stepPickerScope: 'chapter',
  },
};`}</CodeBlock>
            <PropTable
              rows={[
                ['id', 'string', 'Unique identifier for the tour'],
                ['name', 'string?', 'Display name (shown in the step counter)'],
                ['steps', 'StepDefinition[]', 'Ordered array of step definitions'],
                ['onStart', '(ctx) => void', 'Called when the tour begins'],
                ['onFinish', '(ctx) => void', 'Called when the tour completes or is stopped'],
                ['confetti', 'ConfettiConfig?', 'Celebration effect on completion'],
                ['navigation', 'TourNavigationConfig?', 'Hub navigation and step picker config'],
                ['metadata', 'Record<string, unknown>?', 'Arbitrary data attached to the tour'],
              ]}
            />
          </Section>

          <Section id="step-definition" title="Step Definition">
            <P>
              Each step describes what to show, where to point, and how the user
              progresses. You can define steps manually as objects or use the
              <Code>createStep()</Code> factory for common cases.
            </P>
            <CodeBlock>{`const welcomeStep: StepDefinition = {
  id: 'welcome',
  route: '/dashboard',
  selector: '[data-tour="welcome-banner"]',
  content: {
    title: 'Welcome!',
    body: 'This is your ==dashboard==. Everything starts here.',
    media: <img src={welcomeGif} alt="Welcome animation" />,
  },
  tooltip: { placement: 'bottom' },
  chapter: 'Getting Started',
  preparations: [
    {
      id: 'seed-data',
      scope: 'step',
      factory: () => {
        seedDemoData();
        return () => clearDemoData();
      },
    },
  ],
  transitions: [
    { target: 'create-task', label: 'Create a task' },
    { target: 'explore-board', label: 'Explore the board' },
  ],
};`}</CodeBlock>
            <H3>Key properties</H3>
            <PropTable
              rows={[
                ['id', 'string', 'Unique step identifier (used in transitions and navigation)'],
                ['route', 'string | string[]', 'Path(s) this step is valid on — enables auto-navigation'],
                ['selector', 'string | string[]', 'CSS selector(s) for the target element(s)'],
                ['content', 'StepContent | (ctx) => StepContent', 'Title, body, media, and hint — can be static or dynamic'],
                ['tooltip', '{ placement, offset, width, className }', 'Tooltip positioning and styling'],
                ['chapter', 'string?', 'Group label for the step picker dropdown'],
                ['preparations', 'StepPreparationDefinition[]', 'Setup/teardown logic with lifecycle scoping'],
                ['transitions', 'StepTransition[]', 'Conditional branching to other steps'],
                ['next', 'string | string[]', 'Explicit next step ID(s)'],
                ['previous', 'string | string[]', 'Explicit previous step ID(s)'],
                ['when', '(ctx) => boolean', 'Conditional entry — skip if returns false'],
                ['onEnter', '(ctx) => void', 'Lifecycle hook: called on step entry'],
                ['onExit', '(ctx) => void', 'Lifecycle hook: called on step exit'],
                ['autoAdvance', '{ delay?, check?, interval? }', 'Auto-advance to next step after condition/delay'],
                ['spotlight', '{ padding?, outlineClassName? }', 'Highlight behavior for target elements'],
              ]}
            />
            <H3>Content definition</H3>
            <P>
              The <Code>content</Code> field can be a plain object or a factory
              function that receives the step context. This lets you generate dynamic
              content based on the current state:
            </P>
            <CodeBlock>{`content: (ctx) => ({
  title: 'Your permissions',
  body: \`You have \${permissions.length} permissions as \${role}.\`,
})`}</CodeBlock>
            <H3>Tip placement</H3>
            <P>
              The tooltip can be placed relative to the target element. Available
              placements:
            </P>
            <CodeBlock>{`'auto' | 'top' | 'bottom' | 'left' | 'right' | 'above' | 'below' | 'center'`}</CodeBlock>
            <P>
              Use <Code>'center'</Code> for steps with no target element (like a GIF
              intro step). The tooltip renders in the center of the viewport with no
              spotlight.
            </P>
          </Section>

          <Section id="create-step" title="createStep()">
            <P>
              A convenience factory for the most common step pattern — a single CSS
              selector target with a title and body. It handles click tracking,
              auto-advance, and text input validation automatically.
            </P>
            <CodeBlock>{`import { createStep } from '@routepilot/react';

const step = createStep(
  'step-id',                           // id
  '/dashboard',                        // route
  '[data-tour="target"]',              // selector (string or string[])
  'Step Title',                        // title
  'Step body with ==shimmer== text.',  // body (supports inline markup)
  'bottom',                            // tipPlacement (optional)
  {                                    // config (optional)
    click: { all: ['[data-tour="target"]'] },
    autoAdvance: true,
    autoAdvanceDelay: 300,
  },
  'next-step-id',                      // next (optional)
  'prev-step-id',                      // previous (optional)
);`}</CodeBlock>
            <P>
              <Code>createStep()</Code> returns a plain <Code>StepDefinition</Code>.
              For advanced fields like <Code>preparations</Code>, <Code>transitions</Code>,
              or <Code>chapter</Code>, assign them on the returned object:
            </P>
            <CodeBlock>{`step.preparations = [
  {
    id: 'my-prep',
    scope: 'step',
    factory: () => {
      doSetup();
      return () => doCleanup();
    },
  },
];`}</CodeBlock>
            <H3>Full signature</H3>
            <CodeBlock>{`function createStep(
  id: string,
  route: string,
  selector: string | string[],
  title: string,
  body: string,
  tipPlacement?: TipPlacement,
  config?: StepConfig,
  next?: string,
  previous?: string,
  options?: StepFactoryOptions,
): StepDefinition`}</CodeBlock>
            <H3>StepConfig</H3>
            <PropTable
              rows={[
                ['click', '{ all?: string[], any?: string[] }', 'Block navigation until element(s) are clicked'],
                ['textInput', '{ selector, match, autoAdvance? }', 'Block until text input matches pattern'],
                ['autoAdvance', 'boolean', 'Auto-advance when click/input requirements are met'],
                ['autoAdvanceDelay', 'number', 'Delay in ms before auto-advancing (default: 0)'],
                ['interactables', 'StepInteractablesConfig', 'Control modals/drawers during this step'],
                ['setTourAttributes', 'Record<string, string>', 'Write tour-controlled attributes to the document root'],
                ['allowTourActions', 'string | string[] | Record<string, string>', 'Allow named app actions while the step is active'],
                ['tipOffset', '{ x?, y? }', 'Pixel offset for tooltip positioning'],
                ['routeMode', "'navigate' | 'guard' | 'pause'", 'How to handle routing for this step'],
              ]}
            />
          </Section>

          <Section id="runtime-context" title="Runtime Context">
            <P>
              The <Code>StepRuntimeContext</Code> (often just <Code>ctx</Code>) is
              passed to preparation factories, lifecycle hooks, content factories,
              transition conditions, and the <Code>when</Code> guard. It's the
              primary interface for interacting with the tour engine from within a step.
            </P>
            <H3>Navigation</H3>
            <CodeBlock>{`ctx.next();           // Advance to the next step
ctx.back();           // Go to the previous step
ctx.goTo('step-id');  // Jump to any step by ID
ctx.advance();        // Alias for next()`}</CodeBlock>
            <H3>Element access</H3>
            <CodeBlock>{`// Get the current target element (resolved from selector)
const el = ctx.resolveTarget();

// Wait for a DOM element to appear (useful after preparations mutate the DOM)
const el = await ctx.waitForElement('[data-tour="target"]', 3000);`}</CodeBlock>
            <H3>Tour attributes</H3>
            <P>
              Set and read HTML attributes on the root element. Useful for
              CSS-driven state changes that the tour controls:
            </P>
            <CodeBlock>{`ctx.setTourAttribute('mode', 'editing');
ctx.getTourAttribute('mode');     // 'editing'
ctx.removeTourAttribute('mode');`}</CodeBlock>
            <H3>Shared state</H3>
            <P>
              A <Code>Map</Code> that persists across steps within the same tour run.
              Use it to pass data between steps:
            </P>
            <CodeBlock>{`// In step 1
ctx.setShared('userChoice', 'advanced');

// In step 2
const choice = ctx.getShared<string>('userChoice');`}</CodeBlock>
            <H3>Dynamic preparations</H3>
            <P>
              Register preparations imperatively from within a lifecycle hook or
              factory. Useful for conditional setup:
            </P>
            <CodeBlock>{`ctx.ensurePreparation('dynamic-prep', () => {
  openDrawer();
  return () => closeDrawer();
});

// Release it early if needed
ctx.releasePreparation('dynamic-prep');

// Or register a simple cleanup that runs on step exit
ctx.registerCleanup(() => resetSomething());`}</CodeBlock>
            <H3>Event interception</H3>
            <CodeBlock>{`// Listen for custom events during this step
const unsub = ctx.interceptEvent('form:submit', (payload) => {
  console.log('Form submitted:', payload);
  ctx.next();
});`}</CodeBlock>
            <H3>Read-only properties</H3>
            <PropTable
              rows={[
                ['ctx.tour', 'TourDefinition', 'The full tour definition object'],
                ['ctx.dag', 'DagTourDefinition', 'The compiled DAG with nodes and edges'],
                ['ctx.nodeId', 'string', 'Current step ID'],
                ['ctx.services', 'TourServices', 'Access to demo, events, and state services'],
                ['ctx.shared', 'Map<string, unknown>', 'Cross-step shared state (read-only view)'],
                ['ctx.storage', 'Map<string, unknown>', 'Step-specific storage (cleared on exit)'],
                ['ctx.history', 'DagTourHistory[]', 'Navigation history for the current run'],
                ['ctx.totalSteps', 'number', 'Total number of steps in the tour'],
              ]}
            />
          </Section>

          <Section id="preparations" title="Preparations">
            <P>
              Preparations are the setup/teardown system for tour steps. They let you
              seed demo data, manipulate the DOM, or change application state —
              with <strong>automatic cleanup</strong> based on the preparation's scope.
            </P>
            <CodeBlock>{`preparations: [
  {
    id: 'seed-notifications',
    scope: 'step',
    factory: () => {
      addNotification({ id: 'demo', text: 'New task assigned' });
      return () => removeNotification('demo');
    },
  },
]`}</CodeBlock>
            <H3>Scope</H3>
            <P>
              The <Code>scope</Code> determines when the cleanup function runs:
            </P>
            <PropTable
              rows={[
                ["'step'", '', 'Cleanup immediately when the user leaves this step. Perfect for demo state that should revert as you move forward.'],
                ["'group'", '', 'Cleanup when all steps sharing this preparation have been exited. Uses sharedWith to declare which steps share it.'],
                ["'tour'", '', 'Cleanup only when the entire tour ends (complete or stop). Perfect for cumulative changes that build up across steps.'],
              ]}
            />
            <H3>Shared preparations</H3>
            <P>
              Use <Code>sharedWith</Code> to share a preparation across multiple steps.
              The preparation runs once (on first entry), and the cleanup runs when
              the <em>last</em> step holding it is exited:
            </P>
            <CodeBlock>{`{
  id: 'seed-data',
  scope: 'group',
  sharedWith: ['step-2', 'step-3', 'step-4'],
  factory: () => {
    initializeState();
    return () => resetState();
  },
}`}</CodeBlock>
            <H3>Tour-scope preparations (cumulative pattern)</H3>
            <P>
              For flows like error recovery, where each step fixes something and those
              fixes should accumulate, use <Code>scope: 'tour'</Code>. Cleanup only
              runs when the tour ends:
            </P>
            <CodeBlock>{`// Step 1: fix the email field
{
  id: 'fix-email',
  scope: 'tour',
  factory: () => {
    state.fixField('email');
    return () => state.unfixField('email');
  },
}

// Step 2: fix the phone field (email stays fixed)
{
  id: 'fix-phone',
  scope: 'tour',
  factory: () => {
    state.fixField('phone');
    return () => state.unfixField('phone');
  },
}`}</CodeBlock>
          </Section>

          <Section id="click-gating" title="Click Gating">
            <P>
              Click gating blocks the "Next" button until the user clicks specific
              elements. This forces users to <em>interact</em> rather than just
              read — critical for onboarding flows where you need the user to
              actually perform an action.
            </P>
            <H3>Require all clicks</H3>
            <P>
              The user must click <em>every</em> listed selector before they can
              proceed:
            </P>
            <CodeBlock>{`createStep('click-both', '/app', '[data-tour="panel"]',
  'Try both options',
  'Click ==|Option A|== and ==|Option B|== to continue.',
  'bottom',
  {
    click: {
      all: ['[data-tour="option-a"]', '[data-tour="option-b"]'],
    },
  },
)`}</CodeBlock>
            <H3>Require any click</H3>
            <P>
              The user must click <em>at least one</em> of the listed selectors:
            </P>
            <CodeBlock>{`createStep('click-one', '/app', '[data-tour="actions"]',
  'Pick an action',
  'Click any button to continue.',
  'bottom',
  {
    click: {
      any: ['[data-tour="save"]', '[data-tour="cancel"]'],
    },
  },
)`}</CodeBlock>
            <H3>Auto-advance on click</H3>
            <P>
              Combine click gating with <Code>autoAdvance</Code> to automatically
              move to the next step once the user clicks:
            </P>
            <CodeBlock>{`{
  click: { all: ['[data-tour="submit-btn"]'] },
  autoAdvance: true,
  autoAdvanceDelay: 300,  // Brief delay so the user sees the click register
}`}</CodeBlock>
          </Section>

          <Section id="text-input" title="Text Input Validation">
            <P>
              Block navigation until the user types a specific value into an input
              field. The engine attaches listeners automatically and validates
              against a string or regex pattern.
            </P>
            <CodeBlock>{`createStep('type-name', '/onboarding', '[data-tour="name-input"]',
  'Enter your name',
  'Type your name to continue. Try ==|John|==.',
  'bottom',
  {
    textInput: {
      selector: '[data-tour="name-input"] input',
      match: /^.{2,}$/,          // At least 2 characters
      autoAdvance: true,          // Move to next step when matched
      autoAdvanceDelay: 500,      // Half-second delay after match
    },
  },
)`}</CodeBlock>
            <PropTable
              rows={[
                ['selector', 'string', 'CSS selector for the input/textarea element'],
                ['match', 'string | RegExp', 'Value or pattern the input must match'],
                ['autoAdvance', 'boolean?', 'Auto-advance when the pattern matches'],
                ['autoAdvanceDelay', 'number?', 'Delay in ms before auto-advancing'],
              ]}
            />
          </Section>

          <Section id="auto-advance" title="Auto-Advance">
            <P>
              Steps can automatically advance without user interaction. This is
              useful for timed steps, polling conditions, or steps that should
              proceed after a click/input is detected.
            </P>
            <H3>Timer-based</H3>
            <CodeBlock>{`{
  id: 'splash',
  autoAdvance: {
    delay: 3000,  // Advance after 3 seconds
  },
  // ...
}`}</CodeBlock>
            <H3>Condition-based (polling)</H3>
            <CodeBlock>{`{
  id: 'wait-for-load',
  autoAdvance: {
    check: (ctx) => document.querySelector('.loaded') !== null,
    interval: 500,   // Poll every 500ms
  },
  // ...
}`}</CodeBlock>
            <H3>Target a specific step</H3>
            <CodeBlock>{`{
  id: 'branch-auto',
  autoAdvance: {
    delay: 2000,
    targetNodeId: 'specific-step',  // Jump to this step instead of the linear next
    // targetNodeId: 'next',        // Or just 'next' for the default next step
  },
}`}</CodeBlock>
            <H3>Via createStep config</H3>
            <P>
              When using <Code>createStep()</Code>, the <Code>autoAdvance</Code> and
              <Code>autoAdvanceDelay</Code> config fields trigger after click or text
              input requirements are met:
            </P>
            <CodeBlock>{`createStep('auto-step', '/app', '[data-tour="btn"]',
  'Click the button',
  'This will auto-advance after you click.',
  'bottom',
  {
    click: { all: ['[data-tour="btn"]'] },
    autoAdvance: true,
    autoAdvanceDelay: 300,
  },
)`}</CodeBlock>
          </Section>

          <Section id="lifecycle-hooks" title="Lifecycle Hooks">
            <P>
              Steps have four lifecycle hooks that fire at different points.
              Each receives the <Code>StepRuntimeContext</Code>:
            </P>
            <PropTable
              rows={[
                ['onEnter', '(ctx) => void', 'Fires when the step becomes active (after preparations complete)'],
                ['onExit', '(ctx) => void', 'Fires when leaving the step (before cleanup)'],
                ['onAdvance', '(ctx) => void', 'Fires specifically when advancing forward (Next button)'],
                ['onRetreat', '(ctx) => void', 'Fires specifically when going backward (Back button)'],
              ]}
            />
            <CodeBlock>{`const step: StepDefinition = {
  id: 'track-interaction',
  onEnter: (ctx) => {
    analytics.track('tour_step_viewed', { step: ctx.nodeId });
  },
  onExit: (ctx) => {
    analytics.track('tour_step_exited', { step: ctx.nodeId });
  },
  onAdvance: (ctx) => {
    // Only fires on forward navigation
    ctx.setShared('completedSteps', [
      ...(ctx.getShared<string[]>('completedSteps') ?? []),
      ctx.nodeId,
    ]);
  },
  // ...
};`}</CodeBlock>
            <H3>Tour-level lifecycle</H3>
            <P>
              The tour itself also has <Code>onStart</Code> and <Code>onFinish</Code>
              hooks:
            </P>
            <CodeBlock>{`const tour: TourDefinition = {
  id: 'onboarding',
  onStart: (ctx) => {
    // Called once when the tour begins
    document.body.classList.add('tour-running');
  },
  onFinish: (ctx) => {
    // Called on complete() or stop()
    document.body.classList.remove('tour-running');
    saveOnboardingComplete();
  },
  steps: [...],
};`}</CodeBlock>
          </Section>

          <Section id="conditional-steps" title="Conditional Steps">
            <P>
              The <Code>when</Code> guard lets you conditionally skip a step based
              on runtime state. If <Code>when</Code> returns <Code>false</Code>,
              the engine skips to the next step in the DAG.
            </P>
            <CodeBlock>{`const adminOnlyStep: StepDefinition = {
  id: 'admin-settings',
  when: (ctx) => {
    return ctx.getShared<string>('userRole') === 'admin';
  },
  content: {
    title: 'Admin Settings',
    body: 'Only admins see this step.',
  },
  // ...
};`}</CodeBlock>
            <P>
              The <Code>when</Code> guard is evaluated every time the engine tries
              to enter the step — including back-navigation. This means a skipped
              step is skipped in both directions.
            </P>
            <H3>Navigation gating</H3>
            <P>
              For finer control, use <Code>canNavigateNext</Code> and
              <Code>canNavigateBack</Code> to conditionally block the Next/Back
              buttons while keeping the step visible:
            </P>
            <CodeBlock>{`{
  id: 'must-complete',
  canNavigateNext: (ctx) => {
    // Block "Next" until form is valid
    return document.querySelector('form')?.checkValidity() ?? false;
  },
  canNavigateBack: () => false,  // Prevent going back from this step
  // ...
}`}</CodeBlock>
          </Section>

          <Section id="transitions" title="Transitions & Branching">
            <P>
              By default, steps flow linearly in the order they appear in the
              <Code>steps</Code> array. But you can define custom transitions for
              branching, conditional paths, and hub navigation.
            </P>
            <H3>Explicit next/previous</H3>
            <P>Override the default linear flow:</P>
            <CodeBlock>{`const step: StepDefinition = {
  id: 'branch-point',
  next: 'specific-next-step',
  previous: 'specific-prev-step',
  // ...
};`}</CodeBlock>
            <H3>Conditional transitions</H3>
            <P>
              Use <Code>transitions</Code> for dynamic branching. When the user
              clicks "Next", the engine evaluates conditions in priority order and
              takes the first match:
            </P>
            <CodeBlock>{`transitions: [
  {
    target: 'advanced-flow',
    condition: (ctx) => ctx.getShared('userLevel') === 'advanced',
    priority: 1,
    label: 'Advanced path',
  },
  {
    target: 'beginner-flow',
    priority: 2,
    label: 'Beginner path',
  },
]`}</CodeBlock>
            <P>
              If multiple transitions have no condition or all conditions pass, the
              overlay shows a <strong>branch chooser</strong> — the user picks which
              path to take. The <Code>label</Code> is what appears in the chooser.
            </P>
            <H3>Hub navigation</H3>
            <P>
              The hub pattern lets users jump between independent sections of a tour
              (like an FAQ). Define a hub step and configure the tour's navigation:
            </P>
            <CodeBlock>{`const tour: TourDefinition = {
  id: 'faq',
  navigation: {
    hubNodeId: 'faq-picker',
    hubReturnLabel: 'Back to topics',
    hubAction: 'goToHub',
    stepPickerScope: 'chapter',
  },
  steps: [
    hubStep,          // The hub — shows available topics
    ...topic1Steps,   // Chapter: "Shipping"
    ...topic2Steps,   // Chapter: "Returns"
    ...topic3Steps,   // Chapter: "Account"
  ],
};`}</CodeBlock>
            <P>
              When <Code>hubAction: 'goToHub'</Code> is set, the skip button in
              the tooltip navigates back to the hub step instead of closing the tour.
            </P>
          </Section>

          <Section id="navigation-config" title="Navigation Config">
            <P>
              The <Code>navigation</Code> field on <Code>TourDefinition</Code>
              controls how the tour UI behaves:
            </P>
            <PropTable
              rows={[
                ['hubNodeId', 'string?', 'Step ID that acts as the tour hub — skip button navigates here instead of closing'],
                ['hubReturnLabel', 'string?', 'Custom label for the skip/return button (default: "Skip")'],
                ['hubAction', "'goToHub' | 'stop'", "What the skip button does: navigate to hub or stop the tour"],
                ['stepPickerScope', "'tour' | 'chapter'", "Whether the step picker dropdown shows all steps or only the current chapter's steps"],
              ]}
            />
            <H3>Step picker</H3>
            <P>
              The step picker is a dropdown in the tooltip that lets users jump
              between steps. When <Code>stepPickerScope: 'chapter'</Code>, it only
              shows steps in the current chapter (grouped by the <Code>chapter</Code>
              field on each step). This is useful for hub-based tours where each
              branch is a separate chapter.
            </P>
          </Section>

          <Section id="hooks" title="Hooks & Services">
            <P>
              Access tour actions, state, and services from your components. The API
              surface is identical — only the access pattern differs by framework.
            </P>
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={<>
                <H3>useGuidedTourActions()</H3>
                <P>
                  Returns methods to control the tour. This is the hook you'll use
                  most often:
                </P>
                <CodeBlock>{`const actions = useGuidedTourActions();

// Start a tour from a definition object
await actions.startWithDefinition(myTour, {
  startNodeId: 'specific-step',  // optional: start at a specific step
});

// Start a pre-registered tour by ID
await actions.start('onboarding');

// Navigation
await actions.next();
await actions.back();
await actions.goTo('step-id');

// Stop or complete
await actions.stop();      // Fires onFinish with status 'aborted'
await actions.complete();  // Fires onFinish with status 'completed'

// Get available transitions from current step
const transitions = await actions.getAvailableTransitions();`}</CodeBlock>

                <H3>useGuidedTourState()</H3>
                <P>
                  Returns a reactive snapshot of the tour machine state. Re-renders
                  your component on every state change:
                </P>
                <CodeBlock>{`const state = useGuidedTourState();

state.status       // 'idle' | 'preparing' | 'running' | 'paused' | 'completed' | 'error'
state.tourId       // Current tour ID or null
state.nodeId       // Current step ID or null
state.history      // Navigation history: Array<{ from, to, cause, at }>
state.canGoNext    // Whether "Next" is available
state.canGoBack    // Whether "Back" is available
state.shared       // ReadonlyMap of shared state
state.isTransitioning  // True during step transitions`}</CodeBlock>

                <H3>useGuidedTourServices()</H3>
                <P>
                  Access the service layer — demo data store, event bus, and shared
                  state:
                </P>
                <CodeBlock>{`const services = useGuidedTourServices();

// Demo data
services.demo.set('key', value);
services.demo.read('key');
services.demo.remove('key');
services.demo.clear();

// Event bus
services.events.emit('custom-event', payload);
services.events.intercept('custom-event', handler);
services.events.once('custom-event', handler);`}</CodeBlock>

                <H3>useTourInteractableState()</H3>
                <P>
                  Manages open/close state of modals, drawers, or any togglable
                  component that the tour needs to control:
                </P>
                <CodeBlock>{`const { openLocked, closeLocked, setOpen } = useTourInteractableState(
  'my-modal',     // unique ID
  setIsOpen,      // your state setter
);

// The tour can now open/close this component via step config:
// config: { interactables: { open: { id: 'my-modal' } } }`}</CodeBlock>

                <H3>Reacting to tour completion</H3>
                <P>
                  Watch <Code>state.status</Code> for the <Code>running|preparing
                  → idle|completed|error</Code> transition to run logic when a
                  tour ends — for example, returning the user to a landing
                  route:
                </P>
                <CodeBlock>{`const state = useGuidedTourState();
const navigate = useNavigate();
const prevRef = useRef(state.status);

useEffect(() => {
  const prev = prevRef.current;
  prevRef.current = state.status;
  const wasActive = prev === 'running' || prev === 'preparing';
  const isTerminal =
    state.status === 'idle' ||
    state.status === 'completed' ||
    state.status === 'error';
  if (wasActive && isTerminal) {
    navigate('/');  // back to the scenario picker, CTA page, etc.
  }
}, [state.status, navigate]);`}</CodeBlock>
              </>}
              angular={<>
                <H3>GuidedTourService</H3>
                <P>
                  The <Code>GuidedTourService</Code> is the single entry point for
                  controlling tours in Angular. It replaces all React hooks with one
                  injectable service:
                </P>
                <CodeBlock>{`import { GuidedTourService } from '@routepilot/angular';

@Component({ /* ... */ })
export class MyComponent {
  constructor(private tour: GuidedTourService) {}

  startTour() {
    this.tour.actions.startWithDefinition(myTour, {
      startNodeId: 'specific-step',
    });
  }

  stopTour() {
    this.tour.actions.stop();
  }
}`}</CodeBlock>

                <H3>Actions</H3>
                <P>
                  The <Code>actions</Code> property provides the same methods as the
                  React <Code>useGuidedTourActions()</Code> hook:
                </P>
                <CodeBlock>{`// Start a tour
await this.tour.actions.startWithDefinition(myTour);
await this.tour.actions.start('onboarding');

// Navigation
await this.tour.actions.next();
await this.tour.actions.back();
await this.tour.actions.goTo('step-id');

// Stop or complete
await this.tour.actions.stop();
await this.tour.actions.complete();`}</CodeBlock>

                <H3>Reactive state</H3>
                <P>
                  Subscribe to <Code>state$</Code> for reactive updates, or use
                  <Code>select()</Code> for specific slices:
                </P>
                <CodeBlock>{`// Full state observable
this.tour.state$.subscribe(snapshot => {
  console.log(snapshot.status, snapshot.nodeId);
});

// Select specific properties
this.tour.select(s => s.status).subscribe(status => {
  console.log('Status changed:', status);
});

// Synchronous access
const current = this.tour.state;`}</CodeBlock>

                <H3>Registering tours at runtime</H3>
                <CodeBlock>{`// Register additional tours after init
this.tour.registerTours([newTour]);`}</CodeBlock>

                <H3>Reacting to tour completion</H3>
                <P>
                  Watch <Code>state$</Code> for the <Code>running|preparing →
                  idle|completed|error</Code> transition to run logic when a
                  tour ends — for example, returning the user to a landing
                  route:
                </P>
                <CodeBlock>{`constructor(
  private tour: GuidedTourService,
  private router: Router,
) {
  let prevStatus = this.tour.state.status;
  this.tour.state$.subscribe((snapshot) => {
    const wasActive =
      prevStatus === 'running' || prevStatus === 'preparing';
    const isTerminal =
      snapshot.status === 'idle' ||
      snapshot.status === 'completed' ||
      snapshot.status === 'error';
    if (wasActive && isTerminal) {
      this.router.navigateByUrl('/');
    }
    prevStatus = snapshot.status;
  });
}`}</CodeBlock>
              </>}
            />
          </Section>

          <Section id="events" title="Event System">
            <P>
              The event system provides a decoupled communication channel between
              steps, preparations, and your application code. Events are scoped
              to the tour runtime — they don't leak to the browser's native event
              system.
            </P>
            <H3>Emitting events</H3>
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={
                <CodeBlock>{`// From a component
const services = useGuidedTourServices();
services.events.emit('cart:item-added', { productId: '123', qty: 1 });`}</CodeBlock>
              }
              angular={
                <CodeBlock>{`// From a component
constructor(private tour: GuidedTourService) {}

emitEvent() {
  const services = this.tour.createServices(this.tour.state.nodeId);
  services.events.emit('cart:item-added', { productId: '123', qty: 1 });
}`}</CodeBlock>
              }
            />
            <P>From a preparation factory (identical across frameworks):</P>
            <CodeBlock>{`factory: (ctx) => {
  ctx.services.events.emit('data:seeded', { rows: 50 });
  return () => ctx.services.events.emit('data:cleared');
}`}</CodeBlock>
            <H3>Intercepting events</H3>
            <CodeBlock>{`// Listen for events (returns unsubscribe function)
const unsub = services.events.intercept('cart:item-added', (payload) => {
  console.log('Item added:', payload);
});

// Listen once — auto-unsubscribes after first fire
services.events.once('form:submitted', (payload) => {
  actions.next();
});

// From within a step's runtime context
onEnter: (ctx) => {
  const unsub = ctx.interceptEvent('task:created', () => {
    ctx.next();
  });
}`}</CodeBlock>
            <H3>Use cases</H3>
            <ul className="list-disc list-inside text-on-surface-variant space-y-1 mb-6 ml-2">
              <li>Advance to the next step when the user completes an action in your app</li>
              <li>Trigger preparation cleanup across steps</li>
              <li>Coordinate between a tour and embedded components (forms, wizards)</li>
              <li>Bridge native UI events into the tour's lifecycle</li>
            </ul>
          </Section>

          <Section id="tooltip-config" title="Tooltip & Overlay">
            <P>
              The overlay renders the complete tour UI: backdrop, spotlight, tooltip
              with content, navigation buttons, step counter, and step picker. It reads
              all configuration from the provider or service.
            </P>
            <H3>Default button labels</H3>
            <P>
              Customize button text globally via configuration:
            </P>
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={
                <CodeBlock>{`<GuidedTourProvider
  config={{
    tooltip: {
      defaultWidth: 360,
      showStepCounter: true,
      buttonLabels: {
        next: 'Next',
        back: 'Back',
        skip: 'Skip',
        finish: 'Finish',
        close: 'Close Tour',
      },
    },
    backdrop: { opacity: 0.55 },
    scroll: { behavior: 'smooth', block: 'center' },
  }}
>`}</CodeBlock>
              }
              angular={
                <CodeBlock>{`// app.config.ts
{
  provide: GUIDED_TOUR_CONFIG,
  useValue: {
    config: {
      tooltip: {
        defaultWidth: 360,
        showStepCounter: true,
        buttonLabels: {
          next: 'Next',
          back: 'Back',
          skip: 'Skip',
          finish: 'Finish',
          close: 'Close Tour',
        },
      },
      backdrop: { opacity: 0.55 },
      scroll: { behavior: 'smooth', block: 'center' },
    },
  },
}`}</CodeBlock>
              }
            />
            <H3>Keyboard shortcuts</H3>
            <P>
              The overlay supports keyboard navigation out of the box:
            </P>
            <ul className="list-disc list-inside text-on-surface-variant space-y-1 mb-6 ml-2">
              <li><Code>Escape</Code> — Close the tour</li>
              <li><Code>ArrowRight</Code> — Next step</li>
              <li><Code>ArrowLeft</Code> — Previous step</li>
            </ul>
          </Section>

          <Section id="spotlight" title="Spotlight & Highlight">
            <P>
              When a step has a target element, the overlay creates a spotlight
              effect — the target is illuminated while the rest of the page is
              dimmed by the backdrop. You can customize this behavior per step.
            </P>
            <H3>Spotlight config</H3>
            <CodeBlock>{`const step: StepDefinition = {
  id: 'highlight-demo',
  selector: '[data-tour="card"]',
  spotlight: {
    padding: 12,                          // Extra padding around the target (px)
    outlineClassName: 'my-custom-outline', // Custom CSS class for the highlight ring
    selectors: [                           // Highlight additional elements
      { target: '[data-tour="related"]', highlight: true },
    ],
  },
  // ...
};`}</CodeBlock>
            <H3>Multiple highlights</H3>
            <P>
              You can highlight multiple elements simultaneously using the
              <Code>selectors</Code> array on either the step or the spotlight config:
            </P>
            <CodeBlock>{`selectors: [
  { target: '[data-tour="header"]', highlight: true },
  { target: '[data-tour="sidebar"]', highlight: true },
  { target: '[data-tour="footer"]', highlight: true, optional: true },
]`}</CodeBlock>
            <PropTable
              rows={[
                ['target', 'string | () => Element', 'CSS selector or resolver function'],
                ['highlight', 'boolean?', 'Whether to apply the highlight class (default: true for primary)'],
                ['multiple', 'boolean?', 'Select all matching elements, not just the first'],
                ['optional', 'boolean?', "Don't fail if this element doesn't exist"],
              ]}
            />
            <H3>Global highlight class</H3>
            <P>
              The default highlight class is <Code>tour-outline-shimmer</Code>.
              Override it globally via the engine config:
            </P>
            <CodeBlock>{`config: {
  highlight: {
    outlineClassName: 'my-highlight-ring',
  },
}`}</CodeBlock>
          </Section>

          <Section id="inline-markup" title="Inline Markup">
            <P>
              Step body text supports lightweight inline markup for highlighting
              key terms. This works in both plain string bodies and in the
              <Code>body</Code> field of <Code>content</Code> objects.
            </P>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface-container rounded-lg p-4">
                <code className="text-xs text-primary block mb-2">==text==</code>
                <p className="text-sm text-on-surface-variant">Shimmer highlight — draws attention with a subtle animated glow</p>
              </div>
              <div className="bg-surface-container rounded-lg p-4">
                <code className="text-xs text-primary block mb-2">==|text|==</code>
                <p className="text-sm text-on-surface-variant">Pill badge — renders as a rounded inline badge</p>
              </div>
              <div className="bg-surface-container rounded-lg p-4">
                <code className="text-xs text-primary block mb-2">==|~text~|==</code>
                <p className="text-sm text-on-surface-variant">Shimmer pill — a pill badge with the shimmer effect</p>
              </div>
            </div>
            <CodeBlock>{`// In a createStep body:
createStep(
  'intro',
  '/dashboard',
  '[data-tour="header"]',
  'Welcome!',
  'Click the ==|New Project|== button to get started.',
  'bottom',
);

// In a StepDefinition content object:
content: {
  title: 'Your Dashboard',
  body: 'The ==sidebar== contains all your ==navigation== options.',
}`}</CodeBlock>
          </Section>

          <Section id="interactables" title="Interactables">
            <P>
              The interactable system lets the tour control external UI components
              like modals, drawers, dropdowns — anything with open/close state.
              This prevents users from accidentally closing a modal the tour needs
              open.
            </P>
            <H3>1. Register the component</H3>
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={<>
                <P>
                  In your modal/drawer component, use the <Code>useTourInteractableState</Code>
                  hook:
                </P>
                <CodeBlock>{`function MyDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const { openLocked, closeLocked } = useTourInteractableState(
    'settings-drawer',
    setIsOpen,
  );

  return (
    <Drawer
      open={isOpen}
      onClose={() => {
        if (!closeLocked) setIsOpen(false);
      }}
    >
      {/* ... */}
    </Drawer>
  );
}`}</CodeBlock>
              </>}
              angular={<>
                <P>
                  In your modal/drawer component, use the <Code>rpTourInteractableState</Code>
                  directive:
                </P>
                <CodeBlock>{`import { TourInteractableStateDirective } from '@routepilot/angular';

@Component({
  selector: 'app-my-drawer',
  standalone: true,
  imports: [TourInteractableStateDirective],
  template: \`
    <div
      [rpTourInteractableState]="'settings-drawer'"
      (openChange)="setOpen($event)"
    >
      <app-drawer [open]="isOpen" (closed)="onClose()">
        <!-- ... -->
      </app-drawer>
    </div>
  \`,
})
export class MyDrawerComponent {
  isOpen = false;

  @ViewChild(TourInteractableStateDirective)
  interactable!: TourInteractableStateDirective;

  setOpen(next: boolean) {
    this.isOpen = next;
  }

  onClose() {
    // Use safeSetOpen to respect tour locks
    this.interactable.safeSetOpen(false);
  }
}`}</CodeBlock>
              </>}
            />
            <H3>2. Control it from a step</H3>
            <P>
              Use the <Code>interactables</Code> config to open, close, or lock
              components during specific steps (identical across frameworks):
            </P>
            <CodeBlock>{`createStep('drawer-step', '/settings', '[data-tour="field"]',
  'Check this setting',
  'The settings drawer has been opened for you.',
  'right',
  {
    interactables: {
      open: { id: 'settings-drawer' },     // Open on step entry
      lockClose: { id: 'settings-drawer' }, // Prevent user from closing
    },
  },
)`}</CodeBlock>
            <PropTable
              rows={[
                ['open', '{ id: string }', 'Open the component on step entry'],
                ['close', '{ id: string }', 'Close the component on step entry'],
                ['lockOpen', '{ id: string }', 'Prevent the component from being closed'],
                ['lockClose', '{ id: string }', 'Prevent the component from being opened'],
                ['releaseOpen', '{ id: string }', 'Remove the close lock'],
                ['releaseClose', '{ id: string }', 'Remove the open lock'],
              ]}
            />
          </Section>

          <Section id="routing" title="Routing">
            <P>
              Each step can declare which route(s) it's valid on. The engine
              enforces routing based on the <Code>routeMode</Code>:
            </P>
            <PropTable
              rows={[
                ["'navigate'", '(default)', "Auto-navigate to the step's route on entry. If the user drifts, navigate back."],
                ["'guard'", '', "Block navigation away from allowed routes (don't auto-navigate)."],
                ["'pause'", '', 'No enforcement — the step works on any route.'],
              ]}
            />
            <CodeBlock>{`const step = createStep(
  'settings-intro',
  '/settings',                         // Must be on /settings
  '[data-tour="header"]',
  'Project Settings',
  'Configure your project here.',
  'bottom',
  { routeMode: 'navigate' },          // Auto-navigate if not already there
);`}</CodeBlock>
            <P>
              For steps that work on multiple routes, pass an array:
            </P>
            <CodeBlock>{`route: ['/settings', '/settings/general', '/settings/security']`}</CodeBlock>
            <H3>Navigation adapter</H3>
            <P>
              The engine navigates via an adapter that implements the
              <Code>TourNavigationAdapter</Code> interface:
            </P>
            <CodeBlock>{`interface TourNavigationAdapter {
  getPath(): string;
  navigate(path: string, options?: { replace?: boolean }): void;
}`}</CodeBlock>
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={<>
                <P>
                  Pass the adapter directly to the provider:
                </P>
                <CodeBlock>{`<GuidedTourProvider
  location={pathname}
  navigation={{
    getPath: () => pathname,
    navigate: (path, opts) => navigate(path, opts),
  }}
>`}</CodeBlock>
              </>}
              angular={<>
                <P>
                  The <Code>TourRouterAdapterService</Code> implements this interface
                  automatically using Angular's <Code>Router</Code>. Just inject it:
                </P>
                <CodeBlock>{`import { TourRouterAdapterService } from '@routepilot/angular';

@Component({ /* ... */ })
export class AppComponent {
  constructor(private _router: TourRouterAdapterService) {}
}
// That's it — path syncing, navigation, and route guards are all automatic.`}</CodeBlock>
              </>}
            />
          </Section>

          <Section id="dag-validation" title="DAG Validation">
            <P>
              When a tour starts, the engine compiles the <Code>steps</Code> array
              into a <strong>Directed Acyclic Graph (DAG)</strong> using
              <Code>buildDag()</Code>. This validates the tour structure and catches
              errors before the tour runs.
            </P>
            <H3>What gets validated</H3>
            <ul className="list-disc list-inside text-on-surface-variant space-y-1 mb-6 ml-2">
              <li>All step IDs are non-empty and unique</li>
              <li>All <Code>next</Code>/<Code>previous</Code> references point to existing steps</li>
              <li>All <Code>transitions[].target</Code> values point to existing steps</li>
              <li>The hub step (if configured) exists in the tour</li>
            </ul>
            <H3>The compiled DAG</H3>
            <P>
              The output is a <Code>DagTourDefinition</Code> with a node lookup
              table, an entry point, and the step sequence:
            </P>
            <CodeBlock>{`interface DagTourDefinition {
  id: string;
  name: string;
  nodes: Record<string, DagTourNode>;  // Step lookup by ID
  entryId: string;                      // First step
  totalSteps: number;
  sequence: string[];                   // Ordered step IDs
  navigation?: TourNavigationConfig;
}

interface DagTourNode {
  id: string;
  label: string;
  step: StepDefinition;
  next: string[];       // Outgoing edges
  previous: string[];   // Incoming edges
  transitions?: StepTransition[];
}`}</CodeBlock>
            <P>
              You don't normally interact with the DAG directly — the engine uses it
              internally. But it's available on <Code>ctx.dag</Code> in lifecycle
              hooks and preparations if you need to inspect the graph.
            </P>
          </Section>

          <Section id="confetti" title="Confetti">
            <P>
              Tours can trigger a confetti celebration when completed. Enable it
              on the tour definition:
            </P>
            <CodeBlock>{`const tour: TourDefinition = {
  id: 'onboarding',
  steps: [...],
  confetti: {
    enabled: true,
    duration: 3000,        // ms
    colors: ['#a3a6ff', '#c180ff', '#ff6e84'],
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999,
  },
};`}</CodeBlock>
            <P>
              Confetti loads <Code>canvas-confetti</Code> from a CDN by default.
              You can customize or disable the script URL globally:
            </P>
            <CodeBlock>{`<GuidedTourProvider
  config={{
    confetti: {
      scriptUrl: '/libs/confetti.min.js',  // Self-host
      // scriptUrl: false,                 // Disable entirely
    },
  }}
>`}</CodeBlock>
          </Section>

          <Section id="assistant" title="Ask the Tour (Assistant)">
            <P>
              <Code>@routepilot/assistant</Code> adds a BM25-ranked search bar to the
              tooltip footer. Users type a natural-language question, the engine ranks
              the tour steps that best answer it, and clicking a result calls
              <Code>goTo()</Code> on that step. Retrieval runs entirely in the browser —
              no LLM, no API key, no backend.
            </P>

            <H3>Install</H3>
            <P>The core package is framework-agnostic. Pair it with the binding for your stack:</P>
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={
                <CodeBlock>{`npm install @routepilot/assistant @routepilot/assistant-react`}</CodeBlock>
              }
              angular={
                <CodeBlock>{`npm install @routepilot/assistant @routepilot/assistant-angular`}</CodeBlock>
              }
            />

            <H3>Wire it</H3>
            <P>
              The engine exposes two footer slots on the tooltip:{' '}
              <Code>tooltipFooterNavSlot</Code> (a small button next to Back/Next) and{' '}
              <Code>tooltipFooterSlot</Code> (a full-width panel below the buttons).
              Drop the assistant button into the nav slot and the prompt into the
              footer slot.
            </P>
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={
                <CodeBlock>{`import {
  GuidedTourProvider,
  GuidedTourOverlay,
} from '@routepilot/react';
import { TourIndex } from '@routepilot/assistant';
import {
  TourAssistantProvider,
  TourAssistantButton,
  TourAssistantPrompt,
} from '@routepilot/assistant-react';
import '@routepilot/assistant/tour-assistant.css';

import { onboardingTour } from './tours/onboarding.tour';
import { faqTour } from './tours/faq.tour';

const tours = [onboardingTour, faqTour];
const assistant = TourIndex.fromTours(tours);

<GuidedTourProvider
  tours={tours}
  tooltipFooterNavSlot={<TourAssistantButton />}
  tooltipFooterSlot={<TourAssistantPrompt />}
>
  <TourAssistantProvider index={assistant}>
    <App />
    <GuidedTourOverlay />
  </TourAssistantProvider>
</GuidedTourProvider>`}</CodeBlock>
              }
              angular={
                <CodeBlock>{`// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { GUIDED_TOUR_CONFIG } from '@routepilot/angular';
import { TourIndex } from '@routepilot/assistant';
import {
  provideTourAssistant,
  TourAssistantButtonComponent,
  TourAssistantPromptComponent,
} from '@routepilot/assistant-angular';
import { onboardingTour } from './tours/onboarding.tour';
import { faqTour } from './tours/faq.tour';

const tours = [onboardingTour, faqTour];
const assistantIndex = TourIndex.fromTours(tours);

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: GUIDED_TOUR_CONFIG,
      useValue: {
        tours,
        tooltipFooterNavComponent: TourAssistantButtonComponent,
        tooltipFooterComponent: TourAssistantPromptComponent,
      },
    },
    provideTourAssistant({ index: assistantIndex }),
  ],
};

// styles.css
@import '@routepilot/assistant/tour-assistant.css';`}</CodeBlock>
              }
            />
            <P>
              The slot props are generic — the engine has no assistant-specific
              knowledge. Remove the dependency and clear the slot props, and the
              tooltip footer looks exactly as it did before.
            </P>

            <H3>How ranking works</H3>
            <P>
              Retrieval is classic BM25 with <Code>k1 = 1.5</Code> and{' '}
              <Code>b = 0.75</Code> over a tokenized, stemmed token stream built from
              each step&apos;s <Code>title</Code>, <Code>body</Code>,{' '}
              <Code>chapter</Code>, <Code>meta</Code>, and an{' '}
              <Code>assistant</Code> bag you control. The whole index is built once on
              the client from the <Code>TourDefinition[]</Code> you already have — zero
              network calls, no embeddings, under 20 KB gzipped, fully offline.
            </P>

            <H3>Per-step tuning with <Code>meta.assistant</Code></H3>
            <P>
              Every step accepts an optional <Code>meta.assistant</Code> bag. Use it to
              surface slang, error-message fragments, or aliases that the body text
              wouldn&apos;t naturally contain — the ranker treats them as first-class
              tokens scoped to that step.
            </P>
            <CodeBlock>{`{
  id: 'answer-upload-stuck',
  chapter: 'Answers',
  content: {
    title: 'Upload progress bar is stuck',
    body: 'The progress bar sits at 87% and has not moved...',
  },
  meta: {
    assistant: {
      keywords: [
        'upload stuck',
        'progress stuck',
        'resume upload',
        'tus resumable',
      ],
      aliases: [
        'upload hanging',
        'upload never finishes',
        'stuck at 87',
      ],
      intent: 'recover a stalled upload',
      errorPatterns: [/upload.*timeout/i, /chunk.*failed/i],
    },
  },
}`}</CodeBlock>
            <PropTable
              rows={[
                ['keywords', 'string[]', 'Extra tokens added to the index for this step. Highest effective boost.'],
                ['aliases', 'string[]', 'Alternative phrasings (slang, error strings, user-speak). Query-time synonym expansion.'],
                ['intent', 'string', 'One-line description of what this step answers. Indexed like body text.'],
                ['errorPatterns', 'RegExp[]', 'Patterns boosted when the user pastes an actual error message into the prompt.'],
              ]}
            />

            <H3>Index-level configuration</H3>
            <P>
              <Code>TourIndex.fromTours(tours, options)</Code> accepts the following
              options. Every knob is optional; defaults work for most apps.
            </P>
            <PropTable
              rows={[
                ['fieldWeights', 'Partial<FieldWeights>', 'Per-field boosts. Defaults: title × 3, assistant × 2, body × 1, chapter × 1.'],
                ['synonyms', 'Record<string, string[]>', 'Query-time synonym expansion, e.g. { cancel: [\'abort\', \'stop\'] }. Hot-swappable — not baked into the index.'],
                ['scope', '\'all-tours\' | \'current-tour-only\' | \'current-tour-first\'', 'Controls which tours the assistant ranks against at query time.'],
                ['reranker', '(args) => Promise<Match[]>', 'Optional async hook. Lexical BM25 runs first; use this to plug in an LLM, cross-encoder, or custom scoring.'],
                ['loadingAnimation', '\'pulse\' | \'wave\' | \'spinner\' | ReactNode', 'What to show in the prompt while an async reranker resolves.'],
              ]}
            />

            <H3>Scope it to the active tour</H3>
            <P>
              For demo-style tours you almost always want the assistant to stay
              inside the current experience rather than suggesting steps from
              unrelated tours. Pass <Code>scope</Code> when constructing the index:
            </P>
            <CodeBlock>{`const assistant = TourIndex.fromTours(tours, {
  scope: 'current-tour-only', // or 'current-tour-first' to allow cross-tour fallback
});`}</CodeBlock>

            <H3>Anchor UI elements for tours</H3>
            <P>
              The button and prompt components ship with stable{' '}
              <Code>data-tour</Code> hooks you can target from inside a tour — useful
              when writing a meta-tour that teaches users how to use the assistant
              itself:
            </P>
            <PropTable
              rows={[
                [
                  'tour-assistant-button',
                  'button',
                  <span className="inline-flex items-center gap-1.5">
                    The <AssistantBotIcon /> footer toggle (collapsed or expanded).
                  </span>,
                ],
                ['tour-assistant-prompt', 'container', 'The prompt panel (input + results list) while open.'],
                ['tour-assistant-input', 'input', 'The search input itself.'],
                ['tour-assistant-results', 'list', 'The results list; individual results expose tour-assistant-result.'],
                ['tour-assistant-close', 'button', 'The close button on the prompt.'],
              ]}
            />
            <P>
              Use the <Code>highlight:</Code> selector prefix so the shimmer ring
              renders inside the tooltip&apos;s own stacking context:
            </P>
            <CodeBlock>{`{
  id: 'try-it',
  selector: 'highlight:[data-tour="tour-assistant-button"]',
  content: {
    title: 'Try it — the button is in the tooltip footer',
    body: 'Click the highlighted assistant button to open the prompt.',
  },
}`}</CodeBlock>

            <H3>When to reach for it</H3>
            <ul className="list-disc list-inside text-on-surface-variant space-y-2 mb-6 ml-2">
              <li>Tours that grow past five or six steps where Next → Next stops working.</li>
              <li>FAQ-style flows where each step answers a specific question.</li>
              <li>Error-recovery flows where the user already pastes the error message.</li>
              <li>Interactive docs where the tour steps double as searchable reference entries.</li>
            </ul>
          </Section>

          <Section id="engine-config" title="Engine Config">
            <P>
              The full <Code>TourEngineConfig</Code> lets you customize every
              aspect of the engine globally:
            </P>
            <CodeBlock>{`const config: TourEngineConfig = {
  tooltip: {
    defaultWidth: 360,
    className: 'my-custom-tooltip',
    showStepCounter: true,
    placementStrategy: 'auto',
    buttonLabels: {
      next: 'Continue',
      back: 'Previous',
      skip: 'Skip tour',
      finish: 'Done!',
      loading: 'Loading...',
      close: 'Exit',
    },
  },
  backdrop: {
    opacity: 0.55,          // 0 = transparent, 1 = solid black
  },
  scroll: {
    behavior: 'smooth',     // 'smooth' | 'auto'
    block: 'center',        // ScrollLogicalPosition
  },
  highlight: {
    outlineClassName: 'tour-outline-shimmer',
  },
  confetti: {
    scriptUrl: 'https://cdn.jsdelivr.net/.../confetti.browser.min.js',
  },
};`}</CodeBlock>
            <P>
              Pass this to the provider or service configuration:
            </P>
            <FrameworkTabs
              framework={framework}
              onChange={setFramework}
              react={
                <CodeBlock>{`<GuidedTourProvider config={config}>
  <GuidedTourOverlay />
  <App />
</GuidedTourProvider>`}</CodeBlock>
              }
              angular={
                <CodeBlock>{`// app.config.ts
{ provide: GUIDED_TOUR_CONFIG, useValue: { config } }`}</CodeBlock>
              }
            />
          </Section>

          <div className="mt-24 pt-12 border-t border-outline-variant/10 text-center text-on-surface-variant text-sm">
            <p>
              Built with care. Open-source under MIT.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-20 scroll-mt-24">
      <h2 className="text-2xl sm:text-3xl font-headline font-bold text-white mb-6">{title}</h2>
      {children}
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-headline font-bold text-white mt-8 mb-4">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-on-surface-variant leading-relaxed mb-4">{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-primary text-sm bg-primary/5 px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

const KEYWORDS = new Set([
  'import', 'from', 'export', 'const', 'let', 'var', 'function', 'return',
  'if', 'else', 'async', 'await', 'new', 'type', 'interface', 'readonly',
  'typeof', 'void', 'null', 'undefined', 'true', 'false', 'default',
]);

const TYPE_NAMES = new Set([
  'TourDefinition', 'StepDefinition', 'StepTransition', 'StepConfig',
  'StepPreparationDefinition', 'TipPlacement', 'TourNavigationConfig',
  'StepSelectorConfig', 'StepRuntimeContext', 'GuidedTourProvider',
  'GuidedTourOverlay', 'TourEngineConfig', 'DagTourDefinition',
  'DagTourNode', 'TourNavigationAdapter', 'ConfettiConfig', 'string',
  'number', 'boolean', 'Record', 'Array', 'Map', 'ReadonlyArray',
  'Promise', 'Element', 'RegExp', 'ReactNode',
]);

interface Token {
  type: 'keyword' | 'string' | 'comment' | 'type' | 'number' | 'punct' | 'prop' | 'text';
  value: string;
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    // Comments
    if (code[i] === '/' && code[i + 1] === '/') {
      const end = code.indexOf('\n', i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end);
      tokens.push({ type: 'comment', value: slice });
      i += slice.length;
      continue;
    }

    // Template literals
    if (code[i] === '`') {
      let j = i + 1;
      while (j < code.length && code[j] !== '`') {
        if (code[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', value: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Strings
    if (code[i] === "'" || code[i] === '"') {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', value: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Numbers
    if (/\d/.test(code[i]) && (i === 0 || /[\s,:([\]{=+\-*/]/.test(code[i - 1]))) {
      let j = i;
      while (j < code.length && /[\d.]/.test(code[j])) j++;
      tokens.push({ type: 'number', value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Words
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);

      if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (TYPE_NAMES.has(word)) {
        tokens.push({ type: 'type', value: word });
      } else if (i > 0 && code[i - 1] === '.') {
        tokens.push({ type: 'prop', value: word });
      } else if (j < code.length && code[j] === ':') {
        tokens.push({ type: 'prop', value: word });
      } else {
        tokens.push({ type: 'text', value: word });
      }
      i = j;
      continue;
    }

    // JSX tags
    if (code[i] === '<' && /[A-Za-z/]/.test(code[i + 1] ?? '')) {
      let j = i;
      while (j < code.length && code[j] !== '>') j++;
      tokens.push({ type: 'keyword', value: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Punctuation
    if (/[{}()[\];:.,=<>?!&|+\-*/^~@#%]/.test(code[i])) {
      // Arrow functions =>
      if (code[i] === '=' && code[i + 1] === '>') {
        tokens.push({ type: 'punct', value: '=>' });
        i += 2;
        continue;
      }
      tokens.push({ type: 'punct', value: code[i] });
      i++;
      continue;
    }

    // Whitespace and other characters
    let j = i;
    while (j < code.length && !/[a-zA-Z_$0-9'"`/{}()[\];:.,=<>?!&|+\-*/^~@#%\d]/.test(code[j])) j++;
    if (j === i) j = i + 1;
    tokens.push({ type: 'text', value: code.slice(i, j) });
    i = j;
  }

  return tokens;
}

const TOKEN_COLORS: Record<Token['type'], string> = {
  keyword: 'text-[#c180ff]',
  string: 'text-[#7ec699]',
  comment: 'text-[#6d758c] italic',
  type: 'text-[#e5c07b]',
  number: 'text-[#d19a66]',
  punct: 'text-[#6d758c]',
  prop: 'text-[#61afef]',
  text: 'text-slate-300',
};

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const tokens = useMemo(() => tokenize(children), [children]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }, [children]);

  return (
    <div className="relative group bg-surface-container-lowest rounded-lg border border-outline-variant/10 mb-6 overflow-hidden">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-on-surface-variant bg-surface-container hover:bg-surface-container-high hover:text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <span className="material-symbols-outlined text-sm">
          {copied ? 'check' : 'content_copy'}
        </span>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="p-3 sm:p-5 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed whitespace-pre">
        {tokens.map((token, i) => (
          <span key={i} className={TOKEN_COLORS[token.type]}>{token.value}</span>
        ))}
      </pre>
    </div>
  );
}

function PropTable({ rows }: { rows: [string, string, ReactNode][] }) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-outline-variant/20">
            <th className="py-2 pr-4 font-headline font-bold text-white">Prop</th>
            <th className="py-2 pr-4 font-headline font-bold text-white">Type</th>
            <th className="py-2 font-headline font-bold text-white">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([prop, type, desc], i) => (
            <tr key={`${prop}-${i}`} className="border-b border-outline-variant/10">
              <td className="py-2.5 pr-4 font-mono text-primary whitespace-nowrap">{prop}</td>
              <td className="py-2.5 pr-4 font-mono text-tertiary text-xs whitespace-nowrap">{type}</td>
              <td className="py-2.5 text-on-surface-variant">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssistantBotIcon({ className = 'w-4 h-4 inline-block align-[-2px] text-tertiary' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M9 15C8.44771 15 8 15.4477 8 16C8 16.5523 8.44771 17 9 17C9.55229 17 10 16.5523 10 16C10 15.4477 9.55229 15 9 15Z" />
      <path d="M14 16C14 15.4477 14.4477 15 15 15C15.5523 15 16 15.4477 16 16C16 16.5523 15.5523 17 15 17C14.4477 17 14 16.5523 14 16Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 1C10.8954 1 10 1.89543 10 3C10 3.74028 10.4022 4.38663 11 4.73244V7H6C4.34315 7 3 8.34315 3 10V20C3 21.6569 4.34315 23 6 23H18C19.6569 23 21 21.6569 21 20V10C21 8.34315 19.6569 7 18 7H13V4.73244C13.5978 4.38663 14 3.74028 14 3C14 1.89543 13.1046 1 12 1ZM5 10C5 9.44772 5.44772 9 6 9H7.38197L8.82918 11.8944C9.16796 12.572 9.86049 13 10.618 13H13.382C14.1395 13 14.832 12.572 15.1708 11.8944L16.618 9H18C18.5523 9 19 9.44772 19 10V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V10ZM13.382 11L14.382 9H9.61803L10.618 11H13.382Z" />
      <path d="M1 14C0.447715 14 0 14.4477 0 15V17C0 17.5523 0.447715 18 1 18C1.55228 18 2 17.5523 2 17V15C2 14.4477 1.55228 14 1 14Z" />
      <path d="M22 15C22 14.4477 22.4477 14 23 14C23.5523 14 24 14.4477 24 15V17C24 17.5523 23.5523 18 23 18C22.4477 18 22 17.5523 22 17V15Z" />
    </svg>
  );
}
