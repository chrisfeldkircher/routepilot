const DEFAULT_STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from',
  'has', 'have', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'this', 'these', 'those', 'i', 'my',
  'we', 'our', 'you', 'your', 'do', 'does', 'did', 'how', 'what', 'when',
  'where', 'why', 'which', 'who', 'can', 'could', 'should', 'would',
]);

export interface TokenizeOptions {
  stopwords?: ReadonlySet<string> | null;
  stem?: boolean;
  minLength?: number;
}

export function tokenize(input: string, options: TokenizeOptions = {}): string[] {
  if (!input) return [];
  const stopwords = options.stopwords === null
    ? null
    : options.stopwords ?? DEFAULT_STOPWORDS;
  const stem = options.stem ?? true;
  const minLength = options.minLength ?? 2;

  const out: string[] = [];
  for (const raw of input.toLowerCase().split(/[^a-z0-9]+/)) {
    if (!raw || raw.length < minLength) continue;
    if (stopwords && stopwords.has(raw)) continue;
    out.push(stem ? lightStem(raw) : raw);
  }
  return out;
}

export function lightStem(word: string): string {
  if (word.length > 4 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 3 && word.endsWith('ed')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 3 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}

export { DEFAULT_STOPWORDS };
