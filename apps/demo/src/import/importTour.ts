import { createElement } from 'react';
import type { TourDefinition, StepDefinition } from '@routepilot/react';
import { createStep } from '@routepilot/react';
import { importState } from './importState';
import errorGifUrl from '../assets/error_gif.gif';

const IMPORT_ROUTE = '/import';

const notify = () => {
  window.dispatchEvent(new CustomEvent('import-tour:state-changed'));
};

const seedImportState = () => {
  importState.init();
  notify();
};

const resetImportState = () => {
  importState.reset();
  notify();
};

const errorGifIntroStep: StepDefinition = {
  id: 'error-gif-intro',
  route: IMPORT_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Errors happen. Rage-quitting shouldn\'t.',
    body: 'Your users just uploaded a CSV. The parser found ==3 problems==. In most apps, this is where they open a support ticket, alt-tab to Stack Overflow, or — if the meme is accurate — ==yeet the hardware==.\n\nWhat if the app ==actually walked them through the fix== instead? That\'s what this tour does. Press ==|Next|== before you throw anything.',
    media: createElement('img', {
      src: errorGifUrl,
      alt: 'Developer throwing PC in the trash after getting an error in HTML',
      loading: 'eager',
    }),
  },
};

const recoveryIntroStep: StepDefinition = {
  id: 'recovery-intro',
  route: IMPORT_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Your import hit a wall — let\'s fix it',
    body: 'This CSV has ==3 validation errors== blocking the import. Instead of dumping an error log and hoping for the best, the tour will ==walk you through each fix==, one at a time, inside the app.\n\nThis is what ==error recovery== looks like when the product ==actually helps==. Press ==|Next|== to start.',
  },
};

const errorOverviewStep = createStep(
  'error-overview', IMPORT_ROUTE, '[data-tour="error-banner"]',
  'The error summary',
  'This banner is the ==trigger point==. It tells the user ==3 errors== at a glance — grouped by type. The ==|Help me fix these|== button is what launched this tour.\n\nIn production you\'d wire that CTA to ==|startWithDefinition(recoveryTour)|== — one line of code, zero new UI to build.',
  'bottom',
);

const errorMissingStep = createStep(
  'error-missing', IMPORT_ROUTE, '[data-tour="error-row-1"]',
  'Error 1 — Missing column mapping',
  'The ==email== column from the CSV isn\'t mapped to any target field. The import can\'t proceed because ==|email|== is marked ==required== in the schema.\n\nThe fix: map it to the right target column. Watch.',
  'right',
);

const fixMappingStep = createStep(
  'fix-mapping', IMPORT_ROUTE, '[data-tour="mapping-email"]',
  'Fix applied: email → email_address',
  'We just mapped ==|email|== → ==|email_address|==. The tour\'s ==preparation== did this — same primitive you\'d use to pre-fill a form, toggle a setting, or inject any state the step needs.\n\nThe error row now shows ==resolved==. One down, two to go.',
  'left',
);
fixMappingStep.preparations = [
  {
    id: 'fix-email-mapping',
    scope: 'tour',
    factory: async () => {
      importState.resolveError(1);
      importState.setMapping('email', 'email_address');
      notify();
      return async () => {
        importState.unresolveError(1);
        importState.setMapping('email', null);
        notify();
      };
    },
  },
];

const errorTypeStep = createStep(
  'error-type', IMPORT_ROUTE, '[data-tour="error-row-2"]',
  'Error 2 — Type mismatch',
  'Row ==14== has ==|twenty-three|== in the ==|age|== column. The schema expects a ==number==. The importer can\'t coerce this automatically.\n\nThe fix: correct the value — or apply a transform rule.',
  'right',
);

const fixTypeStep = createStep(
  'fix-type', IMPORT_ROUTE, '[data-tour="preview-row-14"]',
  'Fix applied: value corrected',
  'The cell now reads ==|23|==. In production this could be a manual edit, a regex transform, or an AI suggestion. The tour ==demonstrated the fix== by mutating the preview via its ==preparation factory==.\n\nTwo down.',
  'top',
);
fixTypeStep.preparations = [
  {
    id: 'fix-age-value',
    scope: 'tour',
    factory: async () => {
      importState.resolveError(2);
      importState.fixPreviewValue(14, 'age', '23');
      notify();
      return async () => {
        importState.unresolveError(2);
        importState.unfixPreviewValue(14, 'age', 'twenty-three');
        notify();
      };
    },
  },
];

