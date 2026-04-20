import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TourInteractableStateDirective } from '@routepilot/angular';
import { USERS, formatFileSize, getFileIcon, type Attachment, type Task } from '../state/data';
import { demoState, DEMO_ID } from '../state/demoState';
import { TaskStoreService } from '../state/taskStore.service';

const STATUSES: Task['status'][] = ['open', 'in-progress', 'review', 'done'];

const statusBadgeClass = (status: Task['status']): string =>
  status === 'in-progress' ? 'badge-progress' : `badge-${status}`;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TourInteractableStateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" *ngIf="task() as t; else notFound">
      <div style="margin-bottom: 1rem;">
        <a routerLink="/tasks" style="font-size: 0.8rem; color: var(--text-muted);">← Back to Tasks</a>
      </div>

      <div data-tour="task-header" style="margin-bottom: 1.5rem;">
        <h2>{{ t.title }}</h2>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          <button class="btn btn-sm btn-primary" data-tour="assign-btn" (click)="setAssignModalOpen(true)">
            {{ t.assignee ? 'Reassign' : 'Assign' }}
          </button>
          <button class="btn btn-sm" data-tour="edit-btn">Edit</button>
        </div>
      </div>

      <div data-tour="status-bar" class="status-bar">
        <button
          *ngFor="let s of statuses"
          class="status-btn"
          [class.active]="t.status === s"
          [attr.data-tour]="'status-' + s"
          (click)="handleStatusChange(s)"
        >
          {{ s === 'in-progress' ? 'In Progress' : capitalize(s) }}
        </button>
      </div>

      <div class="detail-grid">
        <div>
          <div class="card" data-tour="task-description">
            <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Description</h3>
            <p style="color: var(--text-muted); font-size: 0.875rem; white-space: pre-line;">{{ t.description }}</p>
          </div>

          <div *ngIf="t.attachments.length > 0" class="card" style="margin-top: 1rem;" data-tour="attachments-section">
            <h3 style="font-size: 0.9rem; margin-bottom: 0.75rem;">
              <span class="material-symbols-outlined">attach_file</span>Attachments ({{ t.attachments.length }})
            </h3>
            <div class="attachment-list">
              <div
                *ngFor="let a of t.attachments; let i = index"
                class="attachment-item"
                [attr.data-tour]="i === 0 ? 'first-attachment' : null"
                (click)="openLocalPreview(a)"
              >
                <span class="attachment-icon">{{ fileIcon(a.category) }}</span>
                <div class="attachment-info">
                  <span class="attachment-name">{{ a.name }}</span>
                  <span class="attachment-meta">{{ formatSize(a.size) }} · {{ a.category }}</span>
                </div>
                <button
                  class="btn-icon"
                  [attr.data-tour]="i === 0 ? 'first-attachment-preview' : null"
                  (click)="$event.stopPropagation(); openLocalPreview(a)"
                  title="Preview"
                ><span class="material-symbols-outlined">visibility</span></button>
              </div>
            </div>
          </div>

          <div class="card" style="margin-top: 1rem;" data-tour="comments-section">
            <h3 style="font-size: 0.9rem; margin-bottom: 0.75rem;">
              Comments ({{ t.comments.length }})
            </h3>
            <p *ngIf="t.comments.length === 0" style="color: var(--text-muted); font-size: 0.8rem;">No comments yet.</p>
            <div
              *ngFor="let c of t.comments; let last = last"
              class="comment-box"
              [attr.data-tour]="last ? 'latest-comment' : null"
            >
              <div class="comment-header">
                <span class="comment-author">{{ c.author }}</span>
                <span class="comment-date">{{ c.createdAt | date:'shortDate' }}</span>
              </div>
              <p style="margin-top: 0.375rem; font-size: 0.85rem; color: var(--text-muted);">{{ c.content }}</p>
              <div
                *ngIf="c.attachments && c.attachments.length > 0"
                class="comment-attachments"
                [attr.data-tour]="last ? 'comment-attachments' : null"
              >
                <div
                  *ngFor="let a of c.attachments"
                  class="comment-attachment-badge"
                  (click)="openLocalPreview(a)"
                >{{ fileIcon(a.category) }} {{ a.name }}</div>
              </div>
            </div>

            <div style="margin-top: 1rem;" data-tour="comment-form">
              <textarea
                class="form-textarea"
                data-tour="comment-input"
                placeholder="Add a comment..."
                [value]="commentDraft()"
                (input)="onCommentInput($event)"
                style="min-height: 70px;"
              ></textarea>

              <div *ngIf="commentFiles().length > 0" class="selected-files">
                <div *ngFor="let f of commentFiles(); let i = index" class="selected-file">
                  <span>{{ f.name }}</span>
                  <span class="file-size">{{ formatSize(f.size) }}</span>
                  <button class="btn-icon-sm" (click)="removeCommentFile(i)"><span class="material-symbols-outlined">close</span></button>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                <label class="btn btn-sm attach-btn" data-tour="attach-files-btn">
                  <input
                    type="file"
                    multiple
                    style="display: none;"
                    (change)="onFileSelect($event)"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.log,.json,.csv,.yaml,.md"
                  />
                  <span class="material-symbols-outlined">attach_file</span>Attach files
                </label>
                <button
                  class="btn btn-primary btn-sm"
                  data-tour="comment-submit"
                  [disabled]="!commentDraft().trim()"
                  (click)="handleAddComment()"
                >Add Comment</button>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-sidebar">
          <div class="card" data-tour="task-sidebar">
            <dl>
              <dt>Status</dt>
              <dd><span class="badge" [class]="statusBadgeClass(t.status)">{{ t.status }}</span></dd>

              <dt>Priority</dt>
              <dd data-tour="task-priority"><span class="badge badge-{{ t.priority }}">{{ t.priority }}</span></dd>

              <dt>Assignee</dt>
              <dd data-tour="task-assignee">
                <ng-container *ngIf="t.assignee; else noAssignee">{{ t.assignee }}</ng-container>
                <ng-template #noAssignee><span style="color: var(--text-muted);">Unassigned</span></ng-template>
              </dd>

              <dt>Created</dt>
              <dd>{{ t.createdAt | date:'shortDate' }}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <ng-template #notFound>
      <div class="page"><p>Task not found. <a routerLink="/tasks">Back to list</a></p></div>
    </ng-template>

    <!-- Assign Modal -->
    <div
      *ngIf="assignModalOpen()"
      class="modal-backdrop"
      (click)="setAssignModalOpen(false)"
      rpTourInteractableState="assign-modal"
      (openChange)="setAssignModalOpen($event)"
    >
      <div class="modal" data-tour="assign-modal" (click)="$event.stopPropagation()">
        <h3>Assign Task</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
          Select a team member to assign this task to.
        </p>
        <button
          *ngFor="let user of users"
          class="btn"
          [attr.data-tour]="'assign-user-' + firstName(user)"
          style="width: 100%; margin-bottom: 0.5rem; justify-content: flex-start;"
          (click)="handleAssign(user)"
        >
          {{ user }}
          <span *ngIf="task()?.assignee === user" style="margin-left: auto; font-size: 0.7rem; color: var(--primary);">Current</span>
        </button>
        <button class="btn" style="width: 100%; margin-top: 0.5rem;" (click)="setAssignModalOpen(false)">
          Cancel
        </button>
      </div>
    </div>

    <!-- Preview Modal -->
    <div
      *ngIf="previewAttachment() as p"
      class="modal-backdrop"
      (click)="setPreviewOpen(false)"
      rpTourInteractableState="preview-modal"
      (openChange)="setPreviewOpen($event)"
    >
      <div class="preview-modal" data-tour="preview-modal" (click)="$event.stopPropagation()">
        <div class="preview-header">
          <div class="preview-file-info">
            <span class="preview-icon">{{ fileIcon(p.category) }}</span>
            <div>
              <span class="preview-name">{{ p.name }}</span>
              <span class="preview-meta">{{ formatSize(p.size) }} · {{ p.category }}</span>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button
              *ngIf="p.category !== 'image'"
              class="btn btn-sm"
              data-tour="preview-copy-btn"
              (click)="copyPreview(p)"
            ><span class="material-symbols-outlined">content_copy</span>Copy</button>
            <button class="btn btn-sm" (click)="setPreviewOpen(false)"><span class="material-symbols-outlined">close</span>Close</button>
          </div>
        </div>
        <div class="preview-content">
          <div *ngIf="p.category === 'image'; else textPreview" class="preview-image-container">
            <img [src]="p.content" [alt]="p.name" class="preview-image" />
          </div>
          <ng-template #textPreview>
            <pre class="preview-text" data-tour="preview-text-content">{{ p.content }}</pre>
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(TaskStoreService);

  readonly statuses = STATUSES;
  readonly users = USERS;

  private readonly idParam = signal<number>(NaN);
  private readonly demoTick = signal(0);

  private readonly assignModalLocal = signal(false);
  private readonly previewLocal = signal<Attachment | null>(null);
  private readonly commentDraftLocal = signal('');
  readonly commentFiles = signal<File[]>([]);

  readonly task = computed<Task | undefined>(() => {
    this.demoTick();
    const id = this.idParam();
    const isDemo = id === DEMO_ID;
    if (isDemo && demoState.isActive) return demoState.getTask();
    return this.store.getTask(id);
  });

  readonly assignModalOpen = computed(() => {
    this.demoTick();
    const id = this.idParam();
    if (id === DEMO_ID && demoState.isActive) return demoState.getUi().assignModalOpen;
    return this.assignModalLocal();
  });

  readonly commentDraft = computed(() => {
    this.demoTick();
    const id = this.idParam();
    if (id === DEMO_ID && demoState.isActive) return demoState.getUi().commentDraft;
    return this.commentDraftLocal();
  });

  readonly previewAttachment = computed<Attachment | null>(() => {
    this.demoTick();
    const id = this.idParam();
    const t = this.task();
    if (id === DEMO_ID && demoState.isActive) {
      const ui = demoState.getUi();
      if (!ui.previewOpen) return null;
      return t?.attachments.find((a) => a.id === ui.previewAttachmentId) ?? t?.attachments[0] ?? null;
    }
    return this.previewLocal();
  });

  private readonly handler = () => this.demoTick.update((t) => t + 1);
  private routeSub?: { unsubscribe: () => void };

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((p) => {
      this.idParam.set(Number(p.get('id')));
    });
    window.addEventListener('demo-tour:state-changed', this.handler);
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    window.removeEventListener('demo-tour:state-changed', this.handler);
  }

  private notifyDemo(): void {
    window.dispatchEvent(new CustomEvent('demo-tour:state-changed', { detail: { taskId: DEMO_ID } }));
  }

  private isDemoTask(): boolean {
    return this.idParam() === DEMO_ID;
  }

  handleStatusChange(status: Task['status']): void {
    const t = this.task();
    if (!t) return;
    if (this.isDemoTask()) {
      demoState.setStatus(status);
      this.notifyDemo();
    } else {
      this.store.updateTask(t.id, { status });
    }
  }

  handleAssign(user: string): void {
    const t = this.task();
    if (!t) return;
    if (this.isDemoTask()) {
      demoState.setAssignee(user);
      this.notifyDemo();
    } else {
      this.store.updateTask(t.id, { assignee: user });
    }
    this.setAssignModalOpen(false);
  }

  setAssignModalOpen(open: boolean): void {
    if (this.isDemoTask() && demoState.isActive) {
      demoState.setAssignModalOpen(open);
      this.notifyDemo();
    } else {
      this.assignModalLocal.set(open);
    }
  }

  setPreviewOpen(open: boolean): void {
    if (this.isDemoTask() && demoState.isActive) {
      demoState.setPreviewOpen(open);
      this.notifyDemo();
      return;
    }
    if (open) {
      this.previewLocal.set(this.task()?.attachments[0] ?? null);
    } else {
      this.previewLocal.set(null);
    }
  }

  openLocalPreview(attachment: Attachment): void {
    if (this.isDemoTask() && demoState.isActive) {
      demoState.setPreviewOpen(true, attachment.id);
      this.notifyDemo();
    } else {
      this.previewLocal.set(attachment);
    }
  }

  onCommentInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    if (this.isDemoTask() && demoState.isActive) {
      demoState.setCommentDraft(value);
      this.notifyDemo();
    } else {
      this.commentDraftLocal.set(value);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const next = Array.from(input.files).slice(0, 8 - this.commentFiles().length);
    this.commentFiles.update((prev) => [...prev, ...next]);
    input.value = '';
  }

  removeCommentFile(index: number): void {
    this.commentFiles.update((prev) => prev.filter((_, i) => i !== index));
  }

  handleAddComment(): void {
    const t = this.task();
    const draft = this.commentDraft();
    if (!t || !draft.trim()) return;
    if (this.isDemoTask()) {
      demoState.addComment({
        id: Math.floor(Math.random() * 100000),
        author: 'You',
        content: draft,
        createdAt: new Date().toISOString(),
      });
      demoState.setCommentDraft('');
      this.notifyDemo();
    } else {
      this.store.addComment(t.id, { author: 'You', content: draft });
      this.commentDraftLocal.set('');
    }
    this.commentFiles.set([]);
  }

  copyPreview(a: Attachment): void {
    if (navigator.clipboard) navigator.clipboard.writeText(a.content);
  }

  fileIcon(category: Attachment['category']): string { return getFileIcon(category); }
  formatSize(bytes: number): string { return formatFileSize(bytes); }
  statusBadgeClass(status: Task['status']): string { return statusBadgeClass(status); }
  capitalize(s: string): string { return capitalize(s); }
  firstName(user: string): string { return user.split(' ')[0].toLowerCase(); }
}
