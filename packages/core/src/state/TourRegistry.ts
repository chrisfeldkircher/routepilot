import type { TourDefinition, TourId, TourRegistryLike } from '../types';

const cloneDefinition = (definition: TourDefinition): TourDefinition => ({
  ...definition,
  steps: definition.steps.map((step) => ({ ...step })),
});

export class TourRegistry implements TourRegistryLike {
  private readonly registry = new Map<TourId, TourDefinition>();

  register(definition: TourDefinition): void {
    this.registry.set(definition.id, cloneDefinition(definition));
  }

  registerMany(definitions: TourDefinition[]): void {
    definitions.forEach((definition) => this.register(definition));
  }

  get(id: TourId): TourDefinition | undefined {
    const stored = this.registry.get(id);
    return stored ? cloneDefinition(stored) : undefined;
  }

  list(): TourDefinition[] {
    return Array.from(this.registry.values()).map((definition) => cloneDefinition(definition));
  }
}

export const createTourRegistry = (initial?: TourDefinition[]): TourRegistry => {
  const registry = new TourRegistry();
  if (initial?.length) {
    registry.registerMany(initial);
  }
  return registry;
};
