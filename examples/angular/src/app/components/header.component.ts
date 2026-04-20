import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';

type HeaderVariant = 'taskflow' | 'parcel' | 'databridge' | 'pulse';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header [class]="headerClass()">
      <ng-container [ngSwitch]="variant()">
        <ng-container *ngSwitchCase="'parcel'">
          <div class="brand-lockup brand-lockup-parcel" data-tour="app-logo">
            <span class="brand-mark brand-mark-parcel" aria-hidden="true">PR</span>
            <div class="brand-copy">
              <h1>ParcelRelay</h1>
              <span>Same-day courier · demo</span>
            </div>
          </div>
          <nav>
            <a routerLink="/pickup" routerLinkActive="nav-link-active" class="nav-link">Schedule</a>
            <span class="nav-link" role="button" tabindex="0">Track</span>
            <span class="nav-link" role="button" tabindex="0">Rates</span>
            <span class="nav-link nav-notification-pill" role="button" tabindex="0">
              Help
              <span class="nav-notification-count">4</span>
            </span>
          </nav>
        </ng-container>

        <ng-container *ngSwitchCase="'databridge'">
          <div class="brand-lockup brand-lockup-databridge" data-tour="app-logo">
            <span class="brand-mark brand-mark-databridge" aria-hidden="true">DB</span>
            <div class="brand-copy">
              <h1>DataBridge</h1>
              <span>Import pipeline · demo</span>
            </div>
          </div>
          <nav>
            <a routerLink="/import" routerLinkActive="nav-link-active" class="nav-link">Imports</a>
            <span class="nav-link" role="button" tabindex="0">Schemas</span>
            <span class="nav-link" role="button" tabindex="0">Logs</span>
            <span class="nav-link" role="button" tabindex="0">Settings</span>
          </nav>
        </ng-container>

        <ng-container *ngSwitchCase="'pulse'">
          <div class="brand-lockup brand-lockup-pulse" data-tour="app-logo">
            <span class="brand-mark brand-mark-pulse" aria-hidden="true">PU</span>
            <div class="brand-copy">
              <h1>Pulse</h1>
              <span>Project tracker · demo</span>
            </div>
          </div>
          <nav>
            <span class="nav-link" role="button" tabindex="0">Board</span>
            <span class="nav-link" role="button" tabindex="0">Backlog</span>
            <span class="nav-link" role="button" tabindex="0">Sprints</span>
            <a routerLink="/settings" routerLinkActive="nav-link-active" class="nav-link">Settings</a>
          </nav>
        </ng-container>

        <ng-container *ngSwitchDefault>
          <div class="brand-lockup" data-tour="app-logo">
            <span class="brand-mark" aria-hidden="true">TF</span>
            <div class="brand-copy">
              <h1>TaskFlow</h1>
              <span>Operations console</span>
            </div>
          </div>
          <nav>
            <a routerLink="/dashboard" routerLinkActive="nav-link-active" class="nav-link" data-tour="nav-dashboard">Dashboard</a>
            <a routerLink="/tasks" routerLinkActive="nav-link-active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link" data-tour="nav-tasks">Tasks</a>
            <a routerLink="/tasks/new" routerLinkActive="nav-link-active" class="nav-link" data-tour="nav-create">+ New Task</a>
            <span class="nav-link nav-notification-pill" data-tour="nav-notifications" role="button" tabindex="0">
              Notifications
              <span class="nav-notification-count">3</span>
            </span>
          </nav>
        </ng-container>
      </ng-container>
    </header>
  `,
})
export class HeaderComponent {
  private readonly pathname = signal<string>(typeof location !== 'undefined' ? location.pathname : '/');

  readonly variant = computed<HeaderVariant>(() => {
    const p = this.pathname();
    if (p.startsWith('/settings')) return 'pulse';
    if (p.startsWith('/import')) return 'databridge';
    if (p.startsWith('/pickup')) return 'parcel';
    return 'taskflow';
  });

  readonly headerClass = computed(() => {
    switch (this.variant()) {
      case 'pulse': return 'app-header app-header-pulse';
      case 'databridge': return 'app-header app-header-databridge';
      case 'parcel': return 'app-header app-header-parcel';
      default: return 'app-header';
    }
  });

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.pathname.set(e.urlAfterRedirects || e.url));
  }
}
