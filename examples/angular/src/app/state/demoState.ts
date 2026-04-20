import type { Task, Comment, Attachment } from './data';

const DEMO_TASK_ID = 9001;

const STRIPE_CONFIG_JSON = JSON.stringify(
  {
    stripe: {
      publicKey: 'pk_test_51Abc...',
      webhookSecret: 'whsec_test_...',
      apiVersion: '2026-03-01',
      paymentMethods: ['card', 'apple_pay'],
      currency: 'usd',
      retryPolicy: {
        maxAttempts: 3,
        backoffMs: [1000, 5000, 15000],
      },
    },
    checkout: {
      successUrl: '/checkout/success?session={CHECKOUT_SESSION_ID}',
      cancelUrl: '/checkout/cancel',
      lineItems: { priceId: 'price_1Abc...', quantity: 1 },
    },
  },
  null,
  2,
);

const INTEGRATION_NOTES = `# Payment Gateway Integration Notes

## Status: In Progress

### Completed
- [x] Stripe account created (test mode)
- [x] API keys stored in HashiCorp Vault
- [x] Webhook endpoint registered: /api/webhooks/stripe

### In Progress
- [ ] Checkout session creation
- [ ] Payment intent confirmation flow
- [ ] Apple Pay merchant domain verification

### Blockers
- Need PCI SAQ-A confirmation from compliance team
- Apple Pay requires production domain verification (can't test locally)

### Test Cards
| Card             | Scenario          |
|------------------|-------------------|
| 4242424242424242 | Success           |
| 4000000000000002 | Declined          |
| 4000000000009995 | Insufficient funds|

### Architecture Decision
Using Stripe Checkout (hosted) instead of custom form to minimize PCI scope.
Webhook handler uses idempotency keys to prevent duplicate processing.`;

const DEMO_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <g fill="none" stroke="#ffffff" stroke-width="2" opacity="0.85">
    <rect x="80" y="80" width="140" height="70" rx="8"/>
    <rect x="420" y="80" width="140" height="70" rx="8"/>
    <rect x="250" y="210" width="140" height="70" rx="8"/>
    <path d="M150 150 L320 210"/>
    <path d="M490 150 L320 210"/>
  </g>
  <g fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle">
    <text x="150" y="120" font-size="18">Checkout UI</text>
    <text x="490" y="120" font-size="18">Webhook</text>
    <text x="320" y="250" font-size="18">Stripe API</text>
  </g>
  <text x="320" y="320" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="14" text-anchor="middle" opacity="0.75">Payment Gateway Architecture</text>
</svg>`,
  );

const DEMO_ATTACHMENTS: Attachment[] = [
  {
    id: 90001,
    name: 'architecture-diagram.png',
    mimeType: 'image/png',
    size: 184320,
    category: 'image',
    content: DEMO_IMAGE,
  },
  {
    id: 90002,
    name: 'stripe-config.json',
    mimeType: 'application/json',
    size: 2048,
    category: 'document',
    content: STRIPE_CONFIG_JSON,
  },
  {
    id: 90003,
    name: 'integration-notes.md',
    mimeType: 'text/markdown',
    size: 1536,
    category: 'document',
    content: INTEGRATION_NOTES,
  },
];

const DEMO_TASK: Task = {
  id: DEMO_TASK_ID,
  title: 'Integrate payment gateway',
  description:
    'Integrate Stripe payment processing into the checkout flow. Requirements:\n' +
    '- Support credit card and Apple Pay\n' +
    '- Implement webhook handler for payment confirmations\n' +
    '- Add retry logic for failed charges\n' +
    '- PCI compliance: never store raw card data\n\n' +
    'Reference: Stripe API docs (v2026-03), internal spec PRD-2041.',
  status: 'open',
  priority: 'high',
  assignee: null,
  createdAt: '2026-03-28T09:15:00Z',
  attachments: DEMO_ATTACHMENTS,
  comments: [
    {
      id: 90011,
      author: 'Product Manager',
      content: 'This is blocking the v2.0 launch. Please prioritize.',
      createdAt: '2026-03-28T10:00:00Z',
    },
    {
      id: 90012,
      author: 'Tech Lead',
      content:
        'I\'ve set up the Stripe test account. API keys are in the vault under "stripe-staging".',
      createdAt: '2026-03-28T14:30:00Z',
      attachments: [
        {
          id: 90004,
          name: 'api-keys-guide.txt',
          mimeType: 'text/plain',
          size: 512,
          category: 'log',
          content:
            'Vault path: secret/stripe-staging\nPublic key: pk_test_51Abc...\nSecret key: sk_test_51Abc...\nWebhook secret: whsec_test_...\n\nRotation policy: 90 days\nLast rotated: 2026-03-15',
        },
      ],
    },
  ],
};

export interface DemoUiState {
  previewOpen: boolean;
  previewAttachmentId: number | null;
  assignModalOpen: boolean;
  commentDraft: string;
}

export interface DemoTourState {
  task: Task;
  ui: DemoUiState;
}

const defaultUi = (): DemoUiState => ({
  previewOpen: false,
  previewAttachmentId: null,
  assignModalOpen: false,
  commentDraft: '',
});

class DemoStateManager {
  private state: DemoTourState | null = null;

  init(): DemoTourState {
    if (!this.state) {
      this.state = { task: structuredClone(DEMO_TASK), ui: defaultUi() };
    }
    return this.state;
  }

  get(): DemoTourState | null {
    return this.state;
  }

  getTask(): Task {
    return this.init().task;
  }

  getUi(): DemoUiState {
    return this.init().ui;
  }

  updateTask(patch: Partial<Task>): void {
    const s = this.init();
    s.task = { ...s.task, ...patch };
  }

  setStatus(status: Task['status']): void {
    this.updateTask({ status });
  }

  setAssignee(name: string | null): void {
    this.updateTask({ assignee: name });
  }

  addComment(comment: Comment): void {
    const s = this.init();
    s.task = { ...s.task, comments: [...s.task.comments, comment] };
  }

  removeCommentsByAuthor(author: string): void {
    const s = this.init();
    s.task = { ...s.task, comments: s.task.comments.filter((c) => c.author !== author) };
  }

  addAttachment(attachment: Attachment): void {
    const s = this.init();
    s.task = { ...s.task, attachments: [...s.task.attachments, attachment] };
  }

  setPreviewOpen(open: boolean, attachmentId: number | null = null): void {
    const s = this.init();
    s.ui = {
      ...s.ui,
      previewOpen: open,
      previewAttachmentId: open ? (attachmentId ?? s.task.attachments[0]?.id ?? null) : null,
    };
  }

  setAssignModalOpen(open: boolean): void {
    const s = this.init();
    s.ui = { ...s.ui, assignModalOpen: open };
  }

  setCommentDraft(value: string): void {
    const s = this.init();
    s.ui = { ...s.ui, commentDraft: value };
  }

  reset(): void {
    this.state = null;
  }

  get isActive(): boolean {
    return this.state !== null;
  }
}

export const demoState = new DemoStateManager();
export const DEMO_ID = DEMO_TASK_ID;
