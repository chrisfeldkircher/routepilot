import type { TourDefinition, StepDefinition } from '@routepilot/engine';
import { createStep } from '@routepilot/engine';
import { demoState, DEMO_ID } from '../state/demoState';

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
  if (currentAssignee === assignee) { notify(); return; }
  demoState.setAssignee(assignee);
  notify();
};

const setTaskStatus = (status: 'open' | 'in-progress' | 'review' | 'done') => {
  demoState.init();
  const currentStatus = demoState.get()?.task.status;
  if (currentStatus === status) { notify(); return; }
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
  route: '/dashboard',
  tooltip: { placement: 'center' },
  content: {
    title: 'Hey there',
    body: 'Welcome aboard. This tour shows off ==RoutePilot== — the engine powering everything you\'re about to see.\n\nThe tooltip body supports ==|media|==: pass a string URL — or an object with ==|{ src, alt, loading }|== / ==|{ html }|== — and the overlay renders it below the body copy.',
    media: {
      src: 'https://media.giphy.com/media/Nx0rz3jtxtEre/giphy.gif',
      alt: 'Obi-Wan Kenobi smiling with a cheerful "Hello there" in Star Wars: Revenge of the Sith',
      loading: 'eager',
    },
  },
};

const welcomeStep: StepDefinition = {
  id: 'welcome',
  route: '/dashboard',
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
    'stats', '/dashboard', '[data-tour="stats-section"]',
    'Any DOM node is a target',
    'A step is a CSS selector. The engine resolves the element, scrolls it in, anchors the tooltip, and draws the highlight — no layout changes in your app.',
  ),
  createStep(
    'quick-actions', '/dashboard', '[data-tour="action-create"]',
    'Theming — button highlight',
    'That animated conic-gradient ring is ==|.tour-outline-shimmer|==. Speed, opacity, thickness — all CSS tokens.',
  ),
  {
    id: 'theme-highlight',
    route: '/dashboard',
    tooltip: { placement: 'center' },
    content: {
      title: 'Theming — text highlights & pills',
      body: 'Markup is inline in the ==|body|== string. Wrap text in ==|==double equals==|== for a ==shimmering highlight==. Wrap it in ==|==|pipe-equals|==|== for an ==|inline pill|==.',
    },
  },
  {
    id: 'theme-backdrop',
    route: '/dashboard',
    tooltip: { placement: 'center' },
    content: {
      title: 'Theming — backdrop & spotlight',
      body: 'The dimmed overlay and the cut-out halo around the target are independent: ==|--tour-backdrop-opacity|== for the scrim, ==|--tour-spotlight-bg|== for the ring.',
    },
  },
  {
    id: 'auto-timer',
    route: '/dashboard',
    tooltip: { placement: 'center' },
    content: {
      title: 'Hands-free auto-advance',
      body: 'This step is moving on in ==4 seconds== — no click required. Set ==|autoAdvance: { delay: 4000 }|== on the step and the engine schedules the transition on enter.',
    },
    autoAdvance: { delay: 4000 },
  },
  createStep(
    'urgent', '/dashboard', '[data-tour="urgent-section"]',
    'Chapters & skipping',
    'Steps group into chapters. Users skip forward, jump back, or resume mid-tour — the engine re-runs ==preparations== so state always matches the target step.',
  ),
  createStep(
    'nav-overview', '/dashboard', '[data-tour="nav-tasks"]',
    'Navigation adapter',
    'The next chapter lives on another route. The engine delegates to your router via a small adapter — ==Angular Router== here, any ==|navigate(path)|== function works.',
  ),
];

