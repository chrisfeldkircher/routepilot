import type { TourDefinition, StepDefinition } from '@routepilot/react';

const SHOWCASE_ROUTE = '/import';

const introWhatStep: StepDefinition = {
  id: 'intro-what',
  chapter: 'Overview',
  route: SHOWCASE_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Ask the Tour — a search bar inside your tooltip',
    body: 'When a tour grows past ==5–6 steps==, ==|Next|== → ==|Next|== → ==|Next|== stops working. Users who already know what\'s wrong don\'t want a walkthrough — they want the ==one step== that answers them.\n\n==|@routepilot/assistant-react|== adds a ==🤖 button== to the tooltip footer. Users type a natural-language question (==|"my file is too big"|==), the engine ranks your own tour steps, and clicking a result ==|goTo()|==s it. No LLM, no API key, no backend.\n\nThe rest of this tour is framed for ==devs== — it shows what you get, how to wire it, and how to tune the index.',
  },
};

const introTechStep: StepDefinition = {
  id: 'intro-tech',
  chapter: 'Overview',
  route: SHOWCASE_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Under the hood — BM25, in your browser',
    body: 'Retrieval is ==classic BM25== (==|k1=1.5|==, ==|b=0.75|==) running over a tokenized, stemmed token stream built from each step\'s ==title==, ==body==, ==chapter==, ==meta==, and an ==assistant== bag you control.\n\nThe whole index is built once on the client from the ==|TourDefinition[]|== you already have. ==Zero network calls==, ==no embeddings==, ==<20 KB gzipped==, works offline. It sits next to your engine — not behind a service.\n\nThe next six steps are the ==haystack==: realistic answers to realistic import errors. After that, you\'ll try the search yourself.',
  },
};

const answerFileSizeStep: StepDefinition = {
  id: 'answer-file-size',
  chapter: 'Answers',
  route: SHOWCASE_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'File over the size limit',
    body: 'Our importer caps uploads at ==10 MB== per file. Bigger files fail at the edge with a ==|413 Payload Too Large|==.\n\nThe fix: split the CSV by row range (most spreadsheet apps can export a subset), or ==gzip== it first — the endpoint auto-decompresses ==|.csv.gz|==.\n\nIf this feels like a real FAQ answer, that\'s the point. This is a tour step pretending to be a doc entry. ==BM25== treats it like any other document in the index.',
  },
  meta: {
    assistant: {
      keywords: [
        'file too big',
        'file size limit',
        'upload rejected',
        '413 payload',
        'oversized csv',
        'split file',
        'gzip upload',
      ],
      aliases: ['huge file', 'big file', 'file is massive', 'upload too large', 'payload too large'],
      intent: 'resolve file size upload failure',
      errorPatterns: [/413/, /payload too large/i, /file.*(too large|too big)/i],
    },
  },
};

const answerEncodingStep: StepDefinition = {
  id: 'answer-encoding',
  chapter: 'Answers',
  route: SHOWCASE_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Garbled characters in the preview',
    body: 'Seeing ==|Ã¼|==, ==|â€™|==, or a string of ==|\uFFFD|== where letters should be? The file is ==Latin-1== (or Windows-1252) and the importer opened it as ==UTF-8==.\n\nThe fix: re-save the CSV from your spreadsheet tool as ==|UTF-8 (Comma delimited)|==. On Excel that\'s under ==|Save As → CSV UTF-8|==. On macOS Numbers, ==|Export → CSV → Advanced → UTF-8|==.\n\nOnce re-exported, the preview renders cleanly. Encoding issues are ==never== the user\'s fault — but they do need a specific action.',
  },
  meta: {
    assistant: {
      keywords: [
        'encoding',
        'utf-8',
        'utf8',
        'latin-1',
        'windows-1252',
        'garbled text',
        'weird characters',
        'special characters broken',
        'question marks',
      ],
      aliases: [
        'umlauts broken',
        'accents wrong',
        'special characters',
        'weird symbols',
        'gibberish text',
      ],
      intent: 'fix character encoding in csv',
    },
  },
};

