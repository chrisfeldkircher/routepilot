import { createContext, useContext } from 'react';
import type { GuidedTourContextValue } from '@routepilot/engine';

const GuidedTourContext = createContext<GuidedTourContextValue | null>(null);

export const GuidedTourProviderContext = GuidedTourContext;

export const useGuidedTourContext = (): GuidedTourContextValue => {
  const value = useContext(GuidedTourContext);
  if (!value) {
    throw new Error('useGuidedTourContext must be used within a GuidedTourProvider');
  }
  return value;
};

export default GuidedTourContext;
