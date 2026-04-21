import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface TooltipSlots {
  /**
   * Rendered inside the tour tooltip, between the body/branches and the
   * step-counter/Back/Next footer. When this is falsy, the surrounding
   * divider/container does not render. Intended for optional framework
   * add-ons (e.g. a retrieval assistant) to inject UI without the core
   * package knowing anything about them.
   */
  footer?: ReactNode;
  /**
   * Rendered inline in the tooltip footer nav group, before the Back
   * button. Intended for plugin buttons (e.g. an "Ask assistant" toggle)
   * that should live next to Back/Next.
   */
  footerNav?: ReactNode;
}

const TooltipSlotContext = createContext<TooltipSlots>({});

export const TooltipSlotProvider = TooltipSlotContext.Provider;

export const useTooltipSlots = (): TooltipSlots => useContext(TooltipSlotContext);

export default TooltipSlotContext;