const answerMissingColumnStep: StepDefinition = {
  id: 'answer-missing-column',
  chapter: 'Answers',
  route: SHOWCASE_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'A required column isn\'t mapped',
    body: 'The target schema marks ==|email_address|== as ==required==, but your CSV\'s ==|email|== column hasn\'t been mapped to it. The importer blocks submission until every required target has a source.\n\nThe fix: open the ==mapping panel== on the left, drag ==|email|== onto ==|email_address|==, and the error clears. If your CSV is missing the column entirely, add a ==constant== mapping or ==skip the row==.\n\nThis is the most common import failure in production. Surfacing ==which== column is missing is what turns a generic ==|400|== into a ==fixable problem==.',
  },
  meta: {
    assistant: {
      keywords: [
        'missing column',
        'required field',
        'unmapped column',
        'column not mapped',
        'missing required',
        'schema error',
        'required mapping',
      ],
      aliases: [
        'where is the column',
        'which column is required',
        'column disappeared',
        'required fields missing',
      ],
      intent: 'map a required column before import',
      errorPatterns: [/required (column|field)/i, /column.*not mapped/i],
    },
  },
};

const answerTypeMismatchStep: StepDefinition = {
  id: 'answer-type-mismatch',
  chapter: 'Answers',
  route: SHOWCASE_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'A number column contains text',
    body: 'Row ==14== has ==|twenty-three|== in the ==|age|== column. The target is an ==integer==, and the importer won\'t silently coerce words into numbers — that\'s how you end up with ==|NaN|== in a database.\n\nThe fix, in order of preference:\n1. ==Correct the cell== in the source spreadsheet (==|23|==).\n2. Apply a ==transform rule== on the mapping: ==|word-to-number|==.\n3. ==Skip the row== and re-run the import for it manually.\n\nThe importer reports the offending row ==and== the value so you don\'t have to diff files.',
  },
  meta: {
    assistant: {
      keywords: [
        'type mismatch',
        'wrong type',
        'number has text',
        'invalid number',
        'not a number',
        'coercion failed',
        'transform value',
      ],
      aliases: [
        'age is text',
        'number column broken',
        'expected integer',
        'cant convert',
        'string in number field',
      ],
      intent: 'fix a type mismatch on an import column',
    },
  },
};

const answerDuplicatesStep: StepDefinition = {
  id: 'answer-duplicates',
  chapter: 'Answers',
  route: SHOWCASE_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Duplicate primary keys in the upload',
    body: 'Rows ==7== and ==42== share the same ==|employee_id|== — ==|E-1047|==. The target table has a ==|UNIQUE|== constraint, and the transaction would roll back halfway through on a naive insert.\n\nYou pick a ==dedup strategy== before import:\n• ==|skip|== — first occurrence wins, later rows drop.\n• ==|overwrite|== — last occurrence wins, earlier rows get updated.\n• ==|fail|== — block the whole import and make the user fix the source.\n\nSkip is the safe default for append-style imports. Overwrite is the right call when the CSV is a ==corrective re-export==.',
  },
  meta: {
    assistant: {
      keywords: [
        'duplicate rows',
        'duplicate primary key',
        'unique constraint',
        'dedup',
        'same id twice',
        'overwrite duplicates',
        'skip duplicates',
      ],
      aliases: [
        'repeated rows',
        'same employee twice',
        'id collision',
        'dedupe',
        'row appears twice',
      ],
      intent: 'pick a deduplication strategy for duplicate keys',
      errorPatterns: [/unique constraint/i, /duplicate key/i],
    },
  },
};

const answerUploadStuckStep: StepDefinition = {
  id: 'answer-upload-stuck',
  chapter: 'Answers',
  route: SHOWCASE_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Upload progress bar is stuck',
    body: 'The progress bar sits at ==87 %== and hasn\'t moved in a minute. Nine times out of ten this is a ==network blip== on a ==chunked upload== — the client is still alive, the server just stopped acknowledging parts.\n\nThe fix: click ==|Retry|== in the upload panel. The importer uses ==resumable uploads== (Tus protocol), so it picks up from the last acknowledged chunk — not from zero. Files over ==100 MB== benefit the most.\n\nIf retry fails three times in a row, the import is marked ==failed== and you can re-start from the file picker. No partial data is ever committed.',
  },
  meta: {
    assistant: {
      keywords: [
        'upload stuck',
        'progress stuck',
        'upload frozen',
        'resume upload',
        'retry upload',
        'tus resumable',
        'chunked upload',
        'upload stalled',
      ],
      aliases: [
        'upload hanging',
        'upload not moving',
        'upload never finishes',
        'upload failed',
        'stuck at 87',
      ],
      intent: 'recover a stalled upload',
    },
  },
};

