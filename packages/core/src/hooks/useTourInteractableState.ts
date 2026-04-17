import { useCallback, useEffect } from 'react';
import { useTourInteractableLocks } from './useTourInteractableLocks';

export type UseTourInteractableStateOptions = {
  tourCanOverrideLocks?: boolean;
};

export function useTourInteractableState(
  id: string,
  setOpen: (next: boolean) => void,
  options: UseTourInteractableStateOptions = {}
) {
  const { openLocked, closeLocked } = useTourInteractableLocks(id);
  const { tourCanOverrideLocks = true } = options;

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (!detail || detail.id !== id) return;
      if (!tourCanOverrideLocks && openLocked) return;
      setOpen(true);
    };

    const handleClose = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (!detail || detail.id !== id) return;
      if (!tourCanOverrideLocks && closeLocked) return;
      setOpen(false);
    };

    window.addEventListener(
      'guided-tour:interactable-open',
      handleOpen as EventListener
    );
    window.addEventListener(
      'guided-tour:interactable-close',
      handleClose as EventListener
    );
    return () => {
      window.removeEventListener(
        'guided-tour:interactable-open',
        handleOpen as EventListener
      );
      window.removeEventListener(
        'guided-tour:interactable-close',
        handleClose as EventListener
      );
    };
  }, [id, setOpen, tourCanOverrideLocks, openLocked, closeLocked]);

  const safeSetOpen = useCallback(
    (next: boolean) => {
      if (next && openLocked) return;
      if (!next && closeLocked) return;
      setOpen(next);
    },
    [setOpen, openLocked, closeLocked]
  );

  return {
    openLocked,
    closeLocked,
    setOpen: safeSetOpen,
  };
}
