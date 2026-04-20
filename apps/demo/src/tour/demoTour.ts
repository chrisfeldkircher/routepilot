import type { TourDefinition, StepDefinition } from '@routepilot/react';
import { createStep } from '@routepilot/react';
import { createElement } from 'react';
import { demoState, DEMO_ID } from './demoState';
import helloGifUrl from '../assets/hello_gif.gif';
import completeGifUrl from '../assets/complete_gif.gif';

const DEMO_ROUTE = `/tasks/${DEMO_ID}`;
const PREFILL_COMMENT = 'Looks good, ready to merge!';
const ASSIGNED_USER = 'Alice Chen';

const DEMO_SEED_PREP_ID = 'demo-task-seed';
const STATUS_OPEN_PREP_ID = 'status-open-phase';
const STATUS_IN_PROGRESS_PREP_ID = 'status-in-progress-phase';
const ASSIGNMENT_RESET_PREP_ID = 'assignment-selection-reset';
const ASSIGNMENT_MODAL_PREP_ID = 'assignment-modal-open';
const ASSIGNED_ALICE_PREP_ID = 'assignment-alice-selected';
const ATTACHMENT_PREVIEW_PREP_ID = 'attachment-preview-open';
const COMMENT_DRAFT_PREP_ID = 'comment-draft-phase';
const COMMENT_POSTED_PREP_ID = 'comment-posted-phase';

const ASSIGN_MODAL_ID = 'assign-modal';
const PREVIEW_MODAL_ID = 'preview-modal';

const STATUS_OPEN_STEPS = [
  'detail-header',
  'detail-status-bar',
  'detail-click-status',
];

const STATUS_IN_PROGRESS_STEPS = [
  'detail-status-changed',
  'detail-description',
  'attachments-overview',
  'attachment-click-image',
  'attachment-preview-image',
  'attachment-json-intro',
  'detail-sidebar',
  'detail-assign-btn',
  'assign-modal',
  'assign-pick',
  'assign-done',
  'comments-section',
  'comment-type',
  'comment-submit',
  'comment-posted',
  'go-create-task',
  'create-form',
  'create-title',
  'create-description',
  'create-priority',
  'create-attachments-section',
  'create-attachments-add-image',
  'create-attachments-failed',
  'create-submit',
  'complete',
];

const ASSIGNMENT_RESET_STEPS = [
  'detail-assign-btn',
  'assign-modal',
  'assign-pick',
];

const ASSIGN_MODAL_OPEN_STEPS = [
  'assign-modal',
  'assign-pick',
];

const ASSIGNED_ALICE_STEPS = [
  'assign-done',
  'comments-section',
  'comment-type',
  'comment-submit',
  'comment-posted',
  'go-create-task',
  'create-form',
  'create-title',
  'create-description',
  'create-priority',
  'create-attachments-section',
  'create-attachments-add-image',
  'create-attachments-failed',
  'create-submit',
  'complete',
];

const COMMENT_DRAFT_STEPS = [
  'comment-type',
  'comment-submit',
];

const COMMENT_POSTED_STEPS = [
  'comment-posted',
  'go-create-task',
  'create-form',
  'create-title',
  'create-description',
  'create-priority',
  'create-attachments-section',
  'create-attachments-add-image',
  'create-attachments-failed',
  'create-submit',
  'complete',
];

const notify = () => {
  window.dispatchEvent(
    new CustomEvent('demo-tour:state-changed', { detail: { taskId: DEMO_ID } })
  );
};

const removeUserComments = () => {
  demoState.removeCommentsByAuthor('You');
  notify();
};

const setAssignmentAssignee = (assignee: string | null) => {
  demoState.init();
  const currentAssignee = demoState.get()?.task.assignee ?? null;
  if (currentAssignee === assignee) {
    notify();
    return;
  }
  demoState.setAssignee(assignee);
  notify();
};

const setTaskStatus = (status: 'open' | 'in-progress' | 'review' | 'done') => {
  demoState.init();
  const currentStatus = demoState.get()?.task.status;
  if (currentStatus === status) {
    notify();
    return;
  }
  demoState.setStatus(status);
  notify();
};

const setCommentDraft = (value: string) => {
  demoState.init();
  demoState.setCommentDraft(value);
  notify();
};

