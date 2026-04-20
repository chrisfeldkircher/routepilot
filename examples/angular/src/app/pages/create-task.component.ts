import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  fileToAttachment,
  formatFileSize,
  getFileIcon,
  inferAttachmentCategory,
  type Attachment,
  type Task,
} from '../state/data';
import { TaskStoreService } from '../state/taskStore.service';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page-header page-header-form">
        <div>
          <span class="page-kicker">Task Composer</span>
          <h2 class="page-title">Create a new task</h2>
          <p class="page-subtitle">
            Capture the core details, set the initial priority, and add attachments so the ticket is ready for review.
          </p>
        </div>
      </div>

      <form class="card create-task-card" data-tour="create-form" (submit)="handleSubmit($event)">
        <div class="form-group" data-tour="field-title">
          <label for="title">Title *</label>
          <input
            id="title"
            class="form-input"
            name="title"
            [(ngModel)]="title"
            placeholder="Enter task title"
            required
          />
        </div>

        <div class="form-group" data-tour="field-description">
          <label for="desc">Description</label>
          <textarea
            id="desc"
            class="form-textarea"
            name="description"
            [(ngModel)]="description"
            placeholder="Describe the task in detail..."
          ></textarea>
        </div>

        <div class="form-grid-two">
          <div class="form-group" data-tour="field-priority">
            <label for="priority">Priority</label>
            <select id="priority" class="form-select" name="priority" [(ngModel)]="priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div class="form-group" data-tour="field-status">
            <label for="status">Initial Status</label>
            <select id="status" class="form-select" name="status" [(ngModel)]="status">
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="attachments">Attachments</label>
          <div class="upload-dropzone">
            <div class="upload-copy">
              <span class="upload-title">Attach files</span>
              <span class="upload-subtitle">Images open in the preview modal, text-like files render inline in the demo.</span>
            </div>
            <label class="btn btn-sm attach-btn" for="attachments">Add files</label>
            <input
              id="attachments"
              type="file"
              multiple
              class="sr-only"
              (change)="onFileSelect($event)"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.log,.json,.csv,.yaml,.yml,.md"
            />
          </div>

          <div *ngIf="files().length > 0" class="selected-files attachment-upload-list">
            <div *ngFor="let f of files(); let i = index" class="selected-file">
              <span class="selected-file-icon">{{ iconFor(f) }}</span>
              <span>{{ f.name }}</span>
              <span class="file-size">{{ formatSize(f.size) }}</span>
              <button type="button" class="btn-icon-sm" (click)="removeFile(i)">Remove</button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn" (click)="cancel()">Cancel</button>
          <button
            type="submit"
            class="btn btn-primary"
            data-tour="submit-btn"
            [disabled]="!title.trim() || isSubmitting()"
          >
            {{ isSubmitting() ? 'Preparing...' : 'Create Task' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CreateTaskComponent {
  private readonly router = inject(Router);
  private readonly store = inject(TaskStoreService);

  title = '';
  description = '';
  priority: Task['priority'] = 'medium';
  status: Task['status'] = 'open';

  readonly files = signal<File[]>([]);
  readonly isSubmitting = signal(false);

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const next = [...this.files(), ...Array.from(input.files)].slice(0, 8);
    this.files.set(next);
    input.value = '';
  }

  removeFile(index: number): void {
    this.files.update((prev) => prev.filter((_, i) => i !== index));
  }

  async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.title.trim() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    let attachments: Attachment[] = [];
    try {
      attachments = await Promise.all(
        this.files().map((file, index) => fileToAttachment(file, Date.now() + index)),
      );
    } finally {
      this.isSubmitting.set(false);
    }

    this.store.addTask({
      title: this.title,
      description: this.description,
      priority: this.priority,
      status: this.status,
      assignee: null,
      attachments,
    });
    this.router.navigate(['/tasks']);
  }

  cancel(): void {
    this.router.navigate(['/tasks']);
  }

  iconFor(file: File): string {
    return getFileIcon(inferAttachmentCategory(file.name, file.type));
  }

  formatSize(bytes: number): string {
    return formatFileSize(bytes);
  }
}
