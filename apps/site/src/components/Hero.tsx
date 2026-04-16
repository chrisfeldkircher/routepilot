export function Hero() {
  return (
    <section className="relative min-h-[870px] flex flex-col justify-center items-center px-6 overflow-hidden hero-gradient">
      {/* Asymmetrical DAG background visual */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <svg
          fill="none"
          height="100%"
          viewBox="0 0 1200 800"
          width="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M200 400 L400 300 M400 300 L600 350 M400 300 L600 250 M600 350 L800 400"
            stroke="#a3a6ff"
            strokeDasharray="8 8"
            strokeWidth="1.5"
          />
          <circle cx="200" cy="400" fill="#a3a6ff" r="8" />
          <rect className="dag-node" height="40" rx="4" width="40" x="380" y="280" />
          <circle cx="600" cy="350" fill="#c180ff" r="8" />
          <circle cx="600" cy="250" fill="#a3a6ff" r="8" />
          <rect className="dag-node" height="40" rx="4" width="40" x="780" y="380" />
        </svg>
      </div>

      <div className="max-w-4xl w-full text-center z-10">
        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-mono tracking-widest uppercase border border-outline-variant/20 rounded-full text-tertiary">
          v1.2.0-stable
        </span>
        <h1 className="text-6xl md:text-8xl font-headline font-bold tracking-tight text-white mb-8 leading-[1.1]">
          The Guided <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dim to-tertiary">
            Workflow Runtime
          </span>
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Orchestrate sophisticated, stateful product stories with DAG-based logic. The
          developer-first engine for onboarding, complex error recovery, and guided feature
          tours.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            className="bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed px-8 py-3.5 rounded-md font-headline font-bold text-lg hover:opacity-90 transition-all flex items-center gap-2"
          >
            Read the Docs
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button
            type="button"
            className="px-8 py-3.5 rounded-md font-headline font-bold text-lg border border-outline-variant/30 hover:bg-surface-container transition-all flex items-center gap-2"
          >
            View on GitHub
            <span className="material-symbols-outlined">star</span>
          </button>
        </div>
      </div>
    </section>
  );
}