const taskListSteps: StepDefinition[] = [
  createStep(
    'list-overview', '/tasks', '[data-tour="task-list-table"]',
    'Mock data lives in the engine',
    'The top row — ==|~Integrate payment gateway~|== — isn\'t in your task store. The tour owns it, injects it at runtime, tears it down on exit.',
  ),
  createStep(
    'list-status-col', '/tasks', '[data-tour="col-status"]',
    'Non-interactive targets',
    'Selectors don\'t need to be clickable. Anchor tooltips to column headers, chart axes, empty-state illustrations.',
  ),
  createStep(
    'list-click-task', '/tasks',
    `highlight:[data-tour="task-row-${DEMO_ID}"]`,
    'Gated clicks',
    'The engine only accepts the highlighted click. Stray clicks elsewhere are ignored.',
    undefined,
    { click: { all: [`[data-tour="task-row-${DEMO_ID}"]`] }, autoAdvance: true, autoAdvanceDelay: 300 },
  ),
];

const detailHeaderStep = createStep(
  'detail-header', DEMO_ROUTE, '[data-tour="task-header"]',
  'Preparations',
  'Before this step rendered, a ==preparation== set the task status to ==Open== and cleared stale drafts.',
);

const detailStatusBarStep = createStep(
  'detail-status-bar', DEMO_ROUTE, '[data-tour="status-bar"]',
  'Automatic garbage collection',
  'The ==status-open== prep is ==|scope: \'group\'|== with ==|sharedWith: STATUS_OPEN_STEPS|==. Enter → factory runs. Leave → cleanup runs automatically.',
);

const detailClickStatusStep = createStep(
  'detail-click-status', DEMO_ROUTE,
  `highlight:[data-tour="status-in-progress"]`,
  'Real click simulation',
  'The engine dispatches a real synthetic event. Your handler fires, state updates — no mock path.',
  undefined,
  { click: { all: [`[data-tour="status-in-progress"]`] }, autoAdvance: true, autoAdvanceDelay: 500 },
);

const detailStatusChangedStep = createStep(
  'detail-status-changed', DEMO_ROUTE, '[data-tour="status-bar"]',
  'Preparation handoff',
  'A new group prep takes over — holding ==in-progress== for every step that follows. Flicker-free transitions.',
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
  'Images, logs, markdown, JSON — the tour highlights whatever\'s already on screen.',
);

const attachmentClickImageStep = createStep(
  'attachment-click-image', DEMO_ROUTE,
  'highlight:[data-tour="first-attachment"]',
  'Interactables: open',
  'An ==interactable== is a UI surface (modal, drawer, popover) the tour can open, close, or lock.',
  undefined,
  { click: { all: ['[data-tour="first-attachment"]'] }, autoAdvance: true, autoAdvanceDelay: 300 },
);

const attachmentPreviewImageStep = createStep(
  'attachment-preview-image', DEMO_ROUTE, '[data-tour="preview-modal"]',
  'Interactables: lockClose + timed advance',
  'A ==preparation== opened this modal; the step ==locks== it so it can\'t be dismissed.\n\nThis step auto-advances after ==2 seconds==.',
  'center',
);
attachmentPreviewImageStep.autoAdvance = { delay: 2000 };

const attachmentJsonIntroStep = createStep(
  'attachment-json-intro', DEMO_ROUTE, '[data-tour="attachments-section"]',
  'Any content type',
  'Diffs, source code, markdown, raw logs — tours don\'t care what\'s inside the element.',
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
  'Same tooltip primitive, anchored on the left.',
  'left',
);

const detailAssignBtnStep = createStep(
  'detail-assign-btn', DEMO_ROUTE, 'highlight:[data-tour="assign-btn"]',
  'Gated clicks',
  'Click ==|Assign|==. The engine only accepts clicks on the highlighted element.',
  undefined,
  { click: { all: ['[data-tour="assign-btn"]'] }, autoAdvance: true, autoAdvanceDelay: 300 },
);

const assignModalStep = createStep(
  'assign-modal', DEMO_ROUTE, '[data-tour="assign-modal"]',
  'Engine-owned modals',
  'A preparation opened this modal. ==lockClose== keeps it un-dismissible for the step\'s duration.',
);
assignModalStep.behavior = {
  interactables: { lockClose: { id: ASSIGN_MODAL_ID } },
};
assignModalStep.clickSelectors = [
  ...(assignModalStep.clickSelectors ?? []),
  '[data-tour="assign-modal"]',
];

