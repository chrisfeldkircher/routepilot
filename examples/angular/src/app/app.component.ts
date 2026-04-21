import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  GuidedTourOverlayComponent,
  GuidedTourService,
  TourRouterAdapterService,
} from '@routepilot/angular';
import {
  TourAssistantButtonComponent,
  TourAssistantPromptComponent,
} from '@routepilot/assistant-angular';
import { HeaderComponent } from './components/header.component';
import { NavComponent } from './components/nav.component';
import { FooterComponent } from './components/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    GuidedTourOverlayComponent,
    TourAssistantButtonComponent,
    TourAssistantPromptComponent,
    HeaderComponent,
    NavComponent,
    FooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="site-shell">
      <app-nav></app-nav>
      <app-header *ngIf="showHeader()"></app-header>
      <main class="site-main">
        <router-outlet />
      </main>
      <app-footer></app-footer>
    </div>
    <rp-guided-tour-overlay>
      <rp-tour-assistant-prompt rpTooltipFooter></rp-tour-assistant-prompt>
      <rp-tour-assistant-button rpTooltipFooterNav></rp-tour-assistant-button>
    </rp-guided-tour-overlay>
  `,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly tour = inject(GuidedTourService);
  private readonly pathname = signal<string>(typeof location !== 'undefined' ? location.pathname : '/');

  readonly showHeader = computed(() => this.pathname() !== '/');

  constructor() {
    inject(TourRouterAdapterService);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.pathname.set(e.urlAfterRedirects || e.url));

    let prevStatus = this.tour.state.status;
    this.tour.state$.subscribe((snapshot) => {
      const wasActive = prevStatus === 'running' || prevStatus === 'preparing';
      const isTerminal =
        snapshot.status === 'idle' ||
        snapshot.status === 'completed' ||
        snapshot.status === 'error';

      if (wasActive && isTerminal) {
        void this.router.navigateByUrl('/');
      }

      prevStatus = snapshot.status;
    });
  }
}
