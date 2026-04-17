import type { NodeId, StepDefinition, TourDefinition } from '../types';
import type { DagTourDefinition, DagTourNode } from './dagTourHistory';
import { TourStateMachine } from '../state/stateMachine';
import type { DemoDataBridge, EventBridge } from '../services';
import { InMemoryDemoDataBridge, InMemoryEventBridge } from '../services';

const toIdArray = (value: NodeId | NodeId[] | undefined): NodeId[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };
  
  export const checkStepDefinitions = (steps: StepDefinition[]): StepDefinition[] => {
    const ids = new Set<string>();
    for (const step of steps) {
      if (!step.id) throw new Error('Every step needs a non-empty id');
      if (ids.has(step.id)) throw new Error(`Duplicate step id "${step.id}"`);
      ids.add(step.id);
    }
  
    const ensureRefsExist = (idOrIds?: NodeId | NodeId[]) => {
      for (const ref of toIdArray(idOrIds)) {
        if (!ids.has(ref)) throw new Error(`Referenced step "${ref}" does not exist`);
      }
    };
  
    for (const step of steps) {
      ensureRefsExist(step.next);
      ensureRefsExist(step.previous);
      if (step.transitions) {
        step.transitions.forEach((transition) => {
          if (!transition || !transition.target) {
            throw new Error(`Step "${step.id}" declares an invalid transition`);
          }
          ensureRefsExist(transition.target);
        });
      }
    }
  
    return steps;
  };
  
export const buildDag = (tour: TourDefinition): DagTourDefinition => {
    const { steps, id, name } = tour;
    checkStepDefinitions(steps);

    const totalSteps = steps.length;
  
    const nodes: Record<string, DagTourNode> = {};
    steps.forEach((step, index) => {
      const autoNext = steps[index + 1]?.id;
      const autoPrev = steps[index - 1]?.id;
  
      const nextIds = toIdArray(step.next || autoNext);
      const prevIds = toIdArray(step.previous || autoPrev);
  
      nodes[step.id] = {
        id: step.id,
        label: step.title ?? step.id,
        description: typeof step.body === 'string' ? step.body : '',
        step,
        next: nextIds,
        previous: prevIds,
        transitions: step.transitions ?? [],
      };
    });
  
    const first = steps[0];
    if (!first) throw new Error('Tour has no steps');
  
    const sequence = steps.map((step) => step.id);

    return {
      id: id ?? '',
      name: name ?? '',
      entryId: first.id,
      nodes,
      totalSteps,
      sequence,
      navigation: tour.navigation,
    };
};

export const createTourMachine = ({
  demoBridge = new InMemoryDemoDataBridge(),
  eventBridge = new InMemoryEventBridge(),
}: {
  demoBridge?: DemoDataBridge;
  eventBridge?: EventBridge;
}): TourStateMachine => {
  return new TourStateMachine({ demoBridge, eventBridge });
};
