import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskStoreService } from '../state/taskStore.service';
import { USERS } from '../state/data';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const PRESENCE: Record<string, { dot: string; label: string }> = {
  'Alice Chen': { dot: 'presence-online', label: 'Online · Reviewing PR #482' },
  'Bob Martinez': { dot: 'presence-online', label: 'Online · Dashboard' },
  'Carol Wu': { dot: 'presence-away', label: 'Away · Since 14:02' },
  'Dan Osei': { dot: 'presence-offline', label: 'Offline · Last active 2h ago' },
};

const ACTIVITY = [
  { author: 'Alice Chen', verb: 'moved', target: 'Design new landing page', meta: '→ In Review', when: '2 min ago' },
  { author: 'Bob Martinez', verb: 'commented on', target: 'Fix authentication timeout bug', meta: '"Reproduced on staging"', when: '14 min ago' },
  { author: 'Dan Osei', verb: 'closed', target: 'Optimize database queries', meta: 'Shipped in v2.1.4', when: '1 h ago' },
  { author: 'Carol Wu', verb: 'uploaded attachment to', target: 'Design new landing page', meta: 'final-mockup.png', when: '2 h ago' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <span class="page-kicker">Overview · Today</span>
          <h2 class="page-title">Good morning, Chris</h2>
          <p class="page-subtitle">
            Four tickets need your attention, two are blocking the v2.0 release. Your team is live in three channels.
          </p>
        </div>
        <a routerLink="/tasks/new" class="btn btn-primary" data-tour="action-create">+ Create Task</a>
      </div>

      <div class="stats-grid" data-tour="stats-section">
        <div class="stat-card" data-tour="stat-total">
          <div class="stat-value">{{ stats().total }}</div>
          <div class="stat-label">Total Tasks</div>
        </div>
        <div class="stat-card" data-tour="stat-open">
          <div class="stat-value">{{ stats().open }}</div>
          <div class="stat-label">Open</div>
        </div>
        <div class="stat-card" data-tour="stat-in-progress">
          <div class="stat-value">{{ stats().inProgress }}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-card" data-tour="stat-review">
          <div class="stat-value">{{ stats().review }}</div>
          <div class="stat-label">In Review</div>
        </div>
        <div class="stat-card" data-tour="stat-done">
          <div class="stat-value">{{ stats().done }}</div>
          <div class="stat-label">Done</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card" data-tour="quick-actions">
          <h3 class="section-title">Quick Actions</h3>
          <div class="action-row">
            <a routerLink="/tasks/new" class="btn btn-primary">+ Create Task</a>
            <a routerLink="/tasks" class="btn" data-tour="action-view-all">View All Tasks</a>
            <button class="btn" data-tour="action-my-tasks">My Tasks ({{ stats().inProgress + stats().review }})</button>
          </div>
        </div>

        <div class="card" data-tour="team-roster">
          <h3 class="section-title">Team Roster</h3>
          <ul class="roster-list">
            <li *ngFor="let user of users" class="roster-row">
              <span class="assignee-avatar" aria-hidden="true">{{ initial(user) }}</span>
              <div class="roster-copy">
                <span class="roster-name">{{ user }}</span>
                <span class="roster-status">{{ presenceFor(user).label }}</span>
              </div>
              <span class="presence-dot {{ presenceFor(user).dot }}" aria-hidden="true"></span>
            </li>
          </ul>
        </div>
      </div>

      <div class="dashboard-grid">
        <div *ngIf="urgent().length > 0" class="card" data-tour="urgent-section">
          <h3 class="section-title section-title-danger">
            Urgent Tasks
            <span class="section-count">{{ urgent().length }}</span>
          </h3>
          <div *ngFor="let task of urgent()" class="urgent-task-row">
            <a [routerLink]="['/tasks', task.id]" class="urgent-task-link">{{ task.title }}</a>
            <span class="badge badge-high">{{ task.priority }}</span>
          </div>
        </div>

        <div class="card" data-tour="activity-feed">
          <h3 class="section-title">Live Activity</h3>
          <ul class="activity-list">
            <li *ngFor="let event of activity" class="activity-row">
              <span class="assignee-avatar assignee-avatar-sm" aria-hidden="true">{{ initial(event.author) }}</span>
              <div class="activity-copy">
                <div class="activity-line">
                  <strong>{{ event.author }}</strong> {{ event.verb }}
                  <span class="activity-target">{{ event.target }}</span>
                </div>
                <div class="activity-meta">
                  <span>{{ event.meta }}</span>
                  <span class="activity-dot">·</span>
                  <span>{{ event.when }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  private readonly store = inject(TaskStoreService);

  readonly stats = this.store.stats;
  readonly urgent = computed(() =>
    this.store.tasks().filter((t) => t.priority === 'high' && t.status !== 'done'),
  );

  readonly users = USERS;
  readonly activity = ACTIVITY;

  initial(name: string): string {
    return initials(name);
  }

  presenceFor(user: string) {
    return PRESENCE[user] ?? { dot: 'presence-offline', label: 'Offline' };
  }
}