const tryItStep: StepDefinition = {
  id: 'try-it',
  chapter: 'Try it',
  route: SHOWCASE_ROUTE,
  selector: 'highlight:[data-tour="tour-assistant-button"]',
  tooltip: { placement: 'center' },
  content: {
    title: 'Try it — the button is in the tooltip footer',
    body: 'See the highlighted ==🤖 button== in the footer. Click it — a prompt bar slides in.\n\nNow type something a real user would say:\n• ==|my file is too big|== → ranks ==File over the size limit== first\n• ==|weird characters in preview|== → ranks ==Garbled characters== first\n• ==|upload stuck at 87|== → ranks ==Upload progress bar is stuck== first\n\nClick a result. The tour ==|goTo()|==s that step directly — the intervening steps are skipped, the prep chain for the target runs as if it had been navigated manually.\n\nSearch is scoped to ==this tour only== for the demo (==|scope: \'current-tour-only\'|==). The assistant won\'t suggest steps from the FAQ or Onboarding tours even though they\'re indexed.',
  },
};

const customizeStep: StepDefinition = {
  id: 'customize',
  chapter: 'Customize',
  route: SHOWCASE_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Tuning the index for your content',
    body: 'Every knob is optional; defaults work. But the ones you\'ll actually reach for:\n\n==|fieldWeights|== — boost ==title== or ==assistant== bag vs ==body==. Default: title×3, assistant×2, body×1.\n==|synonyms|== — ==|{ "cancel": ["abort","stop"] }|==. Query-time expansion, not index-time, so dictionaries can hot-swap.\n==|meta.assistant.keywords / aliases|== — extra tokens per step for slang or error strings your body text wouldn\'t contain.\n==|meta.assistant.errorPatterns|== — regex patterns boosted when users paste actual error messages.\n==|scope|== — ==|\'all-tours\' | \'current-tour-only\' | \'current-tour-first\'|==. Matches our demo\'s restriction.\n==|reranker|== — optional async hook ==|(args) => Promise<Match[]>|==. Lexical BM25 first, then plug in an LLM, a cross-encoder, or just your own signals.\n==|loadingAnimation|== — ==|\'pulse\' | \'wave\' | \'spinner\' | custom|==. Shows while an async reranker resolves.\n\nEvery answer step in ==this== tour has a ==|meta.assistant|== block. That\'s how ==|upload stuck at 87|== finds the right step — the literal number is in the ==alias list==, not the body.',
  },
};

const outroStep: StepDefinition = {
  id: 'assistant-outro',
  chapter: 'Wire it',
  route: SHOWCASE_ROUTE,
  tooltip: { placement: 'center' },
  content: {
    title: 'Install and wire — two lines',
    body: '==|npm i @routepilot/assistant @routepilot/assistant-react|==\n\n==|@routepilot/assistant|== ships the framework-agnostic core (==|TourIndex|==, BM25, tokenizer). ==|@routepilot/assistant-react|== adds the ==React== button + prompt components. Angular users swap the second for ==|@routepilot/assistant-angular|==.\n\nThen on your provider:\n\n==|const assistant = TourIndex.fromTours(tours);|==\n==|<GuidedTourProvider tooltipFooterNavSlot={<TourAssistantButton />} tooltipFooterSlot={<TourAssistantPrompt />}>|==\n==|  <TourAssistantProvider index={assistant}>{children}</TourAssistantProvider>|==\n==|</GuidedTourProvider>|==\n\nThe slot props are ==generic== — the engine has no assistant knowledge. Drop the dep, remove the slot props, tooltip footer looks exactly like before.\n\nHit ==|Finish|==. Your FAQ just got a search bar.',
  },
};

export const assistantShowcaseTour: TourDefinition = {
  id: 'assistant-showcase',
  name: 'Ask the Tour — searchable step retrieval',
  description:
    'Developer walkthrough of @routepilot/assistant-react: BM25-ranked step retrieval wired into the tooltip footer.',
  steps: [
    introWhatStep,
    introTechStep,
    answerFileSizeStep,
    answerEncodingStep,
    answerMissingColumnStep,
    answerTypeMismatchStep,
    answerDuplicatesStep,
    answerUploadStuckStep,
    tryItStep,
    customizeStep,
    outroStep,
  ],
};
