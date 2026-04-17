import { useCallback, useEffect, useMemo, useState } from 'react';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';

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
  { id: 'hooks', label: 'Hooks' },
  { id: 'events', label: 'Event System' },
  { id: 'tooltip-config', label: 'Tooltip & Overlay' },
  { id: 'spotlight', label: 'Spotlight & Highlight' },
  { id: 'inline-markup', label: 'Inline Markup' },
  { id: 'interactables', label: 'Interactables' },
  { id: 'routing', label: 'Routing' },
  { id: 'dag-validation', label: 'DAG Validation' },
  { id: 'confetti', label: 'Confetti' },
  { id: 'engine-config', label: 'Engine Config' },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
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
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-primary text-on-primary-fixed w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-all"
        aria-label="Toggle navigation"
      >
        <span className="material-symbols-outlined">{sidebarOpen ? 'close' : 'menu_book'}</span>
      </button>

      {/* Mobile sidebar overlay */}
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
              wizards, and interactive documentation with <Code>@routepilot/core</Code>.
            </p>
          </header>

          {/* ── Getting Started ───────────────────────────────────── */}
          <Section id="getting-started" title="Getting Started">
            <P>Install the package with your preferred package manager:</P>
            <CodeBlock>{`npm install @routepilot/core`}</CodeBlock>
            <P>
              Then wrap your app with <Code>GuidedTourProvider</Code> and render
              the <Code>GuidedTourOverlay</Code> to get the default tour UI:
            </P>
            <CodeBlock>{`import { GuidedTourProvider, GuidedTourOverlay } from '@routepilot/core';
import '@routepilot/core/style.css';

function App() {
  return (
    <GuidedTourProvider>
      <GuidedTourOverlay />
      <YourApp />
    </GuidedTourProvider>
  );
}`}</CodeBlock>
            <P>
              That's the minimum setup. The provider creates the tour state machine,
              registry, and services. The overlay renders the tooltip, backdrop, and
              navigation controls.
            </P>
          </Section>

          {/* ── Provider Setup ────────────────────────────────────── */}
          <Section id="provider-setup" title="Provider Setup">
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
          </Section>

          {/* ── Tour Definition ───────────────────────────────────── */}
          <Section id="tour-definition" title="Tour Definition">
            <P>
              A <Code>TourDefinition</Code> is the top-level object that describes an
              entire tour. It contains an array of steps, optional lifecycle hooks,
              navigation config, and more.
            </P>
            <CodeBlock>{`import type { TourDefinition } from '@routepilot/core';

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

          {/* ── Step Definition ───────────────────────────────────── */}
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

          {/* ── createStep() ──────────────────────────────────────── */}
          <Section id="create-step" title="createStep()">
            <P>
              A convenience factory for the most common step pattern — a single CSS
              selector target with a title and body. It handles click tracking,
              auto-advance, and text input validation automatically.
            </P>
            <CodeBlock>{`import { createStep } from '@routepilot/core';

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
    preparations: [{
      id: 'my-prep',
      scope: 'step',
      factory: () => {
        doSetup();
        return () => doCleanup();
      },
    }],
  },
  'next-step-id',                      // next (optional)
  'prev-step-id',                      // previous (optional)
);`}</CodeBlock>
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
                ['preparations', 'StepPreparationDefinition[]', 'Setup/teardown logic'],
                ['tipOffset', '{ x?, y? }', 'Pixel offset for tooltip positioning'],
                ['routeMode', "'navigate' | 'guard' | 'pause'", 'How to handle routing for this step'],
              ]}
            />
          </Section>

          {/* ── Runtime Context ──────────────────────────────────── */}
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

          {/* ── Preparations ──────────────────────────────────────── */}
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

          {/* ── Click Gating ────────────────────────────────────── */}
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

          {/* ── Text Input Validation ────────────────────────────── */}
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

          {/* ── Auto-Advance ─────────────────────────────────────── */}
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

          {/* ── Lifecycle Hooks ───────────────────────────────────── */}
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

          {/* ── Conditional Steps ─────────────────────────────────── */}
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

          {/* ── Transitions & Branching ──────────────────────────── */}
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

          {/* ── Navigation Config ─────────────────────────────────── */}
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

          {/* ── Hooks ─────────────────────────────────────────────── */}
          <Section id="hooks" title="Hooks">
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
          </Section>

          {/* ── Event System ─────────────────────────────────────── */}
          <Section id="events" title="Event System">
            <P>
              The event system provides a decoupled communication channel between
              steps, preparations, and your application code. Events are scoped
              to the tour runtime — they don't leak to the browser's native event
              system.
            </P>
            <H3>Emitting events</H3>
            <CodeBlock>{`// From a component
const services = useGuidedTourServices();
services.events.emit('cart:item-added', { productId: '123', qty: 1 });

// From a preparation factory
factory: (ctx) => {
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

          {/* ── Tooltip & Overlay ─────────────────────────────────── */}
          <Section id="tooltip-config" title="Tooltip & Overlay">
            <P>
              <Code>GuidedTourOverlay</Code> renders the complete tour UI: backdrop,
              spotlight, tooltip with content, navigation buttons, step counter, and
              step picker. It reads all configuration from the provider.
            </P>
            <H3>Default button labels</H3>
            <P>
              Customize button text globally via the provider config:
            </P>
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

          {/* ── Spotlight & Highlight ────────────────────────────── */}
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

          {/* ── Inline Markup ─────────────────────────────────────── */}
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

          {/* ── Interactables ─────────────────────────────────────── */}
          <Section id="interactables" title="Interactables">
            <P>
              The interactable system lets the tour control external UI components
              like modals, drawers, dropdowns — anything with open/close state.
              This prevents users from accidentally closing a modal the tour needs
              open.
            </P>
            <H3>1. Register the component</H3>
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
            <H3>2. Control it from a step</H3>
            <P>
              Use the <Code>interactables</Code> config to open, close, or lock
              components during specific steps:
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

          {/* ── Routing ───────────────────────────────────────────── */}
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
              The engine navigates via the adapter you pass to the provider. It
              must implement two methods:
            </P>
            <CodeBlock>{`interface TourNavigationAdapter {
  getPath(): string;
  navigate(path: string, options?: { replace?: boolean }): void;
}`}</CodeBlock>
          </Section>

          {/* ── DAG Validation ───────────────────────────────────── */}
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

          {/* ── Confetti ──────────────────────────────────────────── */}
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

          {/* ── Engine Config ─────────────────────────────────────── */}
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
              Pass this to the provider:
            </P>
            <CodeBlock>{`<GuidedTourProvider config={config}>
  <GuidedTourOverlay />
  <App />
</GuidedTourProvider>`}</CodeBlock>
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

function PropTable({ rows }: { rows: [string, string, string][] }) {
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
          {rows.map(([prop, type, desc]) => (
            <tr key={prop} className="border-b border-outline-variant/10">
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
