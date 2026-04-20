import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuidedTourService } from '@routepilot/angular';
import {
  settingsState,
  getPermissionsForRole,
  type SettingsStateShape,
  type EmailDigest,
  type IssueTransition,
  type ProjectRole,
} from '../state/settingsState';
import { interactiveDocsTour } from '../tours/interactive-docs.tour';

const SETTINGS_EVENT = 'settings-tour:state-changed';

const WEBHOOK_EVENT_OPTIONS = [
  'issue.created',
  'issue.updated',
  'issue.resolved',
  'issue.deleted',
  'comment.added',
  'sprint.started',
  'sprint.completed',
  'deployment.succeeded',
  'deployment.failed',
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-page">
      <header class="settings-hero" data-tour="settings-header">
        <div>
          <span class="settings-eyebrow">Pulse · ACME-ENG</span>
          <h2>Project settings</h2>
          <p>Configure notifications, access, workflow, and integrations for this project.</p>
        </div>
        <button class="btn btn-sm settings-docs-btn" (click)="launchDocs()">
          Interactive docs →
        </button>
      </header>

      <div class="settings-grid">
        <div class="settings-main">
          <section class="card settings-section" data-tour="notif-section">
            <header class="settings-section-header">
              <h3>Notifications</h3>
              <span class="settings-section-hint">How the project communicates</span>
            </header>

            <div class="settings-field" data-tour="email-digest">
              <div class="settings-field-label">
                <span>Email digest</span>
                <span class="settings-field-hint">Summary of project activity</span>
              </div>
              <div class="settings-toggle-group">
                <button
                  *ngFor="let opt of emailDigestOptions"
                  class="settings-toggle-btn"
                  [class.settings-toggle-btn-active]="state.emailDigest === opt"
                  (click)="setEmailDigest(opt)"
                >
                  {{ opt }}
                </button>
              </div>
            </div>

            <div class="settings-field" data-tour="slack-channel">
              <div class="settings-field-label">
                <span>Slack channel</span>
                <span class="settings-field-hint">Real-time event feed</span>
              </div>
              <div class="settings-field-value">
                <span
                  *ngIf="state.slackChannel; else noSlack"
                  class="settings-badge settings-badge-connected"
                >
                  {{ state.slackChannel }}
                </span>
                <ng-template #noSlack>
                  <span class="settings-badge settings-badge-inactive">Not connected</span>
                </ng-template>
              </div>
            </div>

            <div class="settings-field" data-tour="push-toggle">
              <div class="settings-field-label">
                <span>Push notifications</span>
                <span class="settings-field-hint">Browser and mobile alerts</span>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="state.pushEnabled"
                class="settings-toggle"
                [class.settings-toggle-on]="state.pushEnabled"
                (click)="setPushEnabled(!state.pushEnabled)"
              >
                <span class="settings-toggle-thumb"></span>
              </button>
            </div>

            <div class="settings-field" data-tour="quiet-hours">
              <div class="settings-field-label">
                <span>Quiet hours</span>
                <span class="settings-field-hint">Suppress between 22:00 – 08:00</span>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="state.quietHoursEnabled"
                class="settings-toggle"
                [class.settings-toggle-on]="state.quietHoursEnabled"
                (click)="setQuietHours(!state.quietHoursEnabled)"
              >
                <span class="settings-toggle-thumb"></span>
              </button>
            </div>
          </section>

          <section class="card settings-section" data-tour="workflow-section">
            <header class="settings-section-header">
              <h3>Workflow</h3>
              <span class="settings-section-hint">How issues move through the pipeline</span>
            </header>

            <div class="settings-field" data-tour="transition-mode">
              <div class="settings-field-label">
                <span>Issue transition</span>
                <span class="settings-field-hint">What happens when a linked PR merges</span>
              </div>
              <div class="settings-toggle-group">
                <button
                  *ngFor="let opt of transitionOptions"
                  class="settings-toggle-btn"
                  [class.settings-toggle-btn-active]="state.issueTransition === opt"
                  (click)="setIssueTransition(opt)"
                >
                  {{ opt.replace('-', ' ') }}
                </button>
              </div>
            </div>

            <div class="settings-field" data-tour="approval-gate">
              <div class="settings-field-label">
                <span>Require approval</span>
                <span class="settings-field-hint">Transitions need lead sign-off</span>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="state.requireApproval"
                class="settings-toggle"
                [class.settings-toggle-on]="state.requireApproval"
                (click)="setRequireApproval(!state.requireApproval)"
              >
                <span class="settings-toggle-thumb"></span>
              </button>
            </div>

            <div class="settings-automation" data-tour="automation-rules">
              <div class="settings-field-label" style="margin-bottom: 0.65rem">
                <span>Automation rules</span>
                <span class="settings-field-hint">{{ activeRuleCount }} active</span>
              </div>
              <div
                *ngFor="let rule of state.automationRules"
                class="settings-rule-row"
                [class.settings-rule-row-active]="rule.enabled"
                [attr.data-tour]="'rule-' + rule.id"
              >
                <div class="settings-rule-info">
                  <span class="settings-rule-name">{{ rule.name }}</span>
                  <span class="settings-rule-detail">{{ rule.trigger }} → {{ rule.action }}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  [attr.aria-checked]="rule.enabled"
                  class="settings-toggle"
                  [class.settings-toggle-on]="rule.enabled"
                  (click)="toggleRule(rule.id, !rule.enabled)"
                >
                  <span class="settings-toggle-thumb"></span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside class="settings-sidebar">
          <section class="card settings-section" data-tour="access-section">
            <header class="settings-section-header">
              <h3>Access & Security</h3>
            </header>

            <div class="settings-field" data-tour="role-selector">
              <div class="settings-field-label">
                <span>Project role</span>
              </div>
              <div class="settings-toggle-group">
                <button
                  *ngFor="let r of roleOptions"
                  class="settings-toggle-btn"
                  [class.settings-toggle-btn-active]="state.role === r"
                  (click)="setRole(r)"
                >
                  {{ r }}
                </button>
              </div>
            </div>

            <div class="settings-permissions" data-tour="permissions-list">
              <span class="settings-field-hint">
                {{ permissions.length }} permission{{ permissions.length !== 1 ? 's' : '' }}
              </span>
              <ul class="settings-perm-list">
                <li *ngFor="let p of permissions">{{ p }}</li>
              </ul>
            </div>

            <div class="settings-field" data-tour="2fa-toggle">
              <div class="settings-field-label">
                <span>Two-factor auth</span>
              </div>
              <div class="settings-field-value">
                <span
                  class="settings-badge"
                  [class.settings-badge-connected]="state.twoFactorEnabled"
                  [class.settings-badge-inactive]="!state.twoFactorEnabled"
                >
                  {{ state.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>

            <div class="settings-field" data-tour="session-timeout">
              <div class="settings-field-label">
                <span>Session timeout</span>
              </div>
              <span class="settings-field-value-text">{{ state.sessionTimeoutMin }} min</span>
            </div>
          </section>

          <section class="card settings-section" data-tour="integrations-section">
            <header class="settings-section-header">
              <h3>Integrations</h3>
            </header>

            <div class="settings-field settings-field-col" data-tour="api-key-row">
              <div class="settings-field-label">
                <span>API key</span>
                <span class="settings-field-hint">Authenticate external tools</span>
              </div>
              <div class="settings-api-key-row">
                <code class="settings-api-key">{{ apiKeyDisplay }}</code>
                <button class="btn btn-sm" (click)="toggleApiKey()">
                  {{ state.apiKeyRevealed ? 'Hide' : 'Reveal' }}
                </button>
              </div>
            </div>

            <div class="settings-field settings-field-col" data-tour="webhook-config">
              <div class="settings-field-label">
                <span>Webhook</span>
                <span class="settings-field-hint">POST events to an external URL</span>
              </div>
              <input
                class="form-input settings-webhook-input"
                placeholder="https://hooks.example.com/pulse"
                [value]="state.webhookUrl"
                (input)="onWebhookUrlInput($event)"
              />
              <div class="settings-webhook-events">
                <label
                  *ngFor="let evt of webhookEventOptions"
                  class="settings-event-label"
                >
                  <input
                    type="checkbox"
                    [checked]="isEventChecked(evt)"
                    (change)="toggleWebhookEvent(evt)"
                  />
                  <span>{{ evt }}</span>
                </label>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit, OnDestroy {
  state: SettingsStateShape = settingsState.get();
  permissions: string[] = [];

  readonly emailDigestOptions: EmailDigest[] = ['off', 'daily', 'weekly'];
  readonly transitionOptions: IssueTransition[] = ['manual', 'auto-close', 'auto-resolve'];
  readonly roleOptions: ProjectRole[] = ['viewer', 'editor', 'admin'];
  readonly webhookEventOptions = WEBHOOK_EVENT_OPTIONS;

  private listener = () => this.sync();

  constructor(
    private cdr: ChangeDetectorRef,
    private tour: GuidedTourService,
  ) {}

  ngOnInit(): void {
    settingsState.init();
    this.sync();
    window.addEventListener(SETTINGS_EVENT, this.listener);
  }

  ngOnDestroy(): void {
    window.removeEventListener(SETTINGS_EVENT, this.listener);
    settingsState.reset();
  }

  get activeRuleCount(): number {
    return this.state.automationRules.filter((r) => r.enabled).length;
  }

  get apiKeyDisplay(): string {
    return this.state.apiKeyRevealed ? this.state.apiKey : '•'.repeat(32);
  }

  isEventChecked(evt: string): boolean {
    return this.state.webhookEvents.includes(evt);
  }

  launchDocs(): void {
    void this.tour.actions.startWithDefinition(interactiveDocsTour, {
      startNodeId: interactiveDocsTour.steps[0]?.id,
    });
  }

  setEmailDigest(v: EmailDigest): void { settingsState.setEmailDigest(v); this.notify(); }
  setPushEnabled(v: boolean): void { settingsState.setPushEnabled(v); this.notify(); }
  setQuietHours(v: boolean): void { settingsState.setQuietHours(v); this.notify(); }
  setIssueTransition(v: IssueTransition): void { settingsState.setIssueTransition(v); this.notify(); }
  setRequireApproval(v: boolean): void { settingsState.setRequireApproval(v); this.notify(); }
  setRole(v: ProjectRole): void { settingsState.setRole(v); this.notify(); }
  toggleRule(id: number, enabled: boolean): void { settingsState.toggleAutomationRule(id, enabled); this.notify(); }
  toggleApiKey(): void { settingsState.setApiKeyRevealed(!this.state.apiKeyRevealed); this.notify(); }

  onWebhookUrlInput(ev: Event): void {
    const value = (ev.target as HTMLInputElement).value;
    settingsState.setWebhookUrl(value);
    this.notify();
  }

  toggleWebhookEvent(evt: string): void {
    const next = this.isEventChecked(evt)
      ? this.state.webhookEvents.filter((e) => e !== evt)
      : [...this.state.webhookEvents, evt];
    settingsState.setWebhookEvents(next);
    this.notify();
  }

  private notify(): void {
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
  }

  private sync(): void {
    this.state = settingsState.get();
    this.permissions = getPermissionsForRole(this.state.role);
    this.cdr.markForCheck();
  }
}
