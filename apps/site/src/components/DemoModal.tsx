import { useEffect } from 'react';

export type DemoScenario = 'standard-onboarding' | 'frequently-asked-questions' | 'error-recovery' | 'interactive-docs';

interface DemoModalProps {
  open: boolean;
  scenario: DemoScenario;
  onClose: () => void;
}

const SCENARIO_CONFIG: Record<
  DemoScenario,
  { label: string; runtimeInstance: string; iframeSrc: string }
> = {
  'standard-onboarding': {
    label: 'Standard Onboarding Live Demo',
    runtimeInstance: 'STANDARD_ONBOARDING_FLOW_V1',
    iframeSrc: '/demo/?autotour=1',
  },
  'frequently-asked-questions': {
    label: 'FAQ-as-Tour Live Demo',
    runtimeInstance: 'FAQ_PICKUP_FLOW_V1',
    iframeSrc: '/demo/?autotour=1&scenario=faq&route=pickup',
  },
  'error-recovery': {
    label: 'Error Recovery Live Demo',
    runtimeInstance: 'ERROR_RECOVERY_FLOW_V1',
    iframeSrc: '/demo/?autotour=1&scenario=error-recovery&route=import',
  },
  'interactive-docs': {
    label: 'Interactive Documentation Live Demo',
    runtimeInstance: 'INTERACTIVE_DOCS_FLOW_V1',
    iframeSrc: '/demo/?autotour=1&scenario=interactive-docs&route=settings',
  },
};

export function DemoModal({ open, scenario, onClose }: DemoModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  // Let the demo finish its outro before the modal disappears.
  useEffect(() => {
    if (!open) return;

    let closeTimer: number | undefined;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; status?: string } | null;
      if (!data || data.type !== 'routepilot:tour-finished') return;

      const delay = data.status === 'completed' ? 1000 : 200;
      closeTimer = window.setTimeout(onClose, delay);
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    };
  }, [open, onClose]);

  if (!open) return null;

  const config = SCENARIO_CONFIG[scenario];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={config.label}
    >
      <div className="relative w-full h-full max-w-[1400px] max-h-[900px] rounded-lg sm:rounded-xl overflow-hidden bg-surface-container-lowest border border-outline-variant/20 shadow-2xl flex flex-col">
        <div className="h-8 sm:h-10 bg-surface-container-high flex items-center px-2 sm:px-4 gap-2 flex-shrink-0">
          <div className="hidden sm:block w-3 h-3 rounded-full bg-error/40" />
          <div className="hidden sm:block w-3 h-3 rounded-full bg-tertiary/40" />
          <div className="hidden sm:block w-3 h-3 rounded-full bg-primary/40" />
          <div className="sm:ml-4 text-[8px] sm:text-[10px] text-on-surface-variant font-mono tracking-widest truncate">
            {config.runtimeInstance}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close demo"
            className="ml-auto material-symbols-outlined text-on-surface-variant hover:text-white transition-colors text-xl sm:text-2xl"
          >
            close
          </button>
        </div>
        <iframe
          src={config.iframeSrc}
          title={`routePilot ${config.label}`}
          className="flex-1 w-full border-0 bg-[#091328]"
          style={{ minHeight: 0 }}
        />
      </div>
    </div>
  );
}
