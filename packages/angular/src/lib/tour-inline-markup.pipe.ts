import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Parses inline markup in plain strings:
 *   ==text==      →  shimmer text
 *   ==|text|==    →  pill badge
 *   ==|~text~|==  →  shimmer pill (combined)
 *
 * If the input is not a string or contains no markers it is returned as-is.
 *
 * Usage: `{{ stepBody | tourInlineMarkup }}`
 * Bind with `[innerHTML]="stepBody | tourInlineMarkup"`
 */
@Pipe({ name: 'tourInlineMarkup', standalone: true })
export class TourInlineMarkupPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: unknown): string | SafeHtml {
    if (typeof value !== 'string') return value as string;

    const parts = value.split(/(==\|~.+?~\|==|==\|.+?\|==|==.+?==)/g);
    if (parts.length === 1) return value;

    const html = parts
      .map((part) => {
        if (part.startsWith('==|~') && part.endsWith('~|==')) {
          return `<span class="tour-text-pill tour-text-highlight">${escapeHtml(part.slice(4, -4))}</span>`;
        }
        if (part.startsWith('==|') && part.endsWith('|==')) {
          return `<span class="tour-text-pill">${escapeHtml(part.slice(3, -3))}</span>`;
        }
        if (part.startsWith('==') && part.endsWith('==')) {
          return `<span class="tour-text-highlight">${escapeHtml(part.slice(2, -2))}</span>`;
        }
        return escapeHtml(part);
      })
      .join('');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
