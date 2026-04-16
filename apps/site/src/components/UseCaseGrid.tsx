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
    icon: 'auto_awesome',
    iconColorClass: 'text-secondary',
    title: 'Feature Discovery',
    body: 'Introduce new features without cluttering your main UI.',
  },
];

export function UseCaseGrid() {
  return (
    <section className="py-24 bg-surface-container-low">
      <div className="max-w-screen-2xl mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-headline font-bold text-white mb-4">
            Universal Logic Framework
          </h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            One runtime to rule every guided journey across your application ecosystem.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="p-10 bg-surface-container rounded-2xl flex flex-col items-center text-center"
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
