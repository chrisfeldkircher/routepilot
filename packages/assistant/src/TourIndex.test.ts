import { describe, it, expect } from 'vitest';
import type { TourDefinition } from '@routepilot/engine';
import { TourIndex } from './TourIndex';

const tour: TourDefinition = {
  id: 'import',
  name: 'Import data',
  steps: [
    {
      id: 'choose-file',
      title: 'Choose a file to upload',
      body: 'Pick a CSV or XLSX file from your machine to begin importing tasks.',
      chapter: 'import',
    },
    {
      id: 'fix-upload-error',
      title: 'Resolve an upload error',
      body: 'If the upload failed, check the file format and network connection, then retry.',
      chapter: 'import',
    },
    {
      id: 'map-columns',
      title: 'Map your columns',
      body: 'Match spreadsheet columns to RoutePilot fields so tasks import correctly.',
      chapter: 'import',
    },
  ],
};

const pickupTour: TourDefinition = {
  id: 'pickup',
  name: 'Pickup workflow',
  steps: [
    {
      id: 'start-pickup',
      title: 'Start a pickup',
      body: 'Scan the package barcode to begin a pickup run.',
      chapter: 'pickup',
    },
    {
      id: 'upload-pickup-photo',
      title: 'Upload a pickup photo',
      body: 'Attach a delivery image when the package scanner is unavailable.',
      chapter: 'pickup',
    },
  ],
};

const disabledAssistantTour: TourDefinition = {
  id: 'disabled',
  name: 'Disabled assistant step',
  steps: [
    {
      id: 'hidden-step',
      title: 'Hidden recovery step',
      body: 'Fix the upload error with this secret step.',
      meta: {
        assistant: {
          disabled: true,
          keywords: ['upload', 'error'],
        },
      },
    },
  ],
};

const createTour: TourDefinition = {
  id: 'demo',
  name: 'Demo flow',
  steps: [
    {
      id: 'open-create-task',
      title: 'Open the create task form',
      body: 'Launch the modal for creating a new task.',
      chapter: 'Create Task',
    },
    {
      id: 'enter-task-title',
      title: 'Enter a task title',
      body: 'Add the task title and description.',
      chapter: 'Create Task',
    },
    {
      id: 'add-task-attachments',
      title: 'Attach supporting files',
      body: 'Upload screenshots or logs before creating the task.',
      chapter: 'Create Task',
    },
  ],
};

const chapterMetaTour: TourDefinition = {
  id: 'tasks',
  name: 'Tasks',
  steps: [
    {
      id: 'open-task-flow',
      title: 'Open task composer',
      body: 'Start the task creation flow.',
      chapter: 'Create Task',
      meta: {
        assistant: {
          chapterSummary: 'Create work items, issues, and tickets from one flow.',
          aliases: ['new work item'],
        },
      },
    },
    {
      id: 'fill-task-fields',
      title: 'Fill the task fields',
      body: 'Add title, description, and priority.',
      chapter: 'Create Task',
    },
  ],
};

describe('TourIndex.fromTours', () => {
  it('indexes every step across all tours', () => {
    const index = TourIndex.fromTours([tour, pickupTour]);
    expect(index.size()).toBe(5);
  });

  it('skips duplicate (tourId, stepId) keys', () => {
    const index = TourIndex.fromTours([tour]);
    index.addTour(tour);
    expect(index.size()).toBe(3);
  });

  it('skips steps that have no searchable text', () => {
    const empty: TourDefinition = {
      id: 't',
      steps: [{ id: 'blank' }],
    };
    const index = TourIndex.fromTours([empty]);
    expect(index.size()).toBe(0);
  });

  it('skips steps that disable assistant indexing', () => {
    const index = TourIndex.fromTours([disabledAssistantTour]);
    expect(index.size()).toBe(0);
  });
});