const ensureCommentDraftState = () => {
  demoState.init();
  removeUserComments();
  setCommentDraft(PREFILL_COMMENT);
};

const ensureCommentPostedState = () => {
  const state = demoState.init();
  if (!state.task.comments.some((c) => c.author === 'You')) {
    demoState.addComment({
      id: Math.floor(Math.random() * 100000),
      author: 'You',
      content: PREFILL_COMMENT,
      createdAt: new Date().toISOString(),
    });
  }
  setCommentDraft('');
};

const dispatchInteractableEvent = (id: string, open: boolean) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(`guided-tour:interactable-${open ? 'open' : 'close'}`, {
      detail: { id },
    })
  );
};

const setAssignModalOpen = (open: boolean) => {
  demoState.init();
  demoState.setAssignModalOpen(open);
  dispatchInteractableEvent(ASSIGN_MODAL_ID, open);
  notify();
};

const setPreviewModalOpen = (open: boolean, attachmentId: number | null = null) => {
  demoState.init();
  demoState.setPreviewOpen(open, attachmentId);
  dispatchInteractableEvent(PREVIEW_MODAL_ID, open);
  notify();
};

const helloStep: StepDefinition = {
  id: 'hello',
  route: '/',
  tooltip: { placement: 'center' },
  content: {
    title: 'Hey there',
    body: 'Welcome aboard. This tour shows off ==RoutePilot== — the engine powering everything you\'re about to see.\n\nAnd yes, the tooltip body can render ==|media|==: drop any ==|ReactNode|== into ==|content.media|== — a ==|<img>|==, a ==|<video>|==, a ==GIF==, a chart — and it appears right under the body copy.',
    media: createElement('img', {
      src: helloGifUrl,
      alt: 'Welcome animation',
      loading: 'eager',
    }),
  },
};

const welcomeStep: StepDefinition = {
  id: 'welcome',
  route: '/',
  tooltip: { placement: 'center' },
  content: {
    title: 'This is RoutePilot',
    body: 'You\'re inside a live tour running on top of a mock ticketing UI.\n\nThe ticketing app is just the canvas — watch what the ==engine== is doing: ==seeding state==, ==intercepting clicks and API calls==, ==simulating teammates==, ==injecting mock data== that never touches your real store.\n\nEverything you\'re about to see is a single ==|TourDefinition|== in your repo.',
  },
};

const dashboardSteps: StepDefinition[] = [
  helloStep,
  welcomeStep,
  createStep(
    'stats', '/', '[data-tour="stats-section"]',
    'Any DOM node is a target',
    'A step is a CSS selector. The engine resolves the element, scrolls it in, anchors the tooltip, and draws the highlight — no layout changes in your app.',
  ),
  createStep(
    'quick-actions', '/', '[data-tour="action-create"]',
    'Theming — button highlight',
    'That animated conic-gradient ring is ==|.tour-outline-shimmer|==. Speed (==|--tour-outline-speed|==), opacity (==|--tour-outline-opacity|==), thickness — all CSS tokens. Inputs fall back to a pulse driven by ==|--tour-outline-pulse-speed|==. Swap the class for your own highlight component to replace the effect entirely.',
  ),
  {
    id: 'theme-highlight',
    route: '/',
    tooltip: { placement: 'center' },
    content: {
      title: 'Theming — text highlights & pills',
      body: 'Markup is inline in the ==|body|== string. Wrap text in ==|==double equals==|== for a ==shimmering highlight==. Wrap it in ==|==|pipe-equals|==|== for an ==|inline pill|==. No JSX, no slots — the renderer parses the body and swaps in styled spans.\n\nShimmer is ==|--tour-text-shimmer|== × ==|--tour-text-shimmer-speed|==. Pills render from ==|--tour-pill-bg-from|==, ==|--tour-pill-bg-to|==, ==|--tour-pill-radius|==, ==|--tour-pill-padding|==. Brand palette, dark-mode override via ==|[data-theme=dark]|==, per-tenant themes — plain CSS tokens, zero JS.',
    },
  },
  {
    id: 'theme-backdrop',
    route: '/',
    tooltip: { placement: 'center' },
    content: {
      title: 'Theming — backdrop & spotlight',
      body: 'The dimmed overlay and the cut-out halo around the target are independent: ==|--tour-backdrop-opacity|== for the scrim, ==|--tour-spotlight-bg|== for the ring. Disable either, or replace the whole overlay with your own React component — the engine only cares that you mount ==|<GuidedTourOverlay />|==.',
    },
  },
  {
    id: 'auto-timer',
    route: '/',
    tooltip: { placement: 'center' },
    content: {
      title: 'Hands-free auto-advance',
      body: 'This step is moving on in ==4 seconds== — no click required. Set ==|autoAdvance: { delay: 4000 }|== on the step and the engine schedules the transition on enter.\n\nNeed a conditional trigger? Pass a ==|check|== predicate (polled every ==|interval|==) and the engine advances the instant it returns true — wait for an API to settle, a DOM attribute to flip, a feature flag to resolve.',
    },
    autoAdvance: { delay: 4000 },
  },
  createStep(
    'urgent', '/', '[data-tour="urgent-section"]',
    'Chapters & skipping',
    'Steps group into chapters. Users skip forward, jump back, or resume mid-tour — the engine re-runs ==preparations== so state always matches the target step.',
  ),
  createStep(
    'nav-overview', '/', '[data-tour="nav-tasks"]',
    'Navigation adapter',
    'The next chapter lives on another route. The engine delegates to your router via a small adapter — ==React Router== here, any ==|navigate(path)|== function works.',
  ),
];

