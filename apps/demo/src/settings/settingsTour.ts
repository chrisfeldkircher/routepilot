import { createElement } from 'react';
import type { TourDefinition, StepDefinition } from '@routepilot/core';
import { createStep } from '@routepilot/core';
import { settingsState } from './settingsState';
import docsGifUrl from '../assets/documentation_gif.gif';

const SETTINGS_ROUTE = '/settings';

const notify = () => {
  window.dispatchEvent(new CustomEvent('settings-tour:state-changed'));
};

const seedSettingsState = () => {
  settingsState.init();
  notify();
};

const resetSettingsState = () => {
  settingsState.reset();
  notify();
};

const docsGifIntroStep: StepDefinition = {
  id: 'docs-gif-intro',
  route: SETTINGS_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Your docs shouldn\'t need a forklift',
    body: 'Every project has ==That One Confluence Page== — 47 sections, last updated by someone who left, and a screenshot from three redesigns ago.\n\nYour users don\'t want to ==read about== a setting. They want to ==see what it does==. This tour turns a settings page into its own documentation — no wiki, no context switch, no Hermione-level lifting required.\n\nPress ==|Next|== to see docs that actually move.',
    media: createElement('img', {
      src: docsGifUrl,
      alt: 'Hermione slamming a massive book in front of Harry — how users feel opening your documentation',
      loading: 'eager',
    }),
  },
};

const docsIntroStep: StepDefinition = {
  id: 'docs-intro',
  route: SETTINGS_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Interactive documentation',
    body: 'Every section on this page has settings that ==change behavior== across the project. Instead of describing each one in a separate doc, the tour will ==demonstrate them live== — toggling values, showing effects, then reverting.\n\nSame ==|TourDefinition|== primitive. Same ==preparation== system. Different use case: the product ==documents itself==.',
  },
};

const notifSectionStep = createStep(
  'docs-notif-section', SETTINGS_ROUTE, '[data-tour="notif-section"]',
  'Notification preferences',
  'This card controls ==how and when== the project talks to your team. Four settings, each with side effects the user might not expect. The tour will ==demonstrate each one== instead of explaining in a tooltip.',
  'right',
);

const emailDigestStep = createStep(
  'docs-email-digest', SETTINGS_ROUTE, '[data-tour="email-digest"]',
  'Email digest — daily summary',
  'We just switched from ==|Off|== to ==|Daily|==. The user now gets a ==morning summary== of all activity — new issues, comments, status changes.\n\nThe preparation toggled the real control. When this step ends and the tour cleans up, it\'ll revert to ==|Off|==.',
  'right',
);
emailDigestStep.preparations = [
  {
    id: 'demo-email-digest',
    scope: 'step',
    factory: async () => {
      settingsState.setEmailDigest('daily');
      notify();
      return async () => {
        settingsState.setEmailDigest('off');
        notify();
      };
    },
  },
];

const slackChannelStep = createStep(
  'docs-slack', SETTINGS_ROUTE, '[data-tour="slack-channel"]',
  'Slack integration — live alerts',
  'We just connected ==|#eng-alerts|==. Issue transitions, deployment events, and SLA breaches now post here in real time. This is a ==step-scoped preparation== — the channel disconnects when we move on.\n\nIn production you\'d use ==|scope: \'tour\'|== if the channel should stay connected across multiple steps.',
  'right',
);
slackChannelStep.preparations = [
  {
    id: 'demo-slack-channel',
    scope: 'step',
    factory: async () => {
      settingsState.setSlackChannel('#eng-alerts');
      notify();
      return async () => {
        settingsState.setSlackChannel(null);
        notify();
      };
    },
  },
];

const accessSectionStep = createStep(
  'docs-access-section', SETTINGS_ROUTE, '[data-tour="access-section"]',
  'Access & security',
  'Role, two-factor, session timeout. Each one changes what the user can ==see and do==. The tour will switch roles to ==show the permission diff== — something a static doc could never do.',
  'right',
);

