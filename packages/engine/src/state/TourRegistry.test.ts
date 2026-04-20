import { describe, it, expect } from 'vitest';
import { TourRegistry, createTourRegistry } from './TourRegistry';
import type { TourDefinition } from '../types';

const tour = (id: string, title = `Tour ${id}`): TourDefinition => ({
  id,
  name: title,
  steps: [{ id: 'a', title: 'A', body: '' }],
});

describe('TourRegistry', () => {
  it('registers and retrieves a tour by id', () => {
    const registry = new TourRegistry();
    registry.register(tour('one'));
    expect(registry.get('one')?.id).toBe('one');
  });

  it('returns undefined for unknown ids', () => {
    const registry = new TourRegistry();
    expect(registry.get('missing')).toBeUndefined();
  });

  it('overwrites a tour when re-registering the same id', () => {
    const registry = new TourRegistry();
    registry.register(tour('x', 'first'));
    registry.register(tour('x', 'second'));
    expect(registry.get('x')?.name).toBe('second');
  });

  it('registers many tours at once', () => {
    const registry = new TourRegistry();
    registry.registerMany([tour('a'), tour('b')]);
    expect(registry.list().map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('isolates consumers from internal state (clone on register)', () => {
    const registry = new TourRegistry();
    const original = tour('x');
    registry.register(original);

    original.steps.push({ id: 'injected', title: '', body: '' });

    expect(registry.get('x')?.steps).toHaveLength(1);
  });

  it('isolates consumers from internal state (clone on get)', () => {
    const registry = new TourRegistry();
    registry.register(tour('x'));

    const first = registry.get('x')!;
    first.steps.push({ id: 'mutated', title: '', body: '' });

    expect(registry.get('x')?.steps).toHaveLength(1);
  });

  it('isolates consumers from internal state (clone on list)', () => {
    const registry = new TourRegistry();
    registry.register(tour('x'));
    const all = registry.list();
    all[0].steps.push({ id: 'mutated', title: '', body: '' });
    expect(registry.list()[0].steps).toHaveLength(1);
  });
});

describe('createTourRegistry', () => {
  it('returns an empty registry when called with no args', () => {
    expect(createTourRegistry().list()).toEqual([]);
  });

  it('preloads tours when an initial array is provided', () => {
    const registry = createTourRegistry([tour('a'), tour('b')]);
    expect(registry.list().map((t) => t.id).sort()).toEqual(['a', 'b']);
  });
});
