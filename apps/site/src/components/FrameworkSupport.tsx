import { Link } from 'react-router-dom';
import { useReveal } from '../useReveal';

interface Framework {
  id?: 'react' | 'angular';
  name: string;
  logo: React.ReactNode;
  supported: boolean;
  docsHash?: string;
}

const ReactLogo = () => (
  <svg viewBox="-11.5 -10.232 23 20.463" className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor">
    <circle r="2.05" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);

const VueLogo = () => (
  <svg viewBox="0 0 261.76 226.33" className="w-8 h-8 sm:w-10 sm:h-10">
    <path d="M161.096.001l-30.224 52.35L100.647.001H0l130.877 226.33L261.76.001z" fill="currentColor" opacity="0.5" />
    <path d="M161.096.001l-30.224 52.35L100.647.001H52.346l78.526 136.01L209.398.001z" fill="currentColor" />
  </svg>
);

const SvelteLogo = () => (
  <svg viewBox="0 0 98.1 118" className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor">
    <path d="M91.8 15.6C80.9-.1 59.2-4.7 43.6 5.2L16.1 22.8C8.6 27.5 3.4 35.2 1.9 43.9c-1.3 7.3-.2 14.8 3.3 21.3-2.4 3.6-4 7.6-4.7 11.8-1.6 8.9.5 18.1 5.7 25.4 11 15.7 32.6 20.3 48.2 10.4l27.5-17.6c7.5-4.7 12.7-12.4 14.2-21.1 1.3-7.3.2-14.8-3.3-21.3 2.4-3.6 4-7.6 4.7-11.8 1.7-9-.4-18.2-5.7-25.4" opacity="0.5" />
    <path d="M45.4 108.9c-8.7 2.3-18.2-.4-24.4-7C17 97 15.5 90.5 16.7 84.4l.5-2.5 1.1-2.7 1.9 1.2c3.8 2.5 8 4.3 12.4 5.4l1.2.3-.1 1.2c-.1 2.1.6 4.2 2.1 5.8 2.4 2.7 6.1 3.6 9.5 2.5.7-.2 1.4-.6 2-1l27.5-17.6c2.1-1.3 3.5-3.4 4-5.8.5-2.4 0-4.9-1.4-6.9-2.4-2.7-6.1-3.6-9.5-2.5-.7.2-1.4.6-2 1L56 70.4c-2.1 1.3-4.4 2.2-6.8 2.7-8.7 2.3-18.2-.4-24.4-7-4-4.9-5.5-11.4-4.3-17.5 1.2-6.1 5-11.4 10.5-14.5l27.5-17.6c2.1-1.3 4.4-2.2 6.8-2.7 8.7-2.3 18.2.4 24.4 7 4 4.9 5.5 11.4 4.3 17.5l-.5 2.5-1.1 2.7-1.9-1.2c-3.8-2.5-8-4.3-12.4-5.4l-1.2-.3.1-1.2c.1-2.1-.6-4.2-2.1-5.8-2.4-2.7-6.1-3.6-9.5-2.5-.7.2-1.4.6-2 1L36 46.2c-2.1 1.3-3.5 3.4-4 5.8-.5 2.4 0 4.9 1.4 6.9 2.4 2.7 6.1 3.6 9.5 2.5.7-.2 1.4-.6 2-1l10.8-6.9c2.1-1.3 4.4-2.2 6.8-2.7 8.7-2.3 18.2.4 24.4 7 4 4.9 5.5 11.4 4.3 17.5-1.2 6.1-5 11.4-10.5 14.5L53.2 107.4c-2.1 1.3-4.4 2.2-6.8 2.7-.4.1-.7.1-1 .1v-.3z" />
  </svg>
);

const AngularLogo = () => (
  <svg viewBox="0 0 250 250" className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor">
    <path d="M125 30L31.9 63.2l14.2 123.1L125 230l78.9-43.7 14.2-123.1z" opacity="0.5" />
    <path d="M125 30v22.2-.1V230l78.9-43.7 14.2-123.1L125 30z" opacity="0.7" />
    <path d="M125 52.1L66.8 182.6h21.7l11.7-29.2h49.4l11.7 29.2H183L125 52.1zm17 83.3h-34l17-40.9 17 40.9z" fill="white" />
  </svg>
);

const frameworks: Framework[] = [
  { id: 'react', name: 'React', logo: <ReactLogo />, supported: true, docsHash: 'getting-started' },
  { name: 'Vue', logo: <VueLogo />, supported: false },
  { name: 'Svelte', logo: <SvelteLogo />, supported: false },
  { id: 'angular', name: 'Angular', logo: <AngularLogo />, supported: true, docsHash: 'getting-started' },
];

export function FrameworkSupport() {
  const [ref, visible] = useReveal<HTMLDivElement>();

  return (
    <section id="stack" className="py-16 bg-surface">
      <div ref={ref} className="max-w-screen-2xl mx-auto px-4 sm:px-8 text-center">
        <h3 className={`text-on-surface-variant uppercase tracking-widest text-xs font-bold mb-10 reveal reveal-up ${visible ? 'visible' : ''}`}>
          Works with your stack
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-12 opacity-80">
          {frameworks.map((fw, i) =>
            fw.supported ? (
              <Link
                key={fw.name}
                to={{
                  pathname: '/docs',
                  search: fw.id ? `?framework=${fw.id}` : '',
                  hash: fw.docsHash ? `#${fw.docsHash}` : '',
                }}
                className={`flex flex-col items-center gap-2 group reveal reveal-scale ${visible ? 'visible' : ''}`}
                style={{ transitionDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary border border-primary/40 shadow-lg shadow-primary/10 group-hover:border-primary/70 group-hover:shadow-primary/20 transition-all">
                  {fw.logo}
                </div>
                <span className="text-xs font-headline font-bold text-primary group-hover:underline">{fw.name}</span>
              </Link>
            ) : (
              <div
                key={fw.name}
                className={`flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-not-allowed relative reveal reveal-scale ${visible ? 'visible' : ''}`}
                style={{ transitionDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-surface-container flex items-center justify-center text-slate-500 border border-outline-variant/20">
                  {fw.logo}
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