const roleStep = createStep(
  'docs-role', SETTINGS_ROUTE, '[data-tour="role-selector"]',
  'Role escalation — viewer → admin',
  'We just promoted this user to ==|Admin|==. Look at the permission list — it expanded from ==2 items to 8==. That\'s the kind of context a tooltip can\'t communicate. The user needs to ==see the delta==.\n\nThis preparation used ==|scope: \'step\'|== — the role drops back to ==|Viewer|== on the next step.',
  'right',
);
roleStep.preparations = [
  {
    id: 'demo-role-admin',
    scope: 'step',
    factory: async () => {
      settingsState.setRole('admin');
      notify();
      return async () => {
        settingsState.setRole('viewer');
        notify();
      };
    },
  },
];

const twoFactorStep = createStep(
  'docs-2fa', SETTINGS_ROUTE, '[data-tour="2fa-toggle"]',
  'Two-factor authentication',
  'Flipped to ==|Enabled|==. The badge changed from ==gray to green==. In a real app this would trigger an enrollment flow — the tour intercepts that and just shows the ==end state==.\n\nThis is a common pattern: ==|preparations|== skip the ceremony and show the result, so the docs stay focused.',
  'right',
);
twoFactorStep.preparations = [
  {
    id: 'demo-2fa',
    scope: 'step',
    factory: async () => {
      settingsState.setTwoFactor(true);
      notify();
      return async () => {
        settingsState.setTwoFactor(false);
        notify();
      };
    },
  },
];

const workflowSectionStep = createStep(
  'docs-workflow-section', SETTINGS_ROUTE, '[data-tour="workflow-section"]',
  'Workflow automation',
  'Issue transitions, approval gates, automation rules. These settings control how work ==moves through the pipeline==. The tour will toggle each one to show its downstream effect.',
  'right',
);

const transitionStep = createStep(
  'docs-transition', SETTINGS_ROUTE, '[data-tour="transition-mode"]',
  'Auto-resolve on merge',
  'We switched to ==|Auto-resolve|==. Now when a linked PR merges, the issue moves to ==Done== automatically — no manual drag.\n\n==|Auto-close|== goes further: it closes the issue entirely. ==|Manual|== (the default) leaves everything to the team.',
  'right',
);
transitionStep.preparations = [
  {
    id: 'demo-transition',
    scope: 'step',
    factory: async () => {
      settingsState.setIssueTransition('auto-resolve');
      notify();
      return async () => {
        settingsState.setIssueTransition('manual');
        notify();
      };
    },
  },
];

const automationStep = createStep(
  'docs-automation', SETTINGS_ROUTE, '[data-tour="automation-rules"]',
  'Automation rules — activated',
  'All three rules are now ==|Enabled|==. Stale issues get labeled, first commenters get assigned, and sprint overflows ping Slack.\n\nThree ==|toggleAutomationRule()|== calls in one ==preparation factory== — the engine batches them into a single step transition.',
  'top',
);
automationStep.preparations = [
  {
    id: 'demo-automation-rules',
    scope: 'step',
    factory: async () => {
      settingsState.toggleAutomationRule(1, true);
      settingsState.toggleAutomationRule(2, true);
      settingsState.toggleAutomationRule(3, true);
      notify();
      return async () => {
        settingsState.toggleAutomationRule(1, false);
        settingsState.toggleAutomationRule(2, false);
        settingsState.toggleAutomationRule(3, false);
        notify();
      };
    },
  },
];

const integrationsSectionStep = createStep(
  'docs-integrations-section', SETTINGS_ROUTE, '[data-tour="integrations-section"]',
  'Integrations',
  'API key and webhooks. The tour will ==reveal the key== and ==configure a webhook== to show what each field does — without the user touching production credentials.',
  'right',
);

