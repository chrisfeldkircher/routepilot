interface Pillar {
  icon: string;
  iconColorClass: string;
  iconBgClass: string;
  title: string;
  body: string;
}

const pillars: Pillar[] = [
  {
    icon: 'account_tree',
    iconColorClass: 'text-primary',
    iconBgClass: 'bg-primary-container/10',
    title: 'State Machine Core',
    body: 'Validated Directed Acyclic Graphs (DAGs) ensure your product stories never hit a dead end. Built-in branching logic handles every user edge-case.',
  },
  {
    icon: 'shield',
    iconColorClass: 'text-tertiary',
    iconBgClass: 'bg-tertiary-container/10',
    title: 'Explicit Interception',
    body: 'Gating clicks, guarding routes, and event bridging. Capture native UI events and map them directly to runtime state transitions.',
  },
  {
    icon: 'cleaning_services',
    iconColorClass: 'text-secondary',
    iconBgClass: 'bg-secondary-container/10',
    title: 'Smart Preparations',
    body: 'Scoped setup and cleanup logic for idempotent demo states. Ensure your users always start in the perfect context, every single time.',
  },
];

export function KeyPillars() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-screen-2xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="p-8 rounded-2xl bg-surface-container hover:translate-y-[-4px] transition-transform duration-300"
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${pillar.iconBgClass} ${pillar.iconColorClass}`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {pillar.icon}
                </span>
              </div>
              <h4 className="text-xl font-headline font-bold text-white mb-4">{pillar.title}</h4>
              <p className="text-on-surface-variant leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
