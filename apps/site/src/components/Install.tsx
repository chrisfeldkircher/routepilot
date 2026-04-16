import { useState } from 'react';

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

const PACKAGE_NAME = '@routepilot/core';

const commands: Record<PackageManager, string> = {
  npm: `npm install ${PACKAGE_NAME}`,
  yarn: `yarn add ${PACKAGE_NAME}`,
  pnpm: `pnpm add ${PACKAGE_NAME}`,
  bun: `bun add ${PACKAGE_NAME}`,
};

const managers: PackageManager[] = ['npm', 'yarn', 'pnpm', 'bun'];

export function Install() {
  const [active, setActive] = useState<PackageManager>('npm');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commands[active]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable; no-op
    }
  };

  return (
    <section className="py-20 bg-surface">
      <div className="max-w-3xl mx-auto px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-mono tracking-widest uppercase text-tertiary mb-4">
            Get started
          </span>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-white leading-tight">
            One command to install.
          </h2>
        </div>

        <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/20 shadow-2xl">
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
                        ? 'relative px-5 py-3 text-sm font-headline font-bold text-white transition-colors'
                        : 'relative px-5 py-3 text-sm font-headline font-medium text-on-surface-variant hover:text-white transition-colors'
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

          <div className="px-6 py-5 font-mono text-sm overflow-x-auto">
            <code className="text-slate-300 whitespace-nowrap">
              <span className="text-primary select-none mr-3">$</span>
              <span className="text-tertiary">{active}</span>
              {' '}
              <span className="text-secondary">
                {active === 'npm' ? 'install' : 'add'}
              </span>
              {' '}
              <span className="text-primary-dim">{PACKAGE_NAME}</span>
            </code>
          </div>
        </div>
      </div>
    </section>
  );
}
