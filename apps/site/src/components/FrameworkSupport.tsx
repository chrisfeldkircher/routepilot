import { useReveal } from '../useReveal';

interface Framework {
  name: string;
  icon: string;
  supported: boolean;
}

const frameworks: Framework[] = [
  { name: 'React', icon: 'polymer', supported: true },
  { name: 'Vue', icon: 'token', supported: false },
  { name: 'Svelte', icon: 'hexagon', supported: false },
  { name: 'Angular', icon: 'category', supported: false },
];

export function FrameworkSupport() {
  const [ref, visible] = useReveal<HTMLDivElement>();

  return (
    <section id="stack" className="py-16 bg-surface">
      <div ref={ref} className="max-w-screen-2xl mx-auto px-8 text-center">
        <h3 className={`text-on-surface-variant uppercase tracking-widest text-xs font-bold mb-10 reveal reveal-up ${visible ? 'visible' : ''}`}>
          Works with your stack
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-80">
          {frameworks.map((fw, i) =>
            fw.supported ? (
              <div
                key={fw.name}
                className={`flex flex-col items-center gap-2 group cursor-pointer reveal reveal-scale ${visible ? 'visible' : ''}`}
                style={{ transitionDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary border border-primary/40 shadow-lg shadow-primary/10">
                  <span className="material-symbols-outlined text-3xl">{fw.icon}</span>
                </div>
                <span className="text-xs font-headline font-bold text-primary">{fw.name}</span>
              </div>
            ) : (
              <div
                key={fw.name}
                className={`flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-not-allowed relative reveal reveal-scale ${visible ? 'visible' : ''}`}
                style={{ transitionDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-slate-500 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-3xl">{fw.icon}</span>
                </div>
                <span className="text-xs font-headline font-bold">{fw.name}</span>
                <span className="absolute -top-2 -right-4 bg-tertiary-container text-on-tertiary-container text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Soon
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
