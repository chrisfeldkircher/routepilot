import { useReveal } from '../useReveal';

export function DevExperience() {
  const [leftRef, leftVisible] = useReveal<HTMLDivElement>();
  const [rightRef, rightVisible] = useReveal<HTMLDivElement>();

  return (
    <section className="py-24 bg-surface-container-low border-y border-outline-variant/10">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 lg:gap-16 items-center">
          <div ref={leftRef} className={`lg:w-1/2 reveal reveal-left ${leftVisible ? 'visible' : ''}`}>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-headline font-bold text-white mb-6 leading-tight">
              Built for DX.
              <br />
              Loved by UX.
            </h2>
            <p className="text-on-surface-variant text-base sm:text-lg mb-8 leading-relaxed">
              Define steps with a single function call. Selector targeting, tooltip placement,
              and inline markup are all built in — no wrappers, no context providers, no boilerplate.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="text-on-surface">Type-safe step definitions with full IntelliSense</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="text-on-surface">Scoped preparations that setup and teardown state automatically</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="text-on-surface">DAG-based transitions with branching and hub navigation</span>
              </li>
            </ul>
          </div>

          <div ref={rightRef} className={`lg:w-1/2 w-full reveal reveal-scale ${rightVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.2s' }}>
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/20 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-3 bg-surface-container-high">
                <span className="text-xs font-mono text-on-surface-variant">
                  onboarding.step.ts
                </span>
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">
                  TypeScript
                </span>
              </div>
              <div className="p-4 sm:p-8 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
                <pre className="text-slate-300">
                  <code>
                    <span className="text-tertiary">import</span>
                    {' { createStep } '}
                    <span className="text-tertiary">from</span>
                    {' '}
                    <span className="text-primary-dim">&apos;@routepilot/core&apos;</span>
                    {';\n\n'}
                    <span className="text-tertiary">export const</span>
                    {' welcomeStep = '}
                    <span className="text-primary">createStep</span>
                    {'(\n  '}
                    <span className="text-primary-dim">&apos;welcome-intro&apos;</span>
                    {',\n  '}
                    <span className="text-primary-dim">&apos;/dashboard&apos;</span>
                    {',\n  '}
                    <span className="text-primary-dim">&apos;[data-tour="main-cta"]&apos;</span>
                    {',\n  '}
                    <span className="text-primary-dim">&apos;Welcome to the Platform&apos;</span>
                    {',\n  '}
                    <span className="text-primary-dim">&apos;Click here to create your ==first project==.&apos;</span>
                    {',\n  '}
                    <span className="text-primary-dim">&apos;bottom&apos;</span>
                    {',\n  '}
                    {'{\n    '}
                    <span className="text-secondary">preparations</span>
                    {': [{\n      '}
                    <span className="text-secondary">scope</span>
                    {': '}
                    <span className="text-primary-dim">&apos;step&apos;</span>
                    {',\n      '}
                    <span className="text-secondary">factory</span>
                    {': () => {\n        document.body.classList.'}
                    <span className="text-secondary">add</span>
                    {'('}
                    <span className="text-primary-dim">&apos;tour-active&apos;</span>
                    {');\n        '}
                    <span className="text-tertiary">return</span>
                    {' () => document.body.classList.'}
                    <span className="text-secondary">remove</span>
                    {'('}
                    <span className="text-primary-dim">&apos;tour-active&apos;</span>
                    {');\n      }\n    }]\n  }\n);'}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