const taskListSteps: StepDefinition[] = [
  createStep(
    'list-overview', '/tasks', '[data-tour="task-list-table"]',
    'Mock data lives in the engine',
    'The top row — ==|~Integrate payment gateway~|== — isn\'t in your task store. The tour owns it, injects it at runtime, tears it down on exit. Your real data is never touched.',
  ),
  createStep(
    'list-status-col', '/tasks', '[data-tour="col-status"]',
    'Non-interactive targets',
    'Selectors don\'t need to be clickable. Anchor tooltips to column headers, chart axes, empty-state illustrations — anything you can ==|querySelector|==.',
  ),
  createStep(
    'list-click-task', '/tasks',
    `highlight:[data-tour="task-row-${DEMO_ID}"]`,
    'Gated clicks',
    'The engine only accepts the highlighted click. Stray clicks elsewhere are ignored while the step is active, so tour state can\'t leak from accidental interactions.',
    undefined,
    { click: { all: [`[data-tour="task-row-${DEMO_ID}"]`] }, autoAdvance: true, autoAdvanceDelay: 300 },
  ),
];

const detailHeaderStep = createStep(
  'detail-header', DEMO_ROUTE, '[data-tour="task-header"]',
  'Preparations',
  'Before this step rendered, a ==preparation== set the task status to ==Open== and cleared stale drafts. Preparations are declarative — jump here from anywhere, the engine replays them.',
);

const detailStatusBarStep = createStep(
  'detail-status-bar', DEMO_ROUTE, '[data-tour="status-bar"]',
  'Automatic garbage collection',
  'The ==status-open== prep is ==|scope: \'group\'|== with ==|sharedWith: STATUS_OPEN_STEPS|==. Enter the group → factory runs. Leave → the ==cleanup function== it returned runs automatically. Ref-counted across steps, deferred on handoff so state never flickers — zero manual reset, zero leaks.',
);

const detailClickStatusStep = createStep(
  'detail-click-status', DEMO_ROUTE,
  `highlight:[data-tour="status-in-progress"]`,
  'Real click simulation',
  'The engine dispatches a real synthetic event. Your ==|onClick|== fires, reducers run, UI updates — no mock, no fake path. Bugs that reach prod reach the tour.',
  undefined,
  { click: { all: [`[data-tour="status-in-progress"]`] }, autoAdvance: true, autoAdvanceDelay: 500 },
);

const detailStatusChangedStep = createStep(
  'detail-status-changed', DEMO_ROUTE, '[data-tour="status-bar"]',
  'Preparation handoff',
  'A new group prep takes over — holding ==in-progress== for every step that follows. The engine defers the previous group\'s cleanup until the new one has acquired, so transitions are flicker-free.',
);

