export function DevExperience() {
  return (
    <section className="py-24 bg-surface-container-low border-y border-outline-variant/10">
      <div className="max-w-screen-2xl mx-auto px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-6 leading-tight">
              Built for DX.
              <br />
              Loved by UX.
            </h2>
            <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
              Defining a step is as simple as defining a function. Access the
              {' '}<code className="font-mono text-primary">StepRuntimeContext</code>{' '}
              to manipulate global state, trigger UI side effects, and gate user progress.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="text-on-surface">Type-safe configuration with TypeScript</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="text-on-surface">Hot-reload support for flow changes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="text-on-surface">Universal Event Bridge for native UI binding</span>
              </li>
            </ul>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/20 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-3 bg-surface-container-high">
                <span className="text-xs font-mono text-on-surface-variant">
                  onboarding.step.ts
                </span>
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">
                  TypeScript
                </span>
              </div>
              <div className="p-8 font-mono text-sm overflow-x-auto leading-relaxed">
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
                    {'({\n  '}
                    <span className="text-secondary">id</span>
                    {': '}
                    <span className="text-primary-dim">&apos;welcome-intro&apos;</span>
                    {',\n  '}
                    <span className="text-secondary">prepare</span>
                    {': '}
                    <span className="text-tertiary-dim">async</span>
                    {' (ctx) => {\n    '}
                    <span className="text-outline-variant">
                      {'// Initialize idempotent UI state'}
                    </span>
                    {'\n    ctx.'}
                    <span className="text-secondary">store</span>
                    {'.'}
                    <span className="text-secondary">dispatch</span>
                    {'({ type: '}
                    <span className="text-primary-dim">&apos;SET_THEME&apos;</span>
                    {', theme: '}
                    <span className="text-primary-dim">&apos;light&apos;</span>
                    {' });\n  },\n  '}
                    <span className="text-secondary">render</span>
                    {': (ctx) => {\n    '}
                    <span className="text-tertiary">return</span>
                    {' ctx.'}
                    <span className="text-secondary">ui</span>
                    {'.'}
                    <span className="text-secondary">highlight</span>
                    {'('}
                    <span className="text-primary-dim">&apos;#main-cta&apos;</span>
                    {', {\n      title: '}
                    <span className="text-primary-dim">&apos;Welcome to the Platform&apos;</span>
                    {',\n      body: '}
                    <span className="text-primary-dim">
                      &apos;Click here to get started with your first project.&apos;
                    </span>
                    {'\n    });\n  },\n  '}
                    <span className="text-secondary">gate</span>
                    {': (event, ctx) => {\n    '}
                    <span className="text-tertiary">return</span>
                    {' event.'}
                    <span className="text-secondary">type</span>
                    {' === '}
                    <span className="text-primary-dim">&apos;UI_CLICK&apos;</span>
                    {' && event.'}
                    <span className="text-secondary">id</span>
                    {' === '}
                    <span className="text-primary-dim">&apos;main-cta&apos;</span>
                    {';\n  }\n});'}
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