const assignPickStep = createStep(
  'assign-pick', DEMO_ROUTE,
  'highlight:[data-tour="assign-user-alice"]',
  'Selectors through portals',
  'Modal contents re-resolve across re-renders — dynamic subtrees, dropdown menus all work.',
  undefined,
  { click: { all: ['[data-tour="assign-user-alice"]'] }, autoAdvance: true, autoAdvanceDelay: 300 },
);
assignPickStep.behavior = {
  interactables: { lockClose: { id: ASSIGN_MODAL_ID } },
};
assignPickStep.clickSelectors = [
  ...(assignPickStep.clickSelectors ?? []),
  '[data-tour="assign-modal"]',
];

const assignDoneStep = createStep(
  'assign-done', DEMO_ROUTE, '[data-tour="task-assignee"]',
  'Simulated teammates',
  '==Alice== is now the assignee — simulated. The engine lets you stage multi-user scenarios.',
);
assignDoneStep.behavior = {
  interactables: { close: { id: ASSIGN_MODAL_ID } },
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
  'These comments don\'t exist in your app\'s store. The engine injected them.',
);

const commentTypeStep: StepDefinition = {
  id: 'comment-type',
  route: DEMO_ROUTE,
  selector: '[data-tour="comment-input"]',
  selectors: [],
  clickSelectors: ['[data-tour="comment-input"]'],
  content: {
    title: 'DOM side-effects as preparations',
    body: `The pre-filled draft =="${PREFILL_COMMENT}"== was dispatched via a real ==|input|== event.`,
  },
  tooltip: { placement: 'top' },
};

const commentSubmitStep = createStep(
  'comment-submit', DEMO_ROUTE,
  ['[data-tour="comment-input"]', 'highlight:[data-tour="comment-submit"]'],
  'Request interception',
  'Click ==|~Add Comment~|==. Your submit handler runs. The engine intercepts the mutation.',
  'top',
  { click: { all: ['[data-tour="comment-submit"]'] }, autoAdvance: true, autoAdvanceDelay: 500 },
);

const commentPostedStep = createStep(
  'comment-posted', DEMO_ROUTE, '[data-tour="latest-comment"]',
  'Reversible state',
  'Jump back → the comment is rolled back via the prep\'s cleanup. Jump forward → it re-runs.',
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
  'Next chapter is on ==|/tasks/new|==. The engine waits for your router to confirm the location.',
  undefined,
  { click: { all: ['[data-tour="nav-create"]'] }, autoAdvance: true, autoAdvanceDelay: 300 },
);

