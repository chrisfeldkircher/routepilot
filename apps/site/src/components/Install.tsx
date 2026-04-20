import { useState } from 'react';
import { useReveal } from '../useReveal';

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';
type FrameworkOption = 'react' | 'angular';

const packages: Record<FrameworkOption, string> = {
  react: '@routepilot/engine @routepilot/react',
  angular: '@routepilot/engine @routepilot/angular',
};

function getCommand(pm: PackageManager, fw: FrameworkOption) {
  const verb = pm === 'npm' ? 'install' : 'add';
  return `${pm} ${verb} ${packages[fw]}`;
}

const managers: PackageManager[] = ['npm', 'yarn', 'pnpm', 'bun'];

const ReactIcon = () => (
  <svg viewBox="-11.5 -10.232 23 20.463" className="w-3.5 h-3.5" fill="currentColor">
    <circle r="2.05" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);

const AngularIcon = () => (
  <svg viewBox="0 0 250 250" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M125 30L31.9 63.2l14.2 123.1L125 230l78.9-43.7 14.2-123.1z" opacity="0.5" />
    <path d="M125 30v22.2-.1V230l78.9-43.7 14.2-123.1L125 30z" opacity="0.7" />
    <path d="M125 52.1L66.8 182.6h21.7l11.7-29.2h49.4l11.7 29.2H183L125 52.1zm17 83.3h-34l17-40.9 17 40.9z" fill="white" />
  </svg>
);

export function Install() {
  const [active, setActive] = useState<PackageManager>('npm');
  const [framework, setFramework] = useState<FrameworkOption>('react');
  const [copied, setCopied] = useState(false);
  const [ref, visible] = useReveal<HTMLDivElement>();

  const command = getCommand(active, framework);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <section id="install" className="py-20 bg-surface">
      <div ref={ref} className="max-w-3xl mx-auto px-4 sm:px-8">
        <div className={`text-center mb-10 reveal reveal-up ${visible ? 'visible' : ''}`}>
          <span className="inline-block text-xs font-mono tracking-widest uppercase text-tertiary mb-4">
            Get started
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-white leading-tight">
            One command to install.
          </h2>
        </div>
        <div className={`flex justify-center gap-2 mb-4 reveal reveal-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: '0.08s' }}>
          {(['react', 'angular'] as const).map((fw) => {
            const isActive = fw === framework;
            return (
              <button
                key={fw}
                type="button"
                onClick={() => setFramework(fw)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${
                  isActive
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant/10 hover:text-white hover:border-outline-variant/30'
                }`}
              >
                {fw === 'react' ? <ReactIcon /> : <AngularIcon />}
                {fw === 'react' ? 'React' : 'Angular'}
              </button>
            );
          })}
        </div>

        <div className={`bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/20 shadow-2xl reveal reveal-scale ${visible ? 'visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
          <div className="flex items-center justify-between bg-surface-container-high border-b border-outline-variant/10">
            <div role="tablist" aria-label="Package manager" className="flex">
              {managers.map((pm) => {
                const isActive = pm === active;
                return (
                  <button
                    key={pm}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(pm)}
                    className={
                      isActive
                        ? 'relative px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-headline font-bold text-white transition-colors'
                        : 'relative px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-headline font-medium text-on-surface-variant hover:text-white transition-colors'
                    }
                  >
                    {pm}
                    {isActive && (
                      <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-gradient-to-r from-primary to-primary-dim rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy install command"
              className="mr-3 my-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-5 font-mono text-xs sm:text-sm overflow-x-auto">
            <code className="text-slate-300 whitespace-nowrap">
              <span className="text-primary select-none mr-3">$</span>
              <span className="text-tertiary">{active}</span>
              {' '}
              <span className="text-secondary">
                {active === 'npm' ? 'install' : 'add'}
              </span>
              {' '}
              <span className="text-primary-dim">{packages[framework]}</span>
            </code>
          </div>
        </div>
      </div>
    </section>
  );
}