const detailDescriptionStep = createStep(
  'detail-description', DEMO_ROUTE, '[data-tour="task-description"]',
  'Placement',
  'Tooltips auto-place with collision detection. Override with ==|placement: \'top\' | \'bottom\' | \'left\' | \'right\' | \'center\'|== per step.',
  'right',
);

const taskDetailSteps: StepDefinition[] = [
  detailHeaderStep,
  detailStatusBarStep,
  detailClickStatusStep,
  detailStatusChangedStep,
  detailDescriptionStep,
];

const attachmentsOverviewStep = createStep(
  'attachments-overview', DEMO_ROUTE, '[data-tour="attachments-section"]',
  'Rich canvas, no rebuild',
  'Images, logs, markdown, JSON — the tour highlights whatever\'s already on screen. You don\'t ship tour-friendly component variants.',
);

const attachmentClickImageStep = createStep(
  'attachment-click-image', DEMO_ROUTE,
  'highlight:[data-tour="first-attachment"]',
  'Interactables: open',
  'An ==interactable== is a UI surface (modal, drawer, popover) the tour can open, close, or lock. Watch the next step open this preview modal declaratively.',
  undefined,
  { click: { all: ['[data-tour="first-attachment"]'] }, autoAdvance: true, autoAdvanceDelay: 300 },
);

const attachmentPreviewImageStep = createStep(
  'attachment-preview-image', DEMO_ROUTE, '[data-tour="preview-modal"]',
  'Interactables: lockClose + timed advance',
  'A ==preparation== opened this modal; the step ==locks== it closed so ✕ and backdrop clicks are inert — the tour can\'t be dismissed by dismissing the surface.\n\nAnd — this step auto-advances after ==2 seconds== on its own. Same ==|autoAdvance: { delay }|== primitive; great for showcases, splash screens, or letting an animation play out before continuing.',
  'center',
);
attachmentPreviewImageStep.autoAdvance = { delay: 2000 };

const attachmentJsonIntroStep = createStep(
  'attachment-json-intro', DEMO_ROUTE, '[data-tour="attachments-section"]',
  'Any content type',
  'Diffs, source code, markdown, raw logs — tours don\'t care what\'s inside the element. Highlight, annotate, move on.',
);

const attachmentSteps: StepDefinition[] = [
  attachmentsOverviewStep,
  attachmentClickImageStep,
  attachmentPreviewImageStep,
  attachmentJsonIntroStep,
];

const detailSidebarStep = createStep(
  'detail-sidebar', DEMO_ROUTE, '[data-tour="task-sidebar"]',
  "placement: 'left'",
  'Same tooltip primitive, anchored on the left. One config line — the engine handles positioning, arrow, and collision avoidance.',
  'left',
);

const detailAssignBtnStep = createStep(
  'detail-assign-btn', DEMO_ROUTE, 'highlight:[data-tour="assign-btn"]',
  'Gated clicks',
  'Click ==|Assign|==. The engine only accepts clicks on the highlighted element — stray clicks elsewhere are blocked. Once yours lands, the tour continues on its own (==|autoAdvance|== + ==|autoAdvanceDelay: 300|==).',
  undefined,
  { click: { all: ['[data-tour="assign-btn"]'] }, autoAdvance: true, autoAdvanceDelay: 300 },
);

const assignModalStep = createStep(
  'assign-modal', DEMO_ROUTE, '[data-tour="assign-modal"]',
  'Engine-owned modals',
  'A preparation opened this modal. ==lockClose== keeps it un-dismissible for the step\'s duration. Both behaviors are declarative — no imperative open/close in your component tree.',
);
assignModalStep.behavior = {
  interactables: {
    lockClose: { id: ASSIGN_MODAL_ID },
  },
};
assignModalStep.clickSelectors = [
  ...(assignModalStep.clickSelectors ?? []),
  '[data-tour="assign-modal"]',
];

