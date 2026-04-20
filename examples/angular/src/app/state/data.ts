export interface Attachment {
  id: number;
  name: string;
  mimeType: string;
  size: number;
  category: 'image' | 'document' | 'log';
  content: string;
}

export interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  assignee: string | null;
  createdAt: string;
  comments: Comment[];
  attachments: Attachment[];
}

export const USERS = ['Alice Chen', 'Bob Martinez', 'Carol Wu', 'Dan Osei'];

const DEMO_LOG_CONTENT = `[2026-03-11 09:12:01] INFO  Pipeline started — commit abc1234
[2026-03-11 09:12:03] INFO  Step 1/4: Install dependencies
[2026-03-11 09:12:18] INFO  Step 2/4: Lint
[2026-03-11 09:12:22] WARN  3 warnings in src/utils/helpers.ts
[2026-03-11 09:12:30] INFO  Step 3/4: Test
[2026-03-11 09:12:45] INFO  42 tests passed, 0 failed
[2026-03-11 09:12:46] INFO  Step 4/4: Docker build
[2026-03-11 09:13:02] INFO  Image pushed: registry.example.com/app:abc1234
[2026-03-11 09:13:03] INFO  Pipeline completed successfully`;

const DEMO_JSON_CONTENT = JSON.stringify({
  pipeline: {
    name: 'ci-cd-main',
    trigger: { branch: 'main', event: 'push' },
    stages: [
      { name: 'install', command: 'npm ci', duration_ms: 15200 },
      { name: 'lint', command: 'npm run lint', duration_ms: 4100, warnings: 3 },
      { name: 'test', command: 'npm test', duration_ms: 15400, passed: 42, failed: 0 },
      { name: 'build', command: 'docker build .', duration_ms: 16800 },
    ],
    result: 'SUCCESS',
    total_duration_ms: 62100,
  },
}, null, 2);

const DEMO_DOCKERFILE_CONTENT = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .
EXPOSE 3000
CMD ["node", "dist/server.js"]`;

const DEMO_IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#g)"/>
      <text x="50%" y="45%" text-anchor="middle" fill="#fff" font-family="system-ui" font-size="36" font-weight="700">Mockup preview</text>
      <text x="50%" y="58%" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="system-ui" font-size="16">Hero section · landing page v2</text>
    </svg>`,
  );

const DEMO_DESIGN_SPEC = `# Landing Page Design Spec

## Hero Section
- Full-width gradient background (#6366f1 → #8b5cf6)
- H1: "Ship faster with TaskFlow" (48px, white, bold)
- Subtitle: "Project management built for engineering teams" (20px, white/80%)
- CTA button: "Get Started Free" (rounded-full, white bg, primary text)

## Feature Grid (3-column)
1. Task Management — Kanban boards, status workflows
2. Team Collaboration — Comments, mentions, file sharing
3. Analytics — Burndown charts, velocity tracking

## Pricing Table
- Free: 5 users, 100 tasks
- Pro: unlimited users, API access ($12/user/mo)
- Enterprise: SSO, audit logs, SLA (custom)

## Footer
- Links: Docs, API, Status, Blog
- Social: GitHub, Twitter, Discord`;

