import type { NodeId, StepDefinition, StepTransition, TourId, TourNavigationConfig } from "../types";

export interface DagTourNode {
    id: NodeId;
    label: string;
    description: string;
    step: StepDefinition;
    next: NodeId[];
    previous: NodeId[];
    transitions?: StepTransition[];
    meta?: Record<string, unknown>;
}

export interface DagTourDefinition {
    id: TourId;
    name: string;
    nodes: Record<NodeId, DagTourNode>;
    entryId: NodeId;
    totalSteps: number;
    sequence: NodeId[];
    navigation?: TourNavigationConfig;
}

export interface DagTourHistory {
    from: NodeId | null;
    to: NodeId;
    cause: 'next' | 'back' | 'jump' | 'auto' | 'external' ;
    at: number;
}