const errorDuplicateStep = createStep(
  'error-duplicate', IMPORT_ROUTE, '[data-tour="error-row-3"]',
  'Error 3 — Duplicate key',
  'Rows ==7== and ==42== share the same ==|employee_id|==: ==|E-1047|==. The target table has a ==unique constraint== on this field, so the import would violate it.\n\nThe fix: tell the importer how to handle collisions.',
  'right',
);

const fixDedupStep = createStep(
  'fix-dedup', IMPORT_ROUTE, '[data-tour="dedup-section"]',
  'Fix applied: skip duplicates',
  'We selected ==|Skip duplicates|== — row 42 will be dropped, row 7 (first occurrence) stays. ==|Overwrite|== would replace the existing record instead.\n\nAll three ==preparations== ran in sequence; each one\'s cleanup is registered with the engine and reverts on tour end. Three for three.',
  'top',
);
fixDedupStep.preparations = [
  {
    id: 'fix-dedup-strategy',
    scope: 'tour',
    factory: async () => {
      importState.resolveError(3);
      importState.setDedupStrategy('skip');
      notify();
      return async () => {
        importState.unresolveError(3);
        importState.setDedupStrategy(null);
        notify();
      };
    },
  },
];

const revalidateStep = createStep(
  'revalidate', IMPORT_ROUTE, '[data-tour="revalidate-btn"]',
  'Re-validate to confirm',
  'All three fixes are in place. Hitting ==|Re-validate|== re-runs the pipeline check. Watch the error count drop to ==zero== and the banner turn ==green==.',
  'left',
);
revalidateStep.preparations = [
  {
    id: 'run-revalidation',
    scope: 'tour',
    factory: async () => {
      importState.revalidate();
      notify();
      return async () => {
        importState.setStatus('errors');
        notify();
      };
    },
  },
];

const recoverySuccessStep = createStep(
  'recovery-success', IMPORT_ROUTE, '[data-tour="import-btn"]',
  'Clean bill of health',
  'Zero errors. The ==|Import 847 rows|== button is live. In production the user clicks it and they\'re done — no support ticket, no Slack thread, no context switch.\n\nThe tour just ==turned a 15-minute debug session into 30 seconds==.',
  'left',
);

const recoveryOutroStep: StepDefinition = {
  id: 'recovery-outro',
  route: IMPORT_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Error recovery, not error reporting',
    body: 'Most apps stop at ==telling== the user something broke. This tour ==showed them how to fix it== — inside the app, with the data they\'re working on.\n\nSame engine. Same ==|TourDefinition|==. Different trigger: not a welcome mat, but a ==safety net==.\n\nThree preparation patterns in this tour: ==column re-mapping==, ==value correction==, and ==strategy selection==. Each one\'s cleanup is registered with the engine — when the tour ends, the demo state reverts cleanly.',
  },
};

const allSteps: StepDefinition[] = [
  errorGifIntroStep,
  recoveryIntroStep,
  errorOverviewStep,
  errorMissingStep,
  fixMappingStep,
  errorTypeStep,
  fixTypeStep,
  errorDuplicateStep,
  fixDedupStep,
  revalidateStep,
  recoverySuccessStep,
  recoveryOutroStep,
];

errorGifIntroStep.preparations = [
  ...(errorGifIntroStep.preparations ?? []),
  {
    id: 'import-seed',
    scope: 'tour',
    sharedWith: allSteps.filter((s) => s.id !== 'error-gif-intro').map((s) => s.id),
    factory: async () => {
      seedImportState();
      return async () => resetImportState();
    },
  },
];

const withChapter = (steps: StepDefinition[], chapter: string): StepDefinition[] =>
  steps.map((s) => ({ ...s, chapter: s.chapter ?? chapter }));

export const errorRecoveryTour: TourDefinition = {
  id: 'error-recovery',
  name: 'DataBridge — Error recovery tour',
  description: 'Guided error recovery for a CSV import pipeline',
  onStart: () => {
    seedImportState();
  },
  onFinish: () => {
    resetImportState();
  },
  steps: [
    ...withChapter([errorGifIntroStep, recoveryIntroStep, errorOverviewStep], 'Overview'),
    ...withChapter([errorMissingStep, fixMappingStep], 'Missing mapping'),
    ...withChapter([errorTypeStep, fixTypeStep], 'Type mismatch'),
    ...withChapter([errorDuplicateStep, fixDedupStep], 'Duplicate key'),
    ...withChapter([revalidateStep, recoverySuccessStep, recoveryOutroStep], 'Resolve'),
  ],
};