const assignPickStep = createStep(
  'assign-pick', DEMO_ROUTE,
  'highlight:[data-tour="assign-user-alice"]',
  'Selectors through portals',
  'Modal contents live in a React portal. The engine re-resolves selectors across re-renders — dynamic subtrees, dropdown menus, teleported content all work.',
  undefined,
  { click: { all: ['[data-tour="assign-user-alice"]'] }, autoAdvance: true, autoAdvanceDelay: 300 },
);
assignPickStep.behavior = {
  interactables: {
    lockClose: { id: ASSIGN_MODAL_ID },
  },
};
assignPickStep.clickSelectors = [
  ...(assignPickStep.clickSelectors ?? []),
  '[data-tour="assign-modal"]',
];

const assignDoneStep = createStep(
  'assign-done', DEMO_ROUTE, '[data-tour="task-assignee"]',
  'Simulated teammates',
  '==Alice== is now the assignee — simulated. The engine lets you stage multi-user scenarios (teammate comments, presence, concurrent edits) without a backend or a second session.',
);
assignDoneStep.behavior = {
  interactables: {
    close: { id: ASSIGN_MODAL_ID },
  },
};

const sidebarAndAssignSteps: StepDefinition[] = [
  detailSidebarStep,
  detailAssignBtnStep,
  assignModalStep,
  assignPickStep,
  assignDoneStep,
];

const commentsSectionStep = createStep(
  'comments-section', DEMO_ROUTE, '[data-tour="comments-section"]',
  'Injected discussion',
  'These comments don\'t exist in your app\'s store. The engine injected them into its mirrored task state. On tour exit, they vanish.',
);

const commentTypeStep: StepDefinition = {
  id: 'comment-type',
  route: DEMO_ROUTE,
  selector: '[data-tour="comment-input"]',
  selectors: [],
  clickSelectors: ['[data-tour="comment-input"]'],
  content: {
    title: 'DOM side-effects as preparations',
    body: `The pre-filled draft =="${PREFILL_COMMENT}"== was dispatched via a real ==|input|== event — React state updates exactly as if the user typed it.`,
  },
  tooltip: { placement: 'top' },
};

const commentSubmitStep = createStep(
  'comment-submit', DEMO_ROUTE,
  ['[data-tour="comment-input"]', 'highlight:[data-tour="comment-submit"]'],
  'Request interception',
  'Click ==|~Add Comment~|==. Your submit handler runs. The engine intercepts the mutation and routes it to demo state — zero network traffic.',
  'top',
  { click: { all: ['[data-tour="comment-submit"]'] }, autoAdvance: true, autoAdvanceDelay: 500 },
);

const commentPostedStep = createStep(
  'comment-posted', DEMO_ROUTE, '[data-tour="latest-comment"]',
  'Reversible state',
  'Jump back → the comment is rolled back via the prep\'s cleanup. Jump forward → the post-state prep re-runs the insertion. Preparations own both directions of time.',
);

const commentSteps: StepDefinition[] = [
  commentsSectionStep,
  commentTypeStep,
  commentSubmitStep,
  commentPostedStep,
];

const goCreateStep = createStep(
  'go-create-task', DEMO_ROUTE,
  'highlight:[data-tour="nav-create"]',
  'Route transitions',
  'Next chapter is on ==|/tasks/new|==. The engine waits for your router to confirm the location, then runs the next step\'s preparations before showing the tooltip.',
  undefined,
  { click: { all: ['[data-tour="nav-create"]'] }, autoAdvance: true, autoAdvanceDelay: 300 },
);