const apiKeyStep = createStep(
  'docs-api-key', SETTINGS_ROUTE, '[data-tour="api-key-row"]',
  'API key — revealed',
  'The key is now visible: ==|pulse_sk_live_7f3a…|==. In production, revealing this requires re-authentication. The tour\'s preparation ==skipped the auth gate== and showed the end state directly.\n\nThe ==|Regenerate|== button would invalidate all existing integrations — the kind of ==destructive action== docs should warn about contextually, not in a footnote.',
  'top',
);
apiKeyStep.preparations = [
  {
    id: 'demo-api-key-reveal',
    scope: 'step',
    factory: async () => {
      settingsState.setApiKeyRevealed(true);
      notify();
      return async () => {
        settingsState.setApiKeyRevealed(false);
        notify();
      };
    },
  },
];

const webhookStep = createStep(
  'docs-webhook', SETTINGS_ROUTE, '[data-tour="webhook-config"]',
  'Webhook — configured',
  'URL set to ==|https://hooks.acme.io/pulse|==, listening for ==issue.created==, ==issue.resolved==, and ==sprint.completed==.\n\nThe preparation set the URL and checked three event boxes in one factory call. Cleanup unchecks them all — the user\'s real config is untouched.',
  'top',
);
webhookStep.preparations = [
  {
    id: 'demo-webhook-config',
    scope: 'step',
    factory: async () => {
      settingsState.setWebhookUrl('https://hooks.acme.io/pulse');
      settingsState.setWebhookEvents(['issue.created', 'issue.resolved', 'sprint.completed']);
      notify();
      return async () => {
        settingsState.setWebhookUrl('');
        settingsState.setWebhookEvents([]);
        notify();
      };
    },
  },
];

const docsOutroStep: StepDefinition = {
  id: 'docs-outro',
  route: SETTINGS_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'The settings page just documented itself',
    body: 'Every toggle, dropdown, and input on this page was ==demonstrated live== — not described in a wiki nobody maintains.\n\nEach step used ==|preparations|== to inject state, show the effect, and ==revert cleanly==. The user\'s real configuration was never touched.\n\nSame engine. Same ==|TourDefinition|==. The only difference from onboarding is the ==trigger==: instead of first login, it\'s a ==|?|== icon next to a section header.',
  },
};

const allSteps: StepDefinition[] = [
  docsGifIntroStep,
  docsIntroStep,
  notifSectionStep,
  emailDigestStep,
  slackChannelStep,
  accessSectionStep,
  roleStep,
  twoFactorStep,
  workflowSectionStep,
  transitionStep,
  automationStep,
  integrationsSectionStep,
  apiKeyStep,
  webhookStep,
  docsOutroStep,
];

docsGifIntroStep.preparations = [
  ...(docsGifIntroStep.preparations ?? []),
  {
    id: 'settings-seed',
    scope: 'tour',
    sharedWith: allSteps.filter((s) => s.id !== 'docs-gif-intro').map((s) => s.id),
    factory: async () => {
      seedSettingsState();
      return async () => resetSettingsState();
    },
  },
];

const withChapter = (steps: StepDefinition[], chapter: string): StepDefinition[] =>
  steps.map((s) => ({ ...s, chapter: s.chapter ?? chapter }));

export const interactiveDocsTour: TourDefinition = {
  id: 'interactive-docs',
  name: 'Pulse — Interactive documentation',
  description: 'Settings page that documents itself via live demonstrations',
  onStart: () => {
    seedSettingsState();
  },
  onFinish: () => {
    resetSettingsState();
  },
  steps: [
    ...withChapter([docsGifIntroStep, docsIntroStep], 'Overview'),
    ...withChapter([notifSectionStep, emailDigestStep, slackChannelStep], 'Notifications'),
    ...withChapter([accessSectionStep, roleStep, twoFactorStep], 'Access & Security'),
    ...withChapter([workflowSectionStep, transitionStep, automationStep], 'Workflow'),
    ...withChapter([integrationsSectionStep, apiKeyStep, webhookStep], 'Integrations'),
    ...withChapter([docsOutroStep], 'Done'),
  ],
};
