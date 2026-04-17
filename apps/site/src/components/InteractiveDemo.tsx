import { useState } from 'react';
import { useReveal } from '../useReveal';
import { DemoModal, type DemoScenario } from './DemoModal';

type ScenarioId = 'standard-onboarding' | 'frequently-asked-questions' | 'error-recovery' | 'interactive-docs';

const LAUNCHABLE_SCENARIOS: Record<string, DemoScenario> = {
  'standard-onboarding': 'standard-onboarding',
  'frequently-asked-questions': 'frequently-asked-questions',
  'error-recovery': 'error-recovery',
  'interactive-docs': 'interactive-docs',
};

interface Scenario {
  id: ScenarioId;
  icon: string;
  label: string;
}

const scenarios: Scenario[] = [
  { id: 'standard-onboarding', icon: 'person_add', label: 'Standard Onboarding' },
  { id: 'frequently-asked-questions', icon: 'support_agent', label: 'Frequently Asked Questions' },
  { id: 'error-recovery', icon: 'running_with_errors', label: 'Error Recovery' },
  { id: 'interactive-docs', icon: 'auto_stories', label: 'Interactive Documentation' },
];

export function InteractiveDemo() {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('standard-onboarding');
  const [isDemoOpen, setDemoOpen] = useState(false);
  const [leftRef, leftVisible] = useReveal<HTMLDivElement>();
  const [rightRef, rightVisible] = useReveal<HTMLDivElement>();

  const launchableScenario = LAUNCHABLE_SCENARIOS[activeScenario];
  const isLaunchable = Boolean(launchableScenario);

  const handleLaunch = () => {
    if (isLaunchable) {
      setDemoOpen(true);
    }
  };

  return (
    <section id="choose-your-story" className="py-24 bg-surface-container-low">
      <div className="max-w-screen-2xl mx-auto px-8">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          <div ref={leftRef} className={`md:w-1/3 reveal reveal-left ${leftVisible ? 'visible' : ''}`}>
            <h2 className="text-4xl font-headline font-bold text-white mb-6">Choose Your Story</h2>
            <p className="text-on-surface-variant mb-8">
              Select a pattern to see how routePilot handles state transitions, gating, and
              environmental preparation.
            </p>
            <div className="space-y-2">
              {scenarios.map((scenario) => {
                const isActive = scenario.id === activeScenario;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setActiveScenario(scenario.id)}
                    className={
                      isActive
                        ? 'w-full flex items-center gap-4 px-6 py-4 rounded-xl glass-panel border-l-4 border-primary text-primary transition-all text-left'
                        : 'w-full flex items-center gap-4 px-6 py-4 rounded-xl hover:bg-surface-container text-on-surface-variant transition-all text-left'
                    }
                  >
                    <span className="material-symbols-outlined">{scenario.icon}</span>
                    <span className="font-headline font-medium">{scenario.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={rightRef} className={`md:w-2/3 w-full reveal reveal-right ${rightVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
            <div className="rounded-xl overflow-hidden bg-surface-container-lowest border border-outline-variant/10 shadow-2xl relative">
              <div className="h-10 bg-surface-container-high flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-error/40" />
                <div className="w-3 h-3 rounded-full bg-tertiary/40" />
                <div className="w-3 h-3 rounded-full bg-primary/40" />
                <div className="ml-4 text-[10px] text-on-surface-variant font-mono tracking-widest">
                  RUNTIME_INSTANCE: {activeScenario.toUpperCase().replace(/-/g, '_')}_FLOW_V1
                </div>
              </div>
              <div className="aspect-video relative p-12 flex flex-col items-center justify-center bg-[#091328]">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 800 450"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                  >
                    <defs>
                      <radialGradient id="demoGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#a3a6ff" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#060e20" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <rect width="800" height="450" fill="url(#demoGlow)" />
                    <path
                      d="M120 220 L260 140 L400 220 L540 140 L680 220"
                      stroke="#a3a6ff"
                      strokeWidth="1.5"
                      strokeDasharray="6 6"
                    />
                    <path
                      d="M260 140 L260 340 M540 140 L540 340"
                      stroke="#c180ff"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <circle cx="120" cy="220" r="10" fill="#a3a6ff" />
                    <rect x="242" y="122" width="36" height="36" rx="4" className="dag-node" />
                    <circle cx="400" cy="220" r="10" fill="#c180ff" />
                    <rect x="522" y="122" width="36" height="36" rx="4" className="dag-node" />
                    <circle cx="680" cy="220" r="10" fill="#a3a6ff" />
                  </svg>
                </div>
                <div className="glass-panel p-8 rounded-2xl border border-outline-variant/20 text-center relative z-10 max-w-md">
                  <h3 className="text-2xl font-headline font-bold text-white mb-4">
                    Live State Visualization
                  </h3>
                  <p className="text-on-surface-variant text-sm mb-6">
                    Interactive runtime environment. Click to simulate the &apos;
                    {scenarios.find((s) => s.id === activeScenario)?.label}&apos; logic flow
                    through a series of guarded state transitions.
                  </p>
                  <button
                    type="button"
                    onClick={handleLaunch}
                    disabled={!isLaunchable}
                    className="bg-white text-surface px-6 py-2.5 rounded-md font-headline font-bold hover:bg-primary transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">play_circle</span>
                    Try Live Demo
                  </button>
                  {!isLaunchable && (
                    <p className="mt-4 text-[10px] uppercase tracking-widest text-tertiary">
                      Coming soon
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DemoModal
        open={isDemoOpen && isLaunchable}
        scenario={launchableScenario ?? 'standard-onboarding'}
        onClose={() => setDemoOpen(false)}
      />
    </section>
  );
}
