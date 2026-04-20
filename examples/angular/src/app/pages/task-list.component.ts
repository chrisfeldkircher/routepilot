import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { demoState, DEMO_ID } from '../state/demoState';
import { TaskStoreService } from '../state/taskStore.service';
import type { Task } from '../state/data';

const STATUS_CLASS: Record<Task['status'], string> = {
  open: 'badge-open',
  'in-progress': 'badge-progress',
  review: 'badge-review',
  done: 'badge-done',
};

const PRIORITY_CLASS: Record<Task['priority'], string> = {
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <span class="page-kicker">Workstream</span>
          <h2 class="page-title">All Tasks</h2>
          <p class="page-subtitle">
            Every ticket across the team. Filter, prioritize, and jump into work without losing your place.
          </p>
        </div>
        <a routerLink="/tasks/new" class="btn btn-primary" data-tour="list-create-btn">+ New Task</a>
      </div>

      <div class="card card-table" data-tour="task-list-table">
        <div class="task-table">
          <div class="task-table-head">
            <div>Title</div>
            <div data-tour="col-status">Status</div>
            <div data-tour="col-priority">Priority</div>
            <div data-tour="col-assignee">Assignee</div>
          </div>
          <a
            *ngFor="let task of merged()"
            [routerLink]="['/tasks', task.id]"
            class="task-table-link"
            [attr.data-tour]="'task-row-' + task.id"
          >
            <div class="task-table-title">{{ task.title }}</div>
            <div>
              <span class="badge" [class]="statusClass(task.status)">{{ statusLabel(task.status) }}</span>
            </div>
            <div>
              <span class="badge" [class]="priorityClass(task.priority)">{{ task.priority }}</span>
            </div>
            <div [class]="task.assignee ? 'task-table-assignee' : 'task-table-assignee-muted'">
              <ng-container *ngIf="task.assignee; else unassigned">
                <span class="assignee-cell">
                  <span class="assignee-avatar" aria-hidden="true">{{ initial(task.assignee) }}</span>
                  <span>{{ task.assignee }}</span>
                </span>
              </ng-container>
              <ng-template #unassigned>
                <span class="assignee-cell assignee-unassigned">Unassigned</span>
              </ng-template>
            </div>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class TaskListComponent implements OnInit, OnDestroy {
  private readonly store = inject(TaskStoreService);
  private readonly demoTick = signal(0);

  readonly merged = computed<Task[]>(() => {
    this.demoTick();
    const tasks = this.store.tasks();
    if (!demoState.isActive) return tasks;
    const demoTask = demoState.getTask();
    const base = tasks.filter((t) => t.id !== DEMO_ID);
    return [demoTask, ...base];
  });

  private readonly handler = () => this.demoTick.update((t) => t + 1);

  ngOnInit(): void {
    window.addEventListener('demo-tour:state-changed', this.handler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('demo-tour:state-changed', this.handler);
  }

  statusClass(s: Task['status']): string { return STATUS_CLASS[s]; }
  priorityClass(p: Task['priority']): string { return PRIORITY_CLASS[p]; }
  statusLabel(s: Task['status']): string { return s === 'in-progress' ? 'In Progress' : s; }
  initial(name: string): string { return initials(name); }
}
