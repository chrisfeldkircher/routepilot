import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TourStateMachine } from './stateMachine';
import type { TourDefinition, StepDefinition } from '../types';

const step = (id: string, overrides?: Partial<StepDefinition>): StepDefinition => ({
  id,
  route: '/',
  title: `Step ${id}`,
  body: `Body for ${id}`,
  ...overrides,
});

const tour = (steps: StepDefinition[], overrides?: Partial<TourDefinition>): TourDefinition => ({
  id: 'test-tour',
  steps,
  ...overrides,
});

describe('TourStateMachine', () => {
  let machine: TourStateMachine;

  beforeEach(() => {
    machine = new TourStateMachine();
  });

  describe('basic lifecycle', () => {
    it('starts in idle state', () => {
      expect(machine.getState().status).toBe('idle');
    });

    it('transitions to running on start', async () => {
      await machine.startWithDefinition(tour([step('a'), step('b')]));
      expect(machine.getState().status).toBe('running');
      expect(machine.getState().nodeId).toBe('a');
    });

    it('navigates forward and backward', async () => {
      await machine.startWithDefinition(tour([step('a'), step('b'), step('c')]));
      expect(machine.getState().nodeId).toBe('a');

      await machine.next();
      expect(machine.getState().nodeId).toBe('b');

      await machine.back();
      expect(machine.getState().nodeId).toBe('a');
    });

    it('completes when advancing past last step', async () => {
      await machine.startWithDefinition(tour([step('only')]));
      await machine.next();
      expect(machine.getState().status).toBe('completed');
    });

    it('stops and resets to idle', async () => {
      await machine.startWithDefinition(tour([step('a')]));
      await machine.stop();
      expect(machine.getState().status).toBe('idle');
      expect(machine.getState().nodeId).toBeNull();
    });
  });

  describe('lifecycle hook resilience', () => {
    it('survives a throwing onEnter', async () => {
      const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failStep = step('fail', {
        onEnter: () => { throw new Error('onEnter boom'); },
      });

      await machine.startWithDefinition(tour([failStep, step('ok')]));

      // Tour should still be running, not in error state
      expect(machine.getState().status).toBe('running');
      expect(machine.getState().nodeId).toBe('fail');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('survives a throwing onExit', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const failStep = step('fail', {
        onExit: () => { throw new Error('onExit boom'); },
      });

      await machine.startWithDefinition(tour([failStep, step('ok')]));
      await machine.next(); // triggers onExit of 'fail'

      expect(machine.getState().status).toBe('running');
      expect(machine.getState().nodeId).toBe('ok');
      warnSpy.mockRestore();
    });

    it('survives a throwing scene factory', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const failStep = step('fail', {
        scene: () => { throw new Error('scene boom'); },
      });

      await machine.startWithDefinition(tour([failStep]));
      expect(machine.getState().status).toBe('running');
      warnSpy.mockRestore();
    });

    it('survives a throwing onAdvance', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const failStep = step('fail', {
        onAdvance: () => { throw new Error('onAdvance boom'); },
      });

      await machine.startWithDefinition(tour([failStep, step('ok')]));
      await machine.next();

      expect(machine.getState().status).toBe('running');
      expect(machine.getState().nodeId).toBe('ok');
      warnSpy.mockRestore();
    });

    it('survives a throwing onRetreat', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const failStep = step('b', {
        onRetreat: () => { throw new Error('onRetreat boom'); },
      });

      await machine.startWithDefinition(tour([step('a'), failStep]));
      await machine.next(); // go to 'b'
      await machine.back(); // triggers onRetreat of 'b'

      expect(machine.getState().status).toBe('running');
      expect(machine.getState().nodeId).toBe('a');
      warnSpy.mockRestore();
    });
  });

  describe('route policy', () => {
    it('sets route policy on the guard when entering a step with a route', async () => {
      await machine.startWithDefinition(tour([
        step('a', { route: '/tickets/9001' }),
      ]));

      const policy = machine.routeGuard.getPolicy();
      expect(policy).not.toBeNull();
      expect(policy!.paths).toEqual(['/tickets/9001']);
      expect(policy!.mode).toBe('navigate'); // default
    });

    it('uses routeMode from step definition', async () => {
      await machine.startWithDefinition(tour([
        step('a', { route: '/tickets/9001', routeMode: 'guard' }),
      ]));

      expect(machine.routeGuard.getPolicy()!.mode).toBe('guard');
    });

    it('supports array routes', async () => {
      await machine.startWithDefinition(tour([
        step('a', { route: ['/a', '/b'] as any }),
      ]));

      const policy = machine.routeGuard.getPolicy();
      expect(policy!.paths).toEqual(['/a', '/b']);
    });

    it('clears route policy on step exit when next step has no route', async () => {
      const noRouteStep: StepDefinition = {
        id: 'b',
        title: 'No Route',
        body: 'Body',
      };

      await machine.startWithDefinition(tour([
        step('a', { route: '/tickets/9001' }),
        noRouteStep,
      ]));

      expect(machine.routeGuard.getPolicy()).not.toBeNull();

      await machine.next();
      // Step 'a' cleanup clears the policy; step 'b' has no route so no new policy
      expect(machine.routeGuard.getPolicy()).toBeNull();
    });

    it('clears route policy on tour stop', async () => {
      await machine.startWithDefinition(tour([
        step('a', { route: '/tickets/9001' }),
      ]));

      expect(machine.routeGuard.getPolicy()).not.toBeNull();
      await machine.stop();
      expect(machine.routeGuard.getPolicy()).toBeNull();
    });
  });

  describe('interceptEvent auto-cleanup', () => {
    it('cleans up event interceptors on step exit', async () => {
      let interceptCalled = 0;
      const stepWithInterceptor = step('a', {
        onEnter: (ctx) => {
          ctx.interceptEvent('test-event', () => {
            interceptCalled++;
          });
        },
      });

      await machine.startWithDefinition(tour([stepWithInterceptor, step('b')]));

      // Emit the event — interceptor should fire
      const services = machine.createServices('a');
      await services.events.emit('test-event', {});
      expect(interceptCalled).toBe(1);

      // Advance to next step — interceptor should be cleaned up
      await machine.next();

      // Emit again — interceptor should NOT fire
      await services.events.emit('test-event', {});
      expect(interceptCalled).toBe(1); // still 1, not 2
    });

    it('does not accumulate interceptors on re-entry', async () => {
      let interceptCalled = 0;
      const stepWithInterceptor = step('a', {
        onEnter: (ctx) => {
          ctx.interceptEvent('test-event', () => {
            interceptCalled++;
          });
        },
      });

      await machine.startWithDefinition(tour([stepWithInterceptor, step('b')]));

      await machine.next(); // exit 'a', enter 'b'
      await machine.back(); // exit 'b', re-enter 'a' — new interceptor registered

      interceptCalled = 0;
      const services = machine.createServices('a');
      await services.events.emit('test-event', {});
      // Should fire exactly once, not twice (no accumulation)
      expect(interceptCalled).toBe(1);
    });
  });

  describe('state notifications', () => {
    it('notifies subscribers on state changes', async () => {
      const listener = vi.fn();
      machine.subscribe(listener);

      await machine.startWithDefinition(tour([step('a')]));

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(lastCall.status).toBe('running');
    });

    it('unsubscribe stops notifications', async () => {
      const listener = vi.fn();
      const unsubscribe = machine.subscribe(listener);
      unsubscribe();

      await machine.startWithDefinition(tour([step('a')]));
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
