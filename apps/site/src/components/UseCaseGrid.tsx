import { useReveal } from '../useReveal';

interface UseCase {
  icon: string;
  iconColorClass: string;
  title: string;
  body: string;
}

const useCases: UseCase[] = [
  {
    icon: 'rocket_launch',
    iconColorClass: 'text-primary',
    title: 'Onboarding',
    body: 'Guide users through complex first-time setup flows with ease.',
  },
  {
    icon: 'tips_and_updates',
    iconColorClass: 'text-tertiary',
    title: 'Contextual Help',
    body: 'Trigger helpful tips based on where the user is in their journey.',
  },
  {
    icon: 'handyman',
    iconColorClass: 'text-error',
    title: 'Error Resolution',
    body: 'Step-by-step recovery flows when something goes wrong.',
  },
  {
    icon: 'auto_stories',
    iconColorClass: 'text-secondary',
    title: 'Interactive Documentation',
    body: 'Turn settings pages and complex UIs into self-documenting tours that demonstrate features live.',
  },
];

export function UseCaseGrid() {
  const [headerRef, headerVisible] = useReveal<HTMLDivElement>();
  const [gridRef, gridVisible] = useReveal<HTMLDivElement>();

  return (
    <section id="use-cases" className="py-24 bg-surface-container-low">
      <div className="max-w-screen-2xl mx-auto px-8">
        <div ref={headerRef} className={`text-center mb-16 reveal reveal-up ${headerVisible ? 'visible' : ''}`}>
          <h2 className="text-4xl font-headline font-bold text-white mb-4">
            Universal Logic Framework
          </h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            One runtime to rule every guided journey across your application ecosystem.
          </p>
        </div>
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((useCase, i) => (
            <div
              key={useCase.title}
              className={`p-10 bg-surface-container rounded-2xl flex flex-col items-center text-center reveal reveal-up ${gridVisible ? 'visible' : ''}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <span
                className={`material-symbols-outlined text-4xl mb-6 ${useCase.iconColorClass}`}
              >
                {useCase.icon}
              </span>
              <h5 className="text-lg font-headline font-bold text-white mb-2">{useCase.title}</h5>
              <p className="text-sm text-on-surface-variant">{useCase.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
