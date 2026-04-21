import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { AssistantMatch } from '@routepilot/assistant';
import { TourAssistantService } from './tour-assistant.service';
import { RpTooltipDirective } from './rp-tooltip.directive';

@Component({
  selector: 'rp-tour-assistant-prompt',
  standalone: true,
  imports: [CommonModule, FormsModule, RpTooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="assistant.open()"
      class="tour-assistant"
      role="region"
      aria-label="Tour assistant"
      data-tour="tour-assistant-prompt"
    >
      <form
        class="tour-assistant-form"
        (submit)="handleSubmit($event)"
        data-tour="tour-assistant-form"
      >
        <span
          class="tour-assistant-icon tour-assistant-icon--{{ assistant.loadingAnimation() }}"
          aria-hidden="true"
        >
          <span class="tour-loader tour-loader--{{ assistant.loadingAnimation() }}"></span>
        </span>
        <input
          #inputEl
          type="text"
          class="tour-assistant-input"
          [placeholder]="placeholder"
          [ngModel]="assistant.query()"
          (ngModelChange)="assistant.setQuery($event)"
          name="tour-assistant-query"
          autocomplete="off"
          spellcheck="false"
          aria-label="Ask the tour assistant"
          data-tour="tour-assistant-input"
        />
        <button
          type="submit"
          class="tour-assistant-send"
          [disabled]="assistant.query().trim().length < 2"
          aria-label="Search"
          data-tour="tour-assistant-send"
        >
          &rarr;
        </button>
        <button
          type="button"
          class="tour-assistant-close"
          (click)="assistant.close()"
          aria-label="Hide assistant"
          data-tour="tour-assistant-close"
        >
          &#x2715;
        </button>
      </form>

      <p
        *ngIf="
          assistant.query().trim().length >= 2 && assistant.results().length === 0
        "
        class="tour-assistant-empty"
        data-tour="tour-assistant-empty"
      >
        No matching steps. Try different words.
      </p>

      <ul
        *ngIf="assistant.results().length > 0"
        class="tour-assistant-results"
        role="listbox"
        data-tour="tour-assistant-results"
      >
        <li
          *ngFor="let match of assistant.results(); trackBy: trackByMatch"
        >
          <button
            type="button"
            class="tour-assistant-result"
            (click)="assistant.jumpTo(match)"
            [rpTooltip]="resultTooltip(match)"
            data-tour="tour-assistant-result"
          >
            <span class="tour-assistant-result-title">{{ match.title }}</span>
            <span
              *ngIf="match.snippet"
              class="tour-assistant-result-snippet"
            >
              {{ stripTourMarkup(match.snippet) }}
            </span>
            <span class="tour-assistant-result-meta">
              <span class="tour-assistant-result-tour">
                {{
                  match.tourId === assistant.currentTourId()
                    ? 'This tour'
                    : match.tourId
                }}{{
                  match.kind === 'chapter' && match.stepCount
                    ? ' • ' + match.stepCount + ' steps'
                    : ''
                }}
              </span>
              <span class="tour-assistant-result-jump">
                {{ match.kind === 'chapter' ? 'Open flow →' : 'Jump →' }}
              </span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  `,
})
export class TourAssistantPromptComponent {
  @Input() placeholder = 'Ask the tour…';

  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;

  constructor(readonly assistant: TourAssistantService) {
    effect(() => {
      if (this.assistant.open()) {
        queueMicrotask(() => this.inputEl?.nativeElement.focus());
      }
    });
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.assistant.submit();
  }

  trackByMatch = (_index: number, match: AssistantMatch): string =>
    `${match.kind ?? 'step'}:${match.tourId}:${match.stepId}:${match.chapter ?? ''}`;

  stripTourMarkup(snippet: string): string {
    return snippet.replace(/==\|?~?([^=|~]+)~?\|?==/g, '$1');
  }

  resultTooltip(match: AssistantMatch): string {
    const cleanSnippet = match.snippet ? this.stripTourMarkup(match.snippet).trim() : '';
    return cleanSnippet ? `${match.title}\n\n${cleanSnippet}` : match.title;
  }
}
