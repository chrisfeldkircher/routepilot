import { Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { normalizePath } from '@routepilot/engine';
import type { TourNavigationAdapter } from '@routepilot/engine';
import { GuidedTourService } from './guided-tour.service';

/**
 * Bridges the Angular Router to the guided tour engine.
 *
 * Inject this service (or provide it) in the root of your app so the tour
 * engine can navigate via Angular's router and track the current path.
 *
 * Usage:
 * ```ts
 * // app.config.ts or root module
 * providers: [TourRouterAdapterService]
 *
 * // app.component.ts
 * constructor(private _adapter: TourRouterAdapterService) {}
 * ```
 *
 * The adapter auto-registers itself with the GuidedTourService on construction.
 */
@Injectable({ providedIn: 'root' })
export class TourRouterAdapterService implements TourNavigationAdapter, OnDestroy {
  private sub: Subscription;

  constructor(
    private router: Router,
    private tour: GuidedTourService,
  ) {
    this.tour.setNavigationAdapter(this);
    this.tour.setLocation(normalizePath(this.router.url.split('?')[0]));

    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.tour.setLocation(normalizePath(e.urlAfterRedirects.split('?')[0]));
      });
  }

  getPath(): string {
    return normalizePath(this.router.url.split('?')[0]);
  }

  async navigate(path: string, options?: { replace?: boolean }): Promise<void> {
    await this.router.navigate([path], {
      replaceUrl: options?.replace ?? false,
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
