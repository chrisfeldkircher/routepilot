import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="site-footer-brand">
          <a routerLink="/" class="site-footer-logo-link">
            <img src="logo.svg" alt="routePilot" class="site-footer-logo" />
            routePilot
          </a>
          <p class="site-footer-copy">
            &copy; 2026 routePilot. Open-source under MIT License.
          </p>
        </div>
        <div class="site-footer-links">
          <a
            class="site-footer-link"
            href="https://routepilot.dev/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
          <a
            class="site-footer-link"
            href="https://github.com/chrisfeldkircher/routepilot"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
