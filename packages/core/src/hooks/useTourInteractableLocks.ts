import { useEffect, useState } from 'react';

export type LockState = {
  openLocked: boolean;
  closeLocked: boolean;
};

export function useTourInteractableLocks(id: string): LockState {
  const [state, setState] = useState<LockState>({
    openLocked: false,
    closeLocked: false,
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const read = () => {
      const openAttr =
        document.documentElement.getAttribute('data-tour-lock-open') ?? '';
      const closeAttr =
        document.documentElement.getAttribute('data-tour-lock-close') ?? '';
      const openIds = openAttr.split(',').map((s) => s.trim()).filter(Boolean);
      const closeIds = closeAttr.split(',').map((s) => s.trim()).filter(Boolean);

      setState({
        openLocked: openIds.includes(id),
        closeLocked: closeIds.includes(id),
      });
    };

    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-tour-lock-open', 'data-tour-lock-close'],
    });

    return () => observer.disconnect();
  }, [id]);

  return state;
}
