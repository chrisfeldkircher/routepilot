import { Injectable, computed, signal } from '@angular/core';
import { INITIAL_TASKS, type Attachment, type Comment, type Task } from './data';

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly _tasks = signal<Task[]>(INITIAL_TASKS.map((t) => ({ ...t })));

  readonly tasks = this._tasks.asReadonly();

  readonly stats = computed(() => {
    const tasks = this._tasks();
    return {
      total: tasks.length,
      open: tasks.filter((t) => t.status === 'open').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      review: tasks.filter((t) => t.status === 'review').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
  });

  getTask(id: number): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'comments'>): void {
    const tasks = this._tasks();
    const id = Math.max(0, ...tasks.map((t) => t.id)) + 1;
    const newTask: Task = {
      ...task,
      id,
      createdAt: new Date().toISOString(),
      comments: [],
    };
    this._tasks.set([...tasks, newTask]);
  }

  updateTask(id: number, patch: Partial<Task>): void {
    this._tasks.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }

  addComment(taskId: number, comment: Omit<Comment, 'id' | 'createdAt'>): void {
    this._tasks.update((tasks) =>
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [
                ...t.comments,
                {
                  ...comment,
                  id: Date.now() + Math.floor(Math.random() * 1000),
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : t,
      ),
    );
  }

  addAttachment(taskId: number, attachment: Attachment): void {
    this._tasks.update((tasks) =>
      tasks.map((t) =>
        t.id === taskId
          ? { ...t, attachments: [...t.attachments, attachment] }
          : t,
      ),
    );
  }
}