describe('TourIndex.query', () => {
  it('returns the step most relevant to an error-recovery question', () => {
    const index = TourIndex.fromTours([tour, pickupTour]);
    const [top] = index.query('I got an upload error, how do I fix it?');
    expect(top?.tourId).toBe('import');
    expect(top?.stepId).toBe('fix-upload-error');
  });

  it('returns matches sorted by score, highest first', () => {
    const index = TourIndex.fromTours([tour]);
    const matches = index.query('upload file');
    const scores = matches.map((m) => m.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('respects the limit option', () => {
    const index = TourIndex.fromTours([tour]);
    const matches = index.query('upload', { limit: 1 });
    expect(matches).toHaveLength(1);
  });

  it('filters by tourIds', () => {
    const index = TourIndex.fromTours([tour, pickupTour]);
    const matches = index.query('pickup package', { tourIds: ['import'] });
    for (const m of matches) expect(m.tourId).toBe('import');
  });

  it('drops matches below minScore', () => {
    const index = TourIndex.fromTours([tour]);
    const matches = index.query('upload', { minScore: 1e6 });
    expect(matches).toEqual([]);
  });

  it('supports assistant-only metadata terms in search', () => {
    const withMetadata: TourDefinition = {
      id: 'meta',
      name: 'Metadata',
      steps: [
        {
          id: 'fix-heic-upload',
          title: 'Unsupported file type',
          body: 'Only PNG and JPG files are allowed.',
          meta: {
            assistant: {
              aliases: ['iphone photo upload'],
              errorPatterns: ['.heic is not allowed'],
              keywords: ['heic', 'upload'],
            },
          },
        },
      ],
    };

    const index = TourIndex.fromTours([withMetadata]);
    const [top] = index.query('my iphone photo upload says .heic is not allowed');
    expect(top?.stepId).toBe('fix-heic-upload');
  });

  it('aggregates broad chapter-name queries into a flow result', () => {
    const index = TourIndex.fromTours([createTour]);
    const [top] = index.query('create task', { limit: 3 });

    expect(top?.kind).toBe('chapter');
    expect(top?.chapter).toBe('Create Task');
    expect(top?.stepId).toBe('open-create-task');
    expect(top?.stepCount).toBe(3);
  });

  it('fans out sibling steps after a flow result in chapter order', () => {
    const index = TourIndex.fromTours([createTour]);
    const matches = index.query('create', { limit: 3 });

    expect(matches.map((match) => [match.kind, match.stepId])).toEqual([
      ['chapter', 'open-create-task'],
      ['step', 'enter-task-title'],
      ['step', 'add-task-attachments'],
    ]);
  });

  it('surfaces a chapter flow from chapter-level assistant metadata even without a direct step hit', () => {
    const index = TourIndex.fromTours([chapterMetaTour]);
    const [top] = index.query('new work item', { limit: 2 });

    expect(top?.kind).toBe('chapter');
    expect(top?.chapter).toBe('Create Task');
    expect(top?.stepId).toBe('open-task-flow');
  });

  it('expands app-level synonyms without requiring step-specific hard-coded cases', () => {
    const index = TourIndex.fromTours([createTour], {
      synonyms: {
        task: ['ticket', 'issue', 'work item'],
      },
    });

    const [top] = index.query('create issue', { limit: 2 });
    expect(top?.chapter).toBe('Create Task');
  });

  it('returns [] when the question has no searchable tokens', () => {
    const index = TourIndex.fromTours([tour]);
    expect(index.query('the and is')).toEqual([]);
  });

  it('restricts search to the active tour for current-tour-only scope', () => {
    const index = TourIndex.fromTours([tour, pickupTour]);
    const matches = index.query('upload', {
      currentTourId: 'pickup',
      scope: 'current-tour-only',
    });

    expect(matches).not.toHaveLength(0);
    for (const match of matches) {
      expect(match.tourId).toBe('pickup');
    }
  });

  it('prioritizes current-tour matches ahead of stronger cross-tour hits', () => {
    const index = TourIndex.fromTours([tour, pickupTour]);
    const [top] = index.query('upload error', {
      currentTourId: 'pickup',
      scope: 'current-tour-first',
      limit: 2,
    });

    expect(top?.tourId).toBe('pickup');
    expect(top?.stepId).toBe('upload-pickup-photo');
  });

  it('exposes the original step and tour on each match', () => {
    const index = TourIndex.fromTours([tour]);
    const [top] = index.query('map columns');
    expect(top?.step.id).toBe('map-columns');
    expect(top?.tour.id).toBe('import');
  });

  it('boosts title matches over body-only matches via field weights', () => {
    const sameBody = 'login reset password account billing';
    const titleMatch: TourDefinition = {
      id: 't-title',
      steps: [{ id: 's', title: 'Reset your login password', body: 'unrelated filler words here.' }],
    };
    const bodyMatch: TourDefinition = {
      id: 't-body',
      steps: [{ id: 's', title: 'Unrelated topic entirely', body: sameBody }],
    };
    const index = TourIndex.fromTours([titleMatch, bodyMatch]);
    const [top] = index.query('reset login password');
    expect(top?.tourId).toBe('t-title');
  });

  it('accepts a custom extractor', () => {
    const custom: TourDefinition = {
      id: 'custom',
      steps: [{ id: 's', title: 'Original', body: 'Original body' }],
    };
    const index = TourIndex.fromTours([custom], {
      extract: () => ({ title: 'kubernetes sidecar', body: '' }),
    });
    const [top] = index.query('kubernetes');
    expect(top?.tourId).toBe('custom');
  });

  it('builds a snippet containing the query terms for long bodies', () => {
    const long: TourDefinition = {
      id: 'long',
      steps: [{
        id: 's',
        title: 'Troubleshooting',
        body: `${'filler '.repeat(40)}The specific upload error happens when the CSV is malformed. ${'more filler '.repeat(20)}`,
      }],
    };
    const index = TourIndex.fromTours([long]);
    const [top] = index.query('upload error csv');
    expect(top?.snippet.toLowerCase()).toMatch(/upload error/);
  });

  it('applies the optional async reranker in queryAsync', async () => {
    const index = TourIndex.fromTours([tour], {
      reranker: async ({ matches }) => [...matches].reverse(),
    });

    const lexicalMatches = index.query('upload');
    const rerankedMatches = await index.queryAsync('upload');

    expect(rerankedMatches.map((match) => match.stepId)).toEqual(
      [...lexicalMatches].reverse().map((match) => match.stepId),
    );
  });
});
