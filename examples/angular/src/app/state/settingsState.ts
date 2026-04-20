export type EmailDigest = 'off' | 'daily' | 'weekly';
export type ProjectRole = 'viewer' | 'editor' | 'admin';
export type IssueTransition = 'manual' | 'auto-close' | 'auto-resolve';

export interface AutomationRule {
  id: number;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

export interface SettingsStateShape {
  emailDigest: EmailDigest;
  slackChannel: string | null;
  pushEnabled: boolean;
  quietHoursEnabled: boolean;
  role: ProjectRole;
  twoFactorEnabled: boolean;
  sessionTimeoutMin: number;
  ipAllowlist: string[];
  issueTransition: IssueTransition;
  requireApproval: boolean;
  automationRules: AutomationRule[];
  apiKeyRevealed: boolean;
  apiKey: string;
  webhookUrl: string;
  webhookEvents: string[];
}

const ROLE_PERMISSIONS: Record<ProjectRole, string[]> = {
  viewer: ['View issues', 'Add comments'],
  editor: ['View issues', 'Add comments', 'Create issues', 'Edit issues', 'Manage sprints'],
  admin: ['View issues', 'Add comments', 'Create issues', 'Edit issues', 'Manage sprints', 'Delete issues', 'Manage members', 'Project settings'],
};

export function getPermissionsForRole(role: ProjectRole): string[] {
  return ROLE_PERMISSIONS[role];
}

function defaultState(): SettingsStateShape {
  return {
    emailDigest: 'off',
    slackChannel: null,
    pushEnabled: false,
    quietHoursEnabled: false,
    role: 'viewer',
    twoFactorEnabled: false,
    sessionTimeoutMin: 30,
    ipAllowlist: [],
    issueTransition: 'manual',
    requireApproval: false,
    automationRules: [
      { id: 1, name: 'Stale issue cleanup', trigger: 'No activity for 14 days', action: 'Add "stale" label', enabled: false },
      { id: 2, name: 'Auto-assign on comment', trigger: 'First comment by non-assignee', action: 'Assign to commenter', enabled: false },
      { id: 3, name: 'Sprint overflow alert', trigger: 'Sprint capacity > 120%', action: 'Notify #eng-leads in Slack', enabled: false },
    ],
    apiKeyRevealed: false,
    apiKey: 'pulse_sk_live_7f3a9c2e1d4b8f6a0e5c3d9b2a7f1e4d',
    webhookUrl: '',
    webhookEvents: [],
  };
}

class SettingsStateManager {
  private state: SettingsStateShape | null = null;

  init(): SettingsStateShape {
    if (!this.state) this.state = defaultState();
    return this.state;
  }

  get(): SettingsStateShape {
    return this.init();
  }

  reset(): void {
    this.state = null;
  }

  setEmailDigest(value: EmailDigest): void { this.init().emailDigest = value; }
  setSlackChannel(channel: string | null): void { this.init().slackChannel = channel; }
  setPushEnabled(enabled: boolean): void { this.init().pushEnabled = enabled; }
  setQuietHours(enabled: boolean): void { this.init().quietHoursEnabled = enabled; }
  setRole(role: ProjectRole): void { this.init().role = role; }
  setTwoFactor(enabled: boolean): void { this.init().twoFactorEnabled = enabled; }
  setSessionTimeout(minutes: number): void { this.init().sessionTimeoutMin = minutes; }
  setIpAllowlist(ips: string[]): void { this.init().ipAllowlist = ips; }
  setIssueTransition(mode: IssueTransition): void { this.init().issueTransition = mode; }
  setRequireApproval(required: boolean): void { this.init().requireApproval = required; }

  toggleAutomationRule(id: number, enabled: boolean): void {
    const rule = this.init().automationRules.find((r) => r.id === id);
    if (rule) rule.enabled = enabled;
  }

  setApiKeyRevealed(revealed: boolean): void { this.init().apiKeyRevealed = revealed; }
  setWebhookUrl(url: string): void { this.init().webhookUrl = url; }
  setWebhookEvents(events: string[]): void { this.init().webhookEvents = events; }
}

export const settingsState = new SettingsStateManager();
