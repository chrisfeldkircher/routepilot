export interface Bm25Options {
  k1?: number;
  b?: number;
}

export interface Bm25Document {
  id: string;
  tokens: string[];
}

export interface Bm25Hit {
  id: string;
  score: number;
}

interface InternalDoc {
  id: string;
  length: number;
  termFreq: Map<string, number>;
}

export class Bm25Index {
  private readonly docs: InternalDoc[] = [];
  private readonly docFreq = new Map<string, number>();
  private totalLength = 0;
  private readonly k1: number;
  private readonly b: number;

  constructor(options: Bm25Options = {}) {
    this.k1 = options.k1 ?? 1.5;
    this.b = options.b ?? 0.75;
  }

  add(doc: Bm25Document): void {
    const termFreq = new Map<string, number>();
    for (const token of doc.tokens) {
      termFreq.set(token, (termFreq.get(token) ?? 0) + 1);
    }
    for (const term of termFreq.keys()) {
      this.docFreq.set(term, (this.docFreq.get(term) ?? 0) + 1);
    }
    this.docs.push({ id: doc.id, length: doc.tokens.length, termFreq });
    this.totalLength += doc.tokens.length;
  }

  size(): number {
    return this.docs.length;
  }

  search(queryTokens: string[], limit = 10): Bm25Hit[] {
    if (this.docs.length === 0 || queryTokens.length === 0) return [];
    const avgdl = this.totalLength / this.docs.length;
    const uniqueQueryTerms = Array.from(new Set(queryTokens));

    const hits: Bm25Hit[] = [];
    for (const doc of this.docs) {
      let score = 0;
      for (const term of uniqueQueryTerms) {
        const tf = doc.termFreq.get(term);
        if (!tf) continue;
        const df = this.docFreq.get(term) ?? 0;
        const idf = Math.log(
          (this.docs.length - df + 0.5) / (df + 0.5) + 1,
        );
        const norm = 1 - this.b + this.b * (doc.length / avgdl);
        score += idf * ((tf * (this.k1 + 1)) / (tf + this.k1 * norm));
      }
      if (score > 0) hits.push({ id: doc.id, score });
    }

    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit);
  }
}
