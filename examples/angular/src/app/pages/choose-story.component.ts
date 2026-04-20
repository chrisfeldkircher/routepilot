import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GuidedTourService } from '@routepilot/angular';

interface Scenario {
  id: string;
  tourId: string;
  icon: string;
  label: string;
  startRoute: string;
  description: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'standard-onboarding',
    tourId: 'onboarding',
    icon: 'person_add',
    label: 'Standard Onboarding',
    startRoute: '/dashboard',
    description:
      'A first-run tour that walks a new user through their operations console, showing how preparations can inject fake data and tear it down cleanly.',
  },
  {
    id: 'frequently-asked-questions',
    tourId: 'pickup-faq',
    icon: 'support_agent',
    label: 'Frequently Asked Questions',
    startRoute: '/pickup',
    description:
      'Contextual answers wired straight into the product. Each FAQ entry is a tour that ends exactly where the user was trying to get.',
  },
  {
    id: 'error-recovery',
    tourId: 'error-recovery',
    icon: 'running_with_errors',
    label: 'Error Recovery',
    startRoute: '/import',
    description:
      'A CSV import hit three validation errors. Instead of dumping a log, the product walks the user through each fix, inside the app.',
  },
  {
    id: 'interactive-docs',
    tourId: 'interactive-docs',
    icon: 'auto_stories',
    label: 'Interactive Documentation',
    startRoute: '/settings',
    description:
      'A settings page that documents itself. Every toggle is demonstrated live via a step-scoped preparation that reverts cleanly on exit.',
  },
];

