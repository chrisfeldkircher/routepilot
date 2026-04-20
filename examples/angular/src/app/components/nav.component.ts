import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="site-nav"
      [class.site-nav-scrolled]="scrolled()"
    >
      <div class="site-nav-inner">
        <div class="site-nav-left">
          <a routerLink="/" class="site-nav-brand" data-tour-exit>
            <img src="logo.svg" alt="routePilot" class="site-nav-logo" />
            routePilot
          </a>
          <div class="site-nav-links">
            <a
              class="site-nav-link"
              href="https://routepilot.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
          </div>
        </div>
        <div class="site-nav-right">
          <a
            *ngIf="!isLanding()"
            routerLink="/"
            class="site-nav-cta"
            data-tour-exit
          >
            Home
          </a>
        </div>
      </div>
    </nav>
  `,
})
export class NavComponent {
  private readonly pathname = signal<string>(
    typeof location !== 'undefined' ? location.pathname : '/',
  );
  private readonly scrollY = signal(0);

  readonly scrolled = computed(() => this.scrollY() > 20);
  readonly isLanding = computed(() => this.pathname() === '/');

  constructor(router: Router) {
    router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.pathname.set(e.urlAfterRedirects || e.url));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrollY.set(typeof window !== 'undefined' ? window.scrollY : 0);
  }
}
