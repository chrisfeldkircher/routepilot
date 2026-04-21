import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useGuidedTour } from '@routepilot/react';
import {
  resolveAssistantLoadingAnimation,
  type AssistantMatch,
  type AssistantSearchScope,
  type QueryOptions,
  type TourAssistantLoadingAnimationName,
  type TourIndex,
} from '@routepilot/assistant';

export interface TourAssistantContextValue {
  open: boolean;
  query: string;
  results: AssistantMatch[];
  currentTourId: string | undefined;
  loadingAnimation: TourAssistantLoadingAnimationName;
  inputRef: React.RefObject<HTMLInputElement | null>;
  toggle: () => void;
  close: () => void;
  setQuery: (value: string) => void;
  submit: () => void;
  jumpTo: (match: AssistantMatch) => void;
}

const TourAssistantContext = createContext<TourAssistantContextValue | null>(null);

export const useTourAssistantContext = (): TourAssistantContextValue => {
  const ctx = useContext(TourAssistantContext);
  if (!ctx) {
    throw new Error(
      'useTourAssistantContext must be used inside <TourAssistantProvider>',
    );
  }
  return ctx;
};

export interface TourAssistantProviderProps {
  index: TourIndex;
  limit?: number;
  queryOptions?: Omit<QueryOptions, 'limit'>;
  children: ReactNode;
}

export function TourAssistantProvider({
  index,
  limit = 3,
  queryOptions,
  children,
}: TourAssistantProviderProps) {
  const { state, actions, registry, config } = useGuidedTour();
  const currentTourId = state.tourId;
  const configuredLoadingAnimation = config.assistant?.loadingAnimation;

  const [open, setOpen] = useState(false);
  const [query, setQueryValue] = useState('');
  const [results, setResults] = useState<AssistantMatch[]>([]);
  const [loadingAnimation, setLoadingAnimation] =
    useState<TourAssistantLoadingAnimationName>(() =>
      resolveAssistantLoadingAnimation(configuredLoadingAnimation),
    );
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRequestRef = useRef(0);

  useEffect(() => {
    searchRequestRef.current += 1;
    setOpen(false);
    setQueryValue('');
    setResults([]);
  }, [state.nodeId, currentTourId]);

  useEffect(() => {
    if (!currentTourId) return;
    setLoadingAnimation(
      resolveAssistantLoadingAnimation(configuredLoadingAnimation),
    );
  }, [configuredLoadingAnimation, currentTourId]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const runSearch = useCallback(
    async (text: string) => {
      const requestId = searchRequestRef.current + 1;
      searchRequestRef.current = requestId;
      const trimmed = text.trim();
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }

      const scope: AssistantSearchScope =
        queryOptions?.scope ??
        (currentTourId ? 'current-tour-first' : 'all-tours');

      const nextResults = await index.queryAsync(trimmed, {
        ...queryOptions,
        currentTourId: currentTourId ?? undefined,
        scope,
        limit,
      });

      if (searchRequestRef.current !== requestId) return;
      setResults(nextResults);
    },
    [currentTourId, index, limit, queryOptions],
  );

  const setQuery = useCallback(
    (value: string) => {
      setQueryValue(value);
      void runSearch(value);
    },
    [runSearch],
  );

  const close = useCallback(() => {
    searchRequestRef.current += 1;
    setOpen(false);
    setQueryValue('');
    setResults([]);
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (prev) {
        searchRequestRef.current += 1;
        setQueryValue('');
        setResults([]);
      }
      return !prev;
    });
  }, []);

  const jumpTo = useCallback(
    (match: AssistantMatch) => {
      const tour = match.tour ?? registry?.get(match.tourId) ?? null;
      if (currentTourId && match.tourId === currentTourId) {
        void actions.goTo(match.stepId);
      } else if (tour) {
        void actions.startWithDefinition(tour, { startNodeId: match.stepId });
      }
      close();
    },
    [actions, currentTourId, registry, close],
  );

  const submit = useCallback(() => {
    if (results.length > 0) {
      jumpTo(results[0]);
    } else {
      void runSearch(query);
    }
  }, [results, query, jumpTo, runSearch]);

  const value = useMemo<TourAssistantContextValue>(
    () => ({
      open,
      query,
      results,
      currentTourId: currentTourId ?? undefined,
      loadingAnimation,
      inputRef,
      toggle,
      close,
      setQuery,
      submit,
      jumpTo,
    }),
    [
      open,
      query,
      results,
      currentTourId,
      loadingAnimation,
      toggle,
      close,
      setQuery,
      submit,
      jumpTo,
    ],
  );

  return (
    <TourAssistantContext.Provider value={value}>
      {children}
    </TourAssistantContext.Provider>
  );
}
