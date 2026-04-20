import { describe, it, expect } from 'vitest';
import { buildDag, checkStepDefinitions, createTourMachine } from './buildDag';
import type { StepDefinition, TourDefinition } from '../types';

const step = (id: string, overrides?: Partial<StepDefinition>): StepDefinition => ({
  id,
  title: `Step ${id}`,
  body: `Body for ${id}`,
  ...overrides,
});

const tour = (steps: StepDefinition[], overrides?: Partial<TourDefinition>): TourDefinition => ({
  id: 't',
  steps,
  ...overrides,
});

describe('checkStepDefinitions', () => {
  it('passes a well-formed list', () => {
    const steps = [step('a'), step('b')];
    expect(checkStepDefinitions(steps)).toBe(steps);
  });

  it('rejects steps without an id', () => {
    expect(() => checkStepDefinitions([step('' as string)])).toThrow(/non-empty id/);
  });

  it('rejects duplicate ids', () => {
    expect(() => checkStepDefinitions([step('a'), step('a')])).toThrow(/Duplicate step id "a"/);
  });

  it('rejects dangling next references', () => {
    expect(() =>
      checkStepDefinitions([step('a', { next: 'nope' })]),
    ).toThrow(/Referenced step "nope"/);
  });

  it('rejects dangling previous references', () => {
    expect(() =>
      checkStepDefinitions([step('a', { previous: 'nope' })]),
    ).toThrow(/Referenced step "nope"/);
  });

  it('accepts arrays for next/previous', () => {
    const steps = [step('a', { next: ['b', 'c'] }), step('b'), step('c')];
    expect(() => checkStepDefinitions(steps)).not.toThrow();
  });

  it('rejects transitions missing target', () => {
    const steps = [step('a', { transitions: [{ target: '' as string }] }), step('b')];
    expect(() => checkStepDefinitions(steps)).toThrow(/invalid transition/);
  });

  it('rejects transitions with unknown target', () => {
    const steps = [step('a', { transitions: [{ target: 'missing' }] }), step('b')];
    expect(() => checkStepDefinitions(steps)).toThrow(/Referenced step "missing"/);
  });
});

describe('buildDag', () => {
  it('throws when the tour has no steps', () => {
    expect(() => buildDag(tour([]))).toThrow(/no steps/);
  });

  it('links sequential next/previous automatically', () => {
    const dag = buildDag(tour([step('a'), step('b'), step('c')]));

    expect(dag.entryId).toBe('a');
    expect(dag.sequence).toEqual(['a', 'b', 'c']);
    expect(dag.totalSteps).toBe(3);

    expect(dag.nodes['a'].next).toEqual(['b']);
    expect(dag.nodes['a'].previous).toEqual([]);
    expect(dag.nodes['b'].next).toEqual(['c']);
    expect(dag.nodes['b'].previous).toEqual(['a']);
    expect(dag.nodes['c'].next).toEqual([]);
    expect(dag.nodes['c'].previous).toEqual(['b']);
  });

  it('respects explicit next/previous overrides', () => {
    const dag = buildDag(
      tour([
        step('a', { next: ['b', 'c'] }),
        step('b', { previous: 'a' }),
        step('c', { previous: 'a' }),
      ]),
    );
    expect(dag.nodes['a'].next).toEqual(['b', 'c']);
    expect(dag.nodes['b'].previous).toEqual(['a']);
    expect(dag.nodes['c'].previous).toEqual(['a']);
  });

  it('copies transitions onto the node (empty array when absent)', () => {
    const transitions = [{ target: 'b', label: 'go' }];
    const dag = buildDag(tour([step('a', { transitions }), step('b')]));
    expect(dag.nodes['a'].transitions).toEqual(transitions);
    expect(dag.nodes['b'].transitions).toEqual([]);
  });

  it('defaults label to id when no title is set', () => {
    const dag = buildDag(tour([step('a', { title: undefined })]));
    expect(dag.nodes['a'].label).toBe('a');
  });

  it('captures body as description only when it is a string', () => {
    const dag = buildDag(
      tour([
        step('a', { body: 'hello' }),
        step('b', { body: { kind: 'rich' } as unknown }),
      ]),
    );
    expect(dag.nodes['a'].description).toBe('hello');
    expect(dag.nodes['b'].description).toBe('');
  });

  it('forwards navigation config onto the built dag', () => {
    const navigation = { hubNodeId: 'a', hubAction: 'goToHub' as const };
    const dag = buildDag(tour([step('a'), step('b')], { navigation }));
    expect(dag.navigation).toEqual(navigation);
  });
});

describe('createTourMachine', () => {
  it('creates a state machine with default in-memory bridges', () => {
    const machine = createTourMachine({});
    expect(machine.getState().status).toBe('idle');
  });
});
