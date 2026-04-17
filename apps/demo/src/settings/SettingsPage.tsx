import { useEffect, useState } from 'react';
import { useGuidedTourActions } from '@routepilot/core';
import {
  settingsState,
  getPermissionsForRole,
  type ProjectRole,
  type IssueTransition,
} from './settingsState';
import { interactiveDocsTour } from './settingsTour';

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

const notify = () => {
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
};

export default function SettingsPage() {
  const tourActions = useGuidedTourActions();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener(SETTINGS_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_EVENT, handler);
  }, []);

  useEffect(() => {
    settingsState.init();
    notify();
    return () => {
      settingsState.reset();
    };
  }, []);

  const state = settingsState.get();
  const permissions = getPermissionsForRole(state.role);

  const launchDocs = () => {
    void tourActions.startWithDefinition(interactiveDocsTour, {
      startNodeId: interactiveDocsTour.steps[0]?.id,
    });
  };

  return (
    <div className="settings-page">
      <header className="settings-hero" data-tour="settings-header">
        <div>
          <span className="settings-eyebrow">Pulse · ACME-ENG</span>
          <h2>Project settings</h2>
          <p>Configure notifications, access, workflow, and integrations for this project.</p>
        </div>
        <button className="btn btn-sm settings-docs-btn" onClick={launchDocs}>
          Interactive docs →
        </button>
      </header>

      <div className="settings-grid">
        <div className="settings-main">
          <section className="card settings-section" data-tour="notif-section">
            <SectionHeader title="Notifications" hint="How the project communicates" />

            <div className="settings-field" data-tour="email-digest">
              <div className="settings-field-label">
                <span>Email digest</span>
                <span className="settings-field-hint">Summary of project activity</span>
              </div>
              <div className="settings-toggle-group">
                {(['off', 'daily', 'weekly'] as const).map((opt) => (
                  <button
                    key={opt}
                    className={`settings-toggle-btn ${state.emailDigest === opt ? 'settings-toggle-btn-active' : ''}`}
                    onClick={() => { settingsState.setEmailDigest(opt); notify(); }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-field" data-tour="slack-channel">
              <div className="settings-field-label">
                <span>Slack channel</span>
                <span className="settings-field-hint">Real-time event feed</span>
              </div>
              <div className="settings-field-value">
                {state.slackChannel ? (
                  <span className="settings-badge settings-badge-connected">
                    {state.slackChannel}
                  </span>
                ) : (
                  <span className="settings-badge settings-badge-inactive">Not connected</span>
                )}
              </div>
            </div>

            <div className="settings-field" data-tour="push-toggle">
              <div className="settings-field-label">
                <span>Push notifications</span>
                <span className="settings-field-hint">Browser and mobile alerts</span>
              </div>
              <Toggle
                checked={state.pushEnabled}
                onChange={(v) => { settingsState.setPushEnabled(v); notify(); }}
              />
            </div>

            <div className="settings-field" data-tour="quiet-hours">
              <div className="settings-field-label">
                <span>Quiet hours</span>
                <span className="settings-field-hint">Suppress between 22:00 – 08:00</span>
              </div>
              <Toggle
                checked={state.quietHoursEnabled}
                onChange={(v) => { settingsState.setQuietHours(v); notify(); }}
              />
            </div>
          </section>

          <section className="card settings-section" data-tour="workflow-section">
            <SectionHeader title="Workflow" hint="How issues move through the pipeline" />

            <div className="settings-field" data-tour="transition-mode">
              <div className="settings-field-label">
                <span>Issue transition</span>
                <span className="settings-field-hint">What happens when a linked PR merges</span>
              </div>
              <div className="settings-toggle-group">
                {(['manual', 'auto-close', 'auto-resolve'] as const).map((opt) => (
                  <button
                    key={opt}
                    className={`settings-toggle-btn ${state.issueTransition === opt ? 'settings-toggle-btn-active' : ''}`}
                    onClick={() => { settingsState.setIssueTransition(opt as IssueTransition); notify(); }}
                  >
                    {opt.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-field" data-tour="approval-gate">
              <div className="settings-field-label">
                <span>Require approval</span>
                <span className="settings-field-hint">Transitions need lead sign-off</span>
              </div>
              <Toggle
                checked={state.requireApproval}
                onChange={(v) => { settingsState.setRequireApproval(v); notify(); }}
              />
            </div>

            <div className="settings-automation" data-tour="automation-rules">
              <div className="settings-field-label" style={{ marginBottom: '0.65rem' }}>
                <span>Automation rules</span>
                <span className="settings-field-hint">{state.automationRules.filter((r) => r.enabled).length} active</span>
              </div>
              {state.automationRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`settings-rule-row ${rule.enabled ? 'settings-rule-row-active' : ''}`}
                  data-tour={`rule-${rule.id}`}
                >
                  <div className="settings-rule-info">
                    <span className="settings-rule-name">{rule.name}</span>
                    <span className="settings-rule-detail">
                      {rule.trigger} → {rule.action}
                    </span>
                  </div>
                  <Toggle
                    checked={rule.enabled}
                    onChange={(v) => { settingsState.toggleAutomationRule(rule.id, v); notify(); }}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="settings-sidebar">
          <section className="card settings-section" data-tour="access-section">
            <SectionHeader title="Access & Security" />

            <div className="settings-field" data-tour="role-selector">
              <div className="settings-field-label">
                <span>Project role</span>
              </div>
              <div className="settings-toggle-group">
                {(['viewer', 'editor', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    className={`settings-toggle-btn ${state.role === r ? 'settings-toggle-btn-active' : ''}`}
                    onClick={() => { settingsState.setRole(r as ProjectRole); notify(); }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-permissions" data-tour="permissions-list">
              <span className="settings-field-hint">
                {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
              </span>
              <ul className="settings-perm-list">
                {permissions.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="settings-field" data-tour="2fa-toggle">
              <div className="settings-field-label">
                <span>Two-factor auth</span>
              </div>
              <div className="settings-field-value">
                <span className={`settings-badge ${state.twoFactorEnabled ? 'settings-badge-connected' : 'settings-badge-inactive'}`}>
                  {state.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="settings-field" data-tour="session-timeout">
              <div className="settings-field-label">
                <span>Session timeout</span>
              </div>
              <span className="settings-field-value-text">{state.sessionTimeoutMin} min</span>
            </div>
          </section>

          <section className="card settings-section" data-tour="integrations-section">
            <SectionHeader title="Integrations" />

            <div className="settings-field settings-field-col" data-tour="api-key-row">
              <div className="settings-field-label">
                <span>API key</span>
                <span className="settings-field-hint">Authenticate external tools</span>
              </div>
              <div className="settings-api-key-row">
                <code className="settings-api-key">
                  {state.apiKeyRevealed
                    ? state.apiKey
                    : '•'.repeat(32)}
                </code>
                <button
                  className="btn btn-sm"
                  onClick={() => { settingsState.setApiKeyRevealed(!state.apiKeyRevealed); notify(); }}
                >
                  {state.apiKeyRevealed ? 'Hide' : 'Reveal'}
                </button>
              </div>
            </div>

            <div className="settings-field settings-field-col" data-tour="webhook-config">
              <div className="settings-field-label">
                <span>Webhook</span>
                <span className="settings-field-hint">POST events to an external URL</span>
              </div>
              <input
                className="form-input settings-webhook-input"
                placeholder="https://hooks.example.com/pulse"
                value={state.webhookUrl}
                onChange={(e) => { settingsState.setWebhookUrl(e.target.value); notify(); }}
              />
              <div className="settings-webhook-events">
                {WEBHOOK_EVENT_OPTIONS.map((evt) => {
                  const checked = state.webhookEvents.includes(evt);
                  return (
                    <label key={evt} className="settings-event-label">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? state.webhookEvents.filter((e) => e !== evt)
                            : [...state.webhookEvents, evt];
                          settingsState.setWebhookEvents(next);
                          notify();
                        }}
                      />
                      <span>{evt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <header className="settings-section-header">
      <h3>{title}</h3>
      {hint && <span className="settings-section-hint">{hint}</span>}
    </header>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`settings-toggle ${checked ? 'settings-toggle-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle-thumb" />
    </button>
  );
}
