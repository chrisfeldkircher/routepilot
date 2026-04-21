import { useReveal } from '../useReveal';

interface Match {
  title: string;
  snippet: string;
  tour: string;
  isCurrent?: boolean;
}

const matches: Match[] = [
  {
    title: 'File over the size limit',
    snippet: 'Our importer caps uploads at 10 MB per file. Split the CSV or gzip it first — the endpoint auto-decompresses .csv.gz.',
    tour: 'This tour',
    isCurrent: true,
  },
  {
    title: 'Upload progress bar is stuck',
    snippet: 'Tus-resumable uploads pick up from the last acknowledged chunk. Click Retry in the upload panel.',
    tour: 'This tour',
    isCurrent: true,
  },
  {
    title: 'Garbled characters in the preview',
    snippet: 'Re-save the CSV as UTF-8. On Excel: Save As → CSV UTF-8. On Numbers: Export → CSV → Advanced → UTF-8.',
    tour: 'faq',
  },
];

const bullets: { icon: string; title: string; body: string }[] = [
  {
    icon: 'bolt',
    title: 'BM25 ranking in the browser',
    body: 'k1 = 1.5, b = 0.75 over a tokenized, stemmed token stream. Zero network calls, no embeddings, no API key.',
  },
  {
    icon: 'cloud_off',
    title: 'Works offline. Under 20 KB gzipped.',
    body: 'The index is built once from the tour definitions you already ship. Runs next to the engine, not behind a service.',
  },
  {
    icon: 'tune',
    title: 'Tunable where it matters',
    body: 'Field weights, synonyms, per-step keyword/alias bags, errorPatterns regexes, scope rules, and an optional async reranker hook.',
  },
];

export function AskTheTour() {
  const [leftRef, leftVisible] = useReveal<HTMLDivElement>();
  const [rightRef, rightVisible] = useReveal<HTMLDivElement>();

  return (
    <section id="ask-the-tour" className="py-24 bg-surface border-y border-outline-variant/10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[40rem] h-[40rem] bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-tertiary rounded-full blur-3xl" />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 relative">
        <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 lg:gap-16 items-center">
          <div ref={leftRef} className={`lg:w-1/2 reveal reveal-left ${leftVisible ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="text-[10px] font-mono tracking-widest uppercase text-tertiary">
                New · @routepilot/assistant
              </span>
              <span className="text-[10px] font-headline font-bold bg-tertiary/15 text-tertiary px-2 py-0.5 rounded border border-tertiary/25">
                BETA
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-headline font-bold text-white mb-6 leading-tight">
              Ask the Tour.
              <br />
              <span className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
                Skip the walkthrough.
              </span>
            </h2>
            <p className="text-on-surface-variant text-base sm:text-lg mb-8 leading-relaxed">
              When a tour grows past five or six steps, <em>Next → Next → Next</em> stops working.
              Users who already know what is wrong do not want a walkthrough — they want the
              <em> one step</em> that answers them.
            </p>
            <p className="text-on-surface-variant text-base sm:text-lg mb-8 leading-relaxed">
              Drop a search bar into the tooltip footer. Users type a natural-language question,
              BM25 ranks your own tour steps, clicking a result <code className="text-primary font-mono">goTo()</code>s it.
              No LLM. No backend.
            </p>
            <ul className="space-y-5">
              {bullets.map((b) => (
                <li key={b.title} className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-primary-container/10 text-primary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {b.icon}
                    </span>
                  </span>
                  <div>
                    <p className="font-headline font-bold text-white mb-1">{b.title}</p>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{b.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div
            ref={rightRef}
            className={`lg:w-1/2 w-full reveal reveal-scale ${rightVisible ? 'visible' : ''}`}
            style={{ transitionDelay: '0.15s' }}
          >
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/20 shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 bg-surface-container-high border-b border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-error/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant tracking-widest">
                  TOOLTIP_FOOTER
                </span>
              </div>

              <div className="p-5 sm:p-6 bg-[#0a1328]">
                <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-surface-container/60 border border-outline-variant/10">
                  <span className="w-7 h-7 rounded-md bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      smart_toy
                    </span>
                  </span>
                  <div className="flex-1 text-sm font-mono text-primary">
                    my file is too big
                    <span className="inline-block w-1.5 h-4 bg-primary ml-1 align-middle animate-pulse" />
                  </div>
                  <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">
                    ↵ 0.8 ms
                  </span>
                </div>

                <div className="space-y-2">
                  {matches.map((match, i) => (
                    <div
                      key={match.title}
                      className={`p-3 rounded-lg border transition-colors ${
                        i === 0
                          ? 'bg-primary/10 border-primary/40'
                          : 'bg-surface-container/40 border-outline-variant/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <span className="font-headline font-bold text-white text-sm">
                          {match.title}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest flex-shrink-0 mt-0.5">
                          Jump →
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mb-1.5">
                        {match.snippet}
                      </p>
                      <span
                        className={`text-[10px] font-mono uppercase tracking-widest ${
                          match.isCurrent ? 'text-primary' : 'text-tertiary'
                        }`}
                      >
                        {match.tour}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 py-3 bg-surface-container-high border-t border-outline-variant/10 flex items-center justify-between">
                <span className="text-[10px] font-mono text-on-surface-variant">
                  BM25 · k1=1.5 · b=0.75 · 11 steps indexed
                </span>
                <span className="text-[10px] font-mono text-primary-dim">
                  scope: current-tour-only
                </span>
              </div>
            </div>

            <p className="mt-6 text-xs text-on-surface-variant text-center font-mono">
              Wire it in two lines: <code className="text-primary">TourAssistantButton</code>{' '}
              +{' '}
              <code className="text-primary">TourAssistantPrompt</code> into the tooltip footer slots.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