export const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing, linting, and deployment to staging. Include Docker image builds and Kubernetes deployment manifests.',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Alice Chen',
    createdAt: '2026-03-10T09:00:00Z',
    attachments: [
      { id: 1001, name: 'pipeline-config.json', mimeType: 'application/json', size: 2048, category: 'document', content: DEMO_JSON_CONTENT },
      { id: 1002, name: 'deploy-log.txt', mimeType: 'text/plain', size: 4096, category: 'log', content: DEMO_LOG_CONTENT },
      { id: 1003, name: 'Dockerfile', mimeType: 'text/plain', size: 512, category: 'document', content: DEMO_DOCKERFILE_CONTENT },
    ],
    comments: [
      {
        id: 101,
        author: 'Alice Chen',
        content: 'Started with the test stage. Docker build is next.',
        createdAt: '2026-03-11T14:30:00Z',
        attachments: [
          { id: 1004, name: 'build-output.txt', mimeType: 'text/plain', size: 1280, category: 'log', content: DEMO_LOG_CONTENT },
        ],
      },
      { id: 102, author: 'Bob Martinez', content: 'Make sure to add the staging deploy step too.', createdAt: '2026-03-12T10:15:00Z' },
    ],
  },
  {
    id: 2,
    title: 'Design landing page',
    description: 'Create wireframes and high-fidelity mockups for the new product landing page. Must include hero section, feature grid, pricing table, and CTA.',
    status: 'review',
    priority: 'medium',
    assignee: 'Carol Wu',
    createdAt: '2026-03-08T11:00:00Z',
    attachments: [
      { id: 2001, name: 'mockup-hero.png', mimeType: 'image/png', size: 245760, category: 'image', content: DEMO_IMAGE_PLACEHOLDER },
      { id: 2002, name: 'design-spec.md', mimeType: 'text/markdown', size: 1536, category: 'document', content: DEMO_DESIGN_SPEC },
    ],
    comments: [
      {
        id: 201,
        author: 'Carol Wu',
        content: 'Mockups are ready for review. See Figma link.',
        createdAt: '2026-03-14T16:00:00Z',
        attachments: [
          { id: 2003, name: 'final-mockup.png', mimeType: 'image/png', size: 389120, category: 'image', content: DEMO_IMAGE_PLACEHOLDER },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Fix authentication timeout bug',
    description: 'Users are being logged out after 15 minutes of inactivity instead of the configured 60 minutes. Investigate the token refresh logic.',
    status: 'open',
    priority: 'high',
    assignee: null,
    createdAt: '2026-03-15T08:30:00Z',
    attachments: [],
    comments: [],
  },
  {
    id: 4,
    title: 'Write API documentation',
    description: 'Document all REST endpoints using OpenAPI 3.0 spec. Include request/response examples, error codes, and authentication requirements.',
    status: 'open',
    priority: 'low',
    assignee: null,
    createdAt: '2026-03-14T13:00:00Z',
    attachments: [],
    comments: [],
  },
  {
    id: 5,
    title: 'Optimize database queries',
    description: 'Profile slow queries on the tasks endpoint. Add missing indexes and optimize N+1 queries in the comments loader.',
    status: 'done',
    priority: 'medium',
    assignee: 'Dan Osei',
    createdAt: '2026-03-05T10:00:00Z',
    attachments: [],
    comments: [
      { id: 501, author: 'Dan Osei', content: 'Added composite index on (status, created_at). Query time dropped from 800ms to 12ms.', createdAt: '2026-03-07T15:45:00Z' },
    ],
  },
];

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileIcon = (category: Attachment['category']): string => {
  switch (category) {
    case 'image': return 'IMG';
    case 'log': return 'LOG';
    case 'document': return 'DOC';
    default: return 'FILE';
  }
};

const TEXT_FILE_EXTENSIONS = new Set([
  'txt', 'log', 'json', 'md', 'markdown', 'csv',
  'yaml', 'yml', 'xml', 'js', 'ts', 'tsx', 'jsx', 'css', 'html',
]);

export const inferAttachmentCategory = (fileName: string, mimeType: string): Attachment['category'] => {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (mimeType.startsWith('image/')) return 'image';
  if (extension === 'log') return 'log';
  return 'document';
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });

const buildBinaryPreviewPlaceholder = (file: File): string =>
  `Preview unavailable for ${file.name}\n\n` +
  `Mock upload metadata\n` +
  `- type: ${file.type || 'unknown'}\n` +
  `- size: ${formatFileSize(file.size)}\n` +
  `- uploaded in demo mode`;

export const fileToAttachment = async (file: File, id: number): Promise<Attachment> => {
  const category = inferAttachmentCategory(file.name, file.type);
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  let content: string;
  if (category === 'image') {
    content = await readFileAsDataUrl(file);
  } else if (
    file.type.startsWith('text/') ||
    file.type === 'application/json' ||
    file.type === 'application/xml' ||
    TEXT_FILE_EXTENSIONS.has(extension)
  ) {
    content = await readFileAsText(file);
  } else {
    content = buildBinaryPreviewPlaceholder(file);
  }

  return {
    id,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    category,
    content,
  };
};
