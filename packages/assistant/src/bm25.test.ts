import { describe, it, expect } from 'vitest';
import { Bm25Index } from './bm25';

describe('Bm25Index', () => {
  it('returns [] on an empty index', () => {
    const index = new Bm25Index();
    expect(index.search(['anything'])).toEqual([]);
  });

  it('returns [] when the query has no tokens', () => {
    const index = new Bm25Index();
    index.add({ id: '1', tokens: ['upload', 'error'] });
    expect(index.search([])).toEqual([]);
  });

  it('ranks docs that contain the query term first', () => {
    const index = new Bm25Index();
    index.add({ id: 'a', tokens: ['upload', 'error', 'retry'] });
    index.add({ id: 'b', tokens: ['login', 'password'] });
    const hits = index.search(['upload']);
    expect(hits[0]?.id).toBe('a');
  });

  it('scores a doc higher when it contains more unique query terms', () => {
    const index = new Bm25Index();
    index.add({ id: 'a', tokens: ['upload', 'error'] });
    index.add({ id: 'b', tokens: ['upload', 'login'] });
    const hits = index.search(['upload', 'error']);
    expect(hits[0]?.id).toBe('a');
  });

  it('penalizes rare terms less than common terms via IDF', () => {
    const index = new Bm25Index();
    index.add({ id: 'rare', tokens: ['kubernetes'] });
    index.add({ id: 'common1', tokens: ['foo'] });
    index.add({ id: 'common2', tokens: ['foo'] });
    index.add({ id: 'common3', tokens: ['foo'] });
    const hits = index.search(['kubernetes', 'foo']);
    const rare = hits.find((h) => h.id === 'rare')!;
    const common = hits.find((h) => h.id === 'common1')!;
    expect(rare.score).toBeGreaterThan(common.score);
  });

  it('respects the limit', () => {
    const index = new Bm25Index();
    for (let i = 0; i < 5; i += 1) index.add({ id: `d${i}`, tokens: ['x'] });
    expect(index.search(['x'], 2)).toHaveLength(2);
  });

  it('reports size', () => {
    const index = new Bm25Index();
    expect(index.size()).toBe(0);
    index.add({ id: 'a', tokens: ['x'] });
    index.add({ id: 'b', tokens: ['y'] });
    expect(index.size()).toBe(2);
  });

  it('excludes docs with zero score', () => {
    const index = new Bm25Index();
    index.add({ id: 'a', tokens: ['upload'] });
    index.add({ id: 'b', tokens: ['login'] });
    const hits = index.search(['upload']);
    expect(hits.map((h) => h.id)).toEqual(['a']);
  });
});
