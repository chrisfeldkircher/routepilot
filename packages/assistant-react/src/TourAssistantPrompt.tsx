import type { FormEvent, JSX } from 'react';
import { useTourAssistantContext } from './TourAssistantContext';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

export interface TourAssistantPromptProps {
  placeholder?: string;
}

export function TourAssistantPrompt({
  placeholder = 'Ask the tour…',
}: TourAssistantPromptProps = {}): JSX.Element | null {
  const {
    open,
    query,
    results,
    currentTourId,
    loadingAnimation,
    inputRef,
    setQuery,
    submit,
    close,
    jumpTo,
  } =
    useTourAssistantContext();

  if (!open) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <div
      className="tour-assistant"
      role="region"
      aria-label="Tour assistant"
      data-tour="tour-assistant-prompt"
    >
      <form
        className="tour-assistant-form"
        onSubmit={handleSubmit}
        data-tour="tour-assistant-form"
      >
        <span
          className={`tour-assistant-icon tour-assistant-icon--${loadingAnimation}`}
          aria-hidden="true"
        >
          <span className={`tour-loader tour-loader--${loadingAnimation}`} />
        </span>
        <input
          ref={inputRef}
          type="text"
          className="tour-assistant-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-label="Ask the tour assistant"
          data-tour="tour-assistant-input"
        />
        <button
          type="submit"
          className="tour-assistant-send"
          disabled={query.trim().length < 2}
          aria-label="Search"
          data-tour="tour-assistant-send"
        >
          →
        </button>
        <button
          type="button"
          className="tour-assistant-close"
          onClick={close}
          aria-label="Hide assistant"
          data-tour="tour-assistant-close"
        >
          ✕
        </button>
      </form>

      {query.trim().length >= 2 && results.length === 0 && (
        <p className="tour-assistant-empty" data-tour="tour-assistant-empty">
          No matching steps. Try different words.
        </p>
      )}

      {results.length > 0 && (
        <ul
          className="tour-assistant-results"
          role="listbox"
          data-tour="tour-assistant-results"
        >
          {results.map((match) => (
            <li key={`${match.kind ?? 'step'}:${match.tourId}:${match.stepId}:${match.chapter ?? ''}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="tour-assistant-result"
                    onClick={() => jumpTo(match)}
                    data-tour="tour-assistant-result"
                  >
                    <span className="tour-assistant-result-title">{match.title}</span>
                    {match.snippet && (
                      <span className="tour-assistant-result-snippet">
                        {stripTourMarkup(match.snippet)}
                      </span>
                    )}
                    <span className="tour-assistant-result-meta">
                      <span className="tour-assistant-result-tour">
                        {match.tourId === currentTourId ? 'This tour' : match.tourId}
                        {match.kind === 'chapter' && match.stepCount
                          ? ` • ${match.stepCount} steps`
                          : ''}
                      </span>
                      <span className="tour-assistant-result-jump">
                        {match.kind === 'chapter' ? 'Open flow →' : 'Jump →'}
                      </span>
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  {resultTooltip(match.title, match.snippet)}
                </TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function stripTourMarkup(snippet: string): string {
  return snippet.replace(/==\|?~?([^=|~]+)~?\|?==/g, '$1');
}

function resultTooltip(title: string, snippet: string | undefined): string {
  const cleanSnippet = snippet ? stripTourMarkup(snippet).trim() : '';
  return cleanSnippet ? `${title}\n\n${cleanSnippet}` : title;
}

export default TourAssistantPrompt;