const createTaskSteps: StepDefinition[] = [
  createStep(
    'create-form', '/tasks/new', '[data-tour="create-form"]',
    'Forms are just DOM',
    'No dedicated form API. Target inputs, textareas, dropdowns, labels — whatever\'s on screen.',
  ),
  createStep(
    'create-title', '/tasks/new', '[data-tour="field-title"]',
    'Keyboard & a11y',
    'Arrow keys, ==Escape==, ==Enter== are wired up. ARIA live regions announce step changes. Opt out per step when you need to.',
  ),
  createStep(
    'create-description', '/tasks/new', '[data-tour="field-description"]',
    'Multi-target steps',
    'A step can highlight multiple elements. Pass an array to ==|selector|== — the engine draws each outline and anchors one tooltip.',
  ),
  createStep(
    'create-priority', '/tasks/new', '[data-tour="field-priority"]',
    'Conditional branching',
    'The next step can be computed at runtime: ==|nextStep: (ctx) => ...|==. Branch on user role, feature flag, or a previous step\'s outcome.',
    'right',
  ),
  createStep(
    'create-attachments-section', '/tasks/new', '.upload-dropzone',
    'Complex widgets',
    'Dropzones, sortable lists, drag handles — all targetable. The next step turns this tour into a live ==FAQ==.',
  ),
  createStep(
    'create-attachments-add-image', '/tasks/new',
    'highlight:.upload-dropzone .attach-btn',
    'Live FAQ setup',
    'Tours aren\'t just for onboarding. When a predictable failure hits — wrong file type, expired token, missing scope — branch to a remediation step. Watch.',
  ),
  (() => {
    const step = createStep(
      'create-attachments-failed', '/tasks/new',
      '[data-tour-injected="upload-error"]',
      'Tour-as-FAQ, live',
      'The engine injected the error element into the DOM, anchored a tooltip to it, and showed contextual remediation (==|.heic|== not allowed, common on iPhone). Users got guidance without leaving the flow — same tour handles happy and failure paths.',
    );
    step.preparations = [
      ...(step.preparations ?? []),
      {
        id: 'inject-upload-error',
        scope: 'step',
        factory: async () => {
          const dropzone = document.querySelector<HTMLElement>('.upload-dropzone');
          if (!dropzone) return;
          document
            .querySelectorAll('[data-tour-injected="upload-error"]')
            .forEach((el) => el.remove());
          const errorEl = document.createElement('div');
          errorEl.setAttribute('data-tour-injected', 'upload-error');
          errorEl.style.cssText = [
            'margin-top: 0.75rem',
            'padding: 0.75rem 1rem',
            'border-radius: 0.5rem',
            'background: rgba(239, 68, 68, 0.12)',
            'border: 1px solid rgba(239, 68, 68, 0.45)',
            'color: #b91c1c',
            'font-size: 0.875rem',
            'font-weight: 500',
            'display: flex',
            'align-items: center',
            'gap: 0.5rem',
          ].join('; ');
          errorEl.innerHTML =
            '<span aria-hidden="true">⚠</span>' +
            '<span>Upload failed: <code>iphone-photo.heic</code> — file type <code>.heic</code> is not allowed.</span>';
          dropzone.insertAdjacentElement('afterend', errorEl);
          return async () => {
            errorEl.remove();
          };
        },
      },
    ];
    return step;
  })(),
  createStep(
    'create-submit', '/tasks/new',
    '[data-tour="submit-btn"]',
    'Submit interception',
    'Clicking would POST a new task. The engine catches the mutation; nothing persists. On exit, the mock task is torn down — your app state stays pristine.',
  ),
];

const finalStep: StepDefinition = {
  id: 'complete',
  route: '/',
  tooltip: { placement: 'center' },
  content: {
    title: 'You built an onboarding engine',
    body: '==Congrats== — you now know every primitive you need to ==engineer your own custom onboarding experience==.\n\n==|Preparations|== · ==|API interception|== · ==|Simulated users|== · ==|Mock data|== · ==|Declarative styling|== · ==|Inline media|== · ==|Skip / jump / resume|==\n\nAll from one ==|TourDefinition|==. Three lines in your ==|App|== root wire it up. The ticketing canvas below never knew the tour existed.',
    media: createElement('img', {
      src: completeGifUrl,
      alt: 'Celebration animation',
      loading: 'eager',
    }),
  },
};

// Every step in the tour except `welcome` itself — used as sharedWith on the
// tour-scope seed prep so that jumping to ANY step guarantees demoState is
// initialized (injected task + UI flags) before the target route renders.
const ALL_NON_WELCOME_STEPS = [
  'stats', 'quick-actions', 'urgent', 'nav-overview',
  'list-overview', 'list-status-col', 'list-click-task',
  ...STATUS_OPEN_STEPS,
  ...STATUS_IN_PROGRESS_STEPS,
];

welcomeStep.preparations = [
  ...(welcomeStep.preparations ?? []),
  {
    id: DEMO_SEED_PREP_ID,
    scope: 'tour',
    sharedWith: ALL_NON_WELCOME_STEPS,
    factory: async () => {
      demoState.init();
      notify();
      return async () => {
        demoState.reset();
        notify();
      };
    },
  },
];