@Component({
  selector: 'app-choose-story',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="choose-story">
      <div class="choose-story-container">
        <div class="choose-story-grid">
          <div class="choose-story-left">
            <h2 class="choose-story-title">Choose Your Story</h2>
            <p class="choose-story-subtitle">
              Select a pattern to see how RoutePilot handles state transitions, gating,
              and environmental preparation.
            </p>
            <div class="choose-story-scenarios">
              <button
                *ngFor="let scenario of scenarios"
                type="button"
                class="scenario-btn"
                [class.scenario-btn-active]="scenario.id === activeScenarioId()"
                (click)="setActive(scenario.id)"
              >
                <span class="material-symbols-outlined">{{ scenario.icon }}</span>
                <span class="scenario-label">{{ scenario.label }}</span>
              </button>
            </div>
          </div>

          <div class="choose-story-right">
            <div class="mac-window">
              <div class="mac-titlebar">
                <span class="mac-dot mac-dot-red"></span>
                <span class="mac-dot mac-dot-yellow"></span>
                <span class="mac-dot mac-dot-green"></span>
                <span class="mac-runtime">
                  RUNTIME_INSTANCE: {{ runtimeLabel() }}_FLOW_V1
                </span>
              </div>
              <div class="mac-canvas">
                <svg class="mac-bg" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
                  <defs>
                    <radialGradient id="demoGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#a3a6ff" stop-opacity="0.6" />
                      <stop offset="100%" stop-color="#060e20" stop-opacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="800" height="450" fill="url(#demoGlow)" />
                  <path d="M120 220 L260 140 L400 220 L540 140 L680 220" stroke="#a3a6ff" stroke-width="1.5" stroke-dasharray="6 6" />
                  <path d="M260 140 L260 340 M540 140 L540 340" stroke="#c180ff" stroke-width="1" stroke-dasharray="4 4" />
                  <circle cx="120" cy="220" r="10" fill="#a3a6ff" />
                  <rect x="242" y="122" width="36" height="36" rx="4" class="dag-node" />
                  <circle cx="400" cy="220" r="10" fill="#c180ff" />
                  <rect x="522" y="122" width="36" height="36" rx="4" class="dag-node" />
                  <circle cx="680" cy="220" r="10" fill="#a3a6ff" />
                </svg>
                <div class="glass-panel choose-story-panel">
                  <h3 class="panel-title">Live State Visualization</h3>
                  <p class="panel-copy">{{ activeScenario().description }}</p>
                  <button type="button" class="panel-cta" (click)="launch()">
                    <span class="material-symbols-outlined">play_circle</span>
                    Try Live Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .choose-story {
      min-height: calc(100vh - 80px);
      padding: 4rem 1.5rem;
      background: radial-gradient(circle at 20% 10%, rgba(99, 102, 241, 0.18), transparent 45%),
        radial-gradient(circle at 80% 90%, rgba(139, 92, 246, 0.18), transparent 45%),
        #060e20;
      color: #f8fafc;
    }
    .choose-story-container { max-width: 1400px; margin: 0 auto; }
    .choose-story-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
      align-items: flex-start;
    }
    @media (min-width: 900px) {
      .choose-story-grid { grid-template-columns: minmax(280px, 1fr) 2fr; gap: 4rem; }
    }
    .choose-story-title {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 700;
      margin: 0 0 1.25rem;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .choose-story-subtitle {
      font-size: 1rem;
      line-height: 1.6;
      color: rgba(248, 250, 252, 0.72);
      margin: 0 0 2rem;
    }
    .choose-story-scenarios { display: flex; flex-direction: column; gap: 0.5rem; }
    .scenario-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      background: transparent;
      border: 1px solid transparent;
      color: rgba(248, 250, 252, 0.72);
      font-size: 1rem;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: background 0.2s, color 0.2s, border 0.2s;
      width: 100%;
      font-family: inherit;
    }
    .scenario-btn:hover { background: rgba(255, 255, 255, 0.05); color: #f8fafc; }
    .scenario-btn-active {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-left: 4px solid #a3a6ff;
      color: #a3a6ff;
    }
    .scenario-btn .material-symbols-outlined { font-size: 1.5rem; }
    .scenario-label { font-family: inherit; font-weight: 600; }
    .mac-window {
      border-radius: 0.75rem;
      overflow: hidden;
      background: #091328;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }
    .mac-titlebar {
      height: 2.5rem;
      display: flex;
      align-items: center;
      padding: 0 1rem;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
    }
    .mac-dot { width: 0.75rem; height: 0.75rem; border-radius: 9999px; opacity: 0.4; }
    .mac-dot-red { background: #ef4444; }
    .mac-dot-yellow { background: #eab308; }
    .mac-dot-green { background: #22c55e; }
    .mac-runtime {
      margin-left: 1rem;
      font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
      font-size: 0.625rem;
      letter-spacing: 0.2em;
      color: rgba(248, 250, 252, 0.6);
    }
    .mac-canvas {
      position: relative;
      aspect-ratio: 16 / 9;
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #091328;
    }
    .mac-bg { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.1; pointer-events: none; }
    .dag-node { fill: transparent; stroke: #a3a6ff; stroke-width: 1.5; }
    .choose-story-panel {
      position: relative;
      z-index: 10;
      max-width: 28rem;
      padding: 2rem;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      text-align: center;
    }
    .panel-title { font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 0 0 1rem; }
    .panel-copy { font-size: 0.875rem; line-height: 1.6; color: rgba(248, 250, 252, 0.72); margin: 0 0 1.5rem; }
    .panel-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      background: #ffffff;
      color: #060e20;
      font-weight: 700;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      font-family: inherit;
    }
    .panel-cta:hover { background: #a3a6ff; color: #ffffff; }
    .panel-cta .material-symbols-outlined { font-size: 1.25rem; }
  `],
})
export class ChooseStoryComponent {
  private readonly router = inject(Router);
  private readonly tour = inject(GuidedTourService);

  readonly scenarios = SCENARIOS;
  readonly activeScenarioId = signal<string>(SCENARIOS[0].id);

  activeScenario(): Scenario {
    return this.scenarios.find((s) => s.id === this.activeScenarioId()) ?? this.scenarios[0];
  }

  runtimeLabel(): string {
    return this.activeScenarioId().toUpperCase().replace(/-/g, '_');
  }

  setActive(id: string): void {
    this.activeScenarioId.set(id);
  }

  async launch(): Promise<void> {
    const scenario = this.activeScenario();
    await this.router.navigateByUrl(scenario.startRoute);
    setTimeout(() => this.tour.actions.start(scenario.tourId), 0);
  }
}