const createTaskSteps: StepDefinition[] = [
  createStep('create-form', '/tasks/new', '[data-tour="create-form"]', 'Forms are just DOM', 'No dedicated form API. Target inputs, textareas, dropdowns.'),
  createStep('create-title', '/tasks/new', '[data-tour="field-title"]', 'Keyboard & a11y', 'Arrow keys, ==Escape==, ==Enter== are wired up. ARIA live regions announce step changes.'),
  createStep('create-description', '/tasks/new', '[data-tour="field-description"]', 'Multi-target steps', 'A step can highlight multiple elements. Pass an array to ==|selector|==.'),
  createStep('create-priority', '/tasks/new', '[data-tour="field-priority"]', 'Conditional branching', 'The next step can be computed at runtime: ==|nextStep: (ctx) => ...|==.', 'right'),
  createStep('create-attachments-section', '/tasks/new', '.upload-dropzone', 'Complex widgets', 'Dropzones, sortable lists, drag handles — all targetable.'),
  createStep('create-attachments-add-image', '/tasks/new', 'highlight:.upload-dropzone .attach-btn', 'Live FAQ setup', 'Tours aren\'t just for onboarding. Watch what happens on a predictable failure.'),
  (() => {
    const step = createStep(
      'create-attachments-failed', '/tasks/new',
      '[data-tour-injected="upload-error"]',
      'Tour-as-FAQ, live',
      'The engine injected the error element into the DOM, anchored a tooltip to it, and showed contextual remediation.',
    );
    step.preparations = [
      ...(step.preparations ?? []),
      {
        id: 'inject-upload-error',
        scope: 'step',
        factory: async () => {
          const dropzone = document.querySelector<HTMLElement>('.upload-dropzone');
          if (!dropzone) return;
          document.querySelectorAll('[data-tour-injected="upload-error"]').forEach((el) => el.remove());
          const errorEl = document.createElement('div');
          errorEl.setAttribute('data-tour-injected', 'upload-error');
          errorEl.style.cssText = [
            'margin-top: 0.75rem', 'padding: 0.75rem 1rem', 'border-radius: 0.5rem',
            'background: rgba(239, 68, 68, 0.12)', 'border: 1px solid rgba(239, 68, 68, 0.45)',
            'color: #b91c1c', 'font-size: 0.875rem', 'font-weight: 500',
            'display: flex', 'align-items: center', 'gap: 0.5rem',
          ].join('; ');
          errorEl.innerHTML =
            '<span aria-hidden="true">⚠</span>' +
            '<span>Upload failed: <code>iphone-photo.heic</code> — file type <code>.heic</code> is not allowed.</span>';
          dropzone.insertAdjacentElement('afterend', errorEl);
          return async () => { errorEl.remove(); };
        },
      },
    ];
    return step;
  })(),
  createStep('create-submit', '/tasks/new', '[data-tour="submit-btn"]', 'Submit interception', 'Clicking would POST a new task. The engine catches the mutation; nothing persists.'),
];

const finalStep: StepDefinition = {
  id: 'complete',
  route: '/dashboard',
  tooltip: { placement: 'center' },
  content: {
    title: 'You built an onboarding engine',
    body: '==Congrats== — you now know every primitive you need.\n\n==|Preparations|== · ==|API interception|== · ==|Simulated users|== · ==|Mock data|== · ==|Declarative styling|== · ==|Inline media|== · ==|Skip / jump / resume|==\n\nAll from one ==|TourDefinition|==.',
    media: {
      src: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
      alt: 'Leonardo DiCaprio as Jay Gatsby raising a champagne glass in a celebratory toast with fireworks behind him',
      loading: 'eager',
    },
  },
};

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
      return async () => { demoState.reset(); notify(); };
    },
  },
];

detailHeaderStep.preparations = [
  ...(detailHeaderStep.preparations ?? []),
  {
    id: STATUS_OPEN_PREP_ID,
    scope: 'group',
    sharedWith: STATUS_OPEN_STEPS,
    factory: async () => { setTaskStatus('open'); },
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
      return async () => { setTaskStatus('open'); };
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
      return async () => { setPreviewModalOpen(false); };
    },
  },
];

detailAssignBtnStep.preparations = [
  ...(detailAssignBtnStep.preparations ?? []),
  {
    id: ASSIGNMENT_RESET_PREP_ID,
    scope: 'group',
    sharedWith: ASSIGNMENT_RESET_STEPS,
    factory: async () => { setAssignmentAssignee(null); },
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
      return async () => { setAssignModalOpen(false); };
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
      return async () => { setAssignmentAssignee(null); };
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
      return async () => { setCommentDraft(''); };
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
      return async () => { removeUserComments(); };
    },
  },
];

const withChapter = (steps: StepDefinition[], chapter: string): StepDefinition[] =>
  steps.map((s) => ({ ...s, chapter: s.chapter ?? chapter }));

export const onboardingTour: TourDefinition = {
  id: 'onboarding',
  name: 'RoutePilot — live demo canvas',
  description: 'Engine capabilities demonstrated on a mock ticketing UI',
  confetti: {
    enabled: true,
    duration: 5000,
    colors: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'],
  },
  onStart: (_ctx) => { demoState.init(); notify(); },
  onFinish: (_ctx) => { demoState.reset(); notify(); },
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
