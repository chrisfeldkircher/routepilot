import { InjectionToken } from '@angular/core';
import type { QueryOptions, TourIndex } from '@routepilot/assistant';

export interface TourAssistantConfig {
  /** Pre-built BM25 index over the tours registered with the guided-tour engine. */
  index: TourIndex;
  /** Maximum number of matches to render. Default 3. */
  limit?: number;
  /** Query options merged into every search. Pass `{ scope: 'current-tour-only' }`
   *  to restrict search to the active tour (matches the @routepilot/assistant-react
   *  defaults). `currentTourId` and `limit` are provided by the service. */
  queryOptions?: Omit<QueryOptions, 'limit' | 'currentTourId'>;
}

export const TOUR_ASSISTANT_CONFIG = new InjectionToken<TourAssistantConfig>(
  'TOUR_ASSISTANT_CONFIG',
);