detailHeaderStep.preparations = [
  ...(detailHeaderStep.preparations ?? []),
  {
    id: STATUS_OPEN_PREP_ID,
    scope: 'group',
    sharedWith: STATUS_OPEN_STEPS,
    factory: async () => {
      setTaskStatus('open');
    },
  },
];

detailStatusChangedStep.preparations = [
  ...(detailStatusChangedStep.preparations ?? []),
  {
    id: STATUS_IN_PROGRESS_PREP_ID,
    scope: 'group',
    sharedWith: STATUS_IN_PROGRESS_STEPS,
    factory: async () => {
      setTaskStatus('in-progress');
      return async () => {
        setTaskStatus('open');
      };
    },
  },
];

attachmentPreviewImageStep.preparations = [
  ...(attachmentPreviewImageStep.preparations ?? []),
  {
    id: ATTACHMENT_PREVIEW_PREP_ID,
    scope: 'step',
    factory: async () => {
      setPreviewModalOpen(true);
      return async () => {
        setPreviewModalOpen(false);
      };
    },
  },
];

detailAssignBtnStep.preparations = [
  ...(detailAssignBtnStep.preparations ?? []),
  {
    id: ASSIGNMENT_RESET_PREP_ID,
    scope: 'group',
    sharedWith: ASSIGNMENT_RESET_STEPS,
    factory: async () => {
      setAssignmentAssignee(null);
    },
  },
];

assignModalStep.preparations = [
  ...(assignModalStep.preparations ?? []),
  {
    id: ASSIGNMENT_MODAL_PREP_ID,
    scope: 'group',
    sharedWith: ASSIGN_MODAL_OPEN_STEPS,
    factory: async () => {
      setAssignModalOpen(true);
      return async () => {
        setAssignModalOpen(false);
      };
    },
  },
];

assignDoneStep.preparations = [
  ...(assignDoneStep.preparations ?? []),
  {
    id: ASSIGNED_ALICE_PREP_ID,
    scope: 'group',
    sharedWith: ASSIGNED_ALICE_STEPS,
    factory: async () => {
      setAssignModalOpen(false);
      setAssignmentAssignee(ASSIGNED_USER);
      return async () => {
        setAssignmentAssignee(null);
      };
    },
  },
];

commentTypeStep.preparations = [
  ...(commentTypeStep.preparations ?? []),
  {
    id: COMMENT_DRAFT_PREP_ID,
    scope: 'group',
    sharedWith: COMMENT_DRAFT_STEPS,
    factory: async () => {
      ensureCommentDraftState();
      return async () => {
        setCommentDraft('');
      };
    },
  },
];

commentPostedStep.preparations = [
  ...(commentPostedStep.preparations ?? []),
  {
    id: COMMENT_POSTED_PREP_ID,
    scope: 'group',
    sharedWith: COMMENT_POSTED_STEPS,
    factory: async () => {
      ensureCommentPostedState();
      return async () => {
        removeUserComments();
      };
    },
  },
];

const withChapter = (steps: StepDefinition[], chapter: string): StepDefinition[] =>
  steps.map((s) => ({ ...s, chapter: s.chapter ?? chapter }));

export const demoTour: TourDefinition = {
  id: 'demo-tour',
  name: 'RoutePilot — live demo canvas',
  description: 'Engine capabilities demonstrated on a mock ticketing UI',
  confetti: {
    enabled: true,
    duration: 5000,
    colors: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'],
  },
  onStart: (_ctx) => {
    demoState.init();
    notify();
  },
  onFinish: (_ctx) => {
    demoState.reset();
    notify();
  },
  steps: [
    ...withChapter(dashboardSteps, 'Dashboard'),
    ...withChapter(taskListSteps, 'Task List'),
    ...withChapter(taskDetailSteps, 'Task Detail'),
    ...withChapter(attachmentSteps, 'Attachments'),
    ...withChapter(sidebarAndAssignSteps, 'Assignment'),
    ...withChapter(commentSteps, 'Comments'),
    { ...goCreateStep, chapter: 'Create Task' },
    ...withChapter(createTaskSteps, 'Create Task'),
    { ...finalStep, chapter: 'Complete' },
  ],
};
