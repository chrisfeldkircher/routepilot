import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/choose-story.component').then((m) => m.ChooseStoryComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./pages/task-list.component').then((m) => m.TaskListComponent),
  },
  {
    path: 'tasks/new',
    loadComponent: () =>
      import('./pages/create-task.component').then(
        (m) => m.CreateTaskComponent,
      ),
  },
  {
    path: 'tasks/:id',
    loadComponent: () =>
      import('./pages/task-detail.component').then(
        (m) => m.TaskDetailComponent,
      ),
  },
  {
    path: 'pickup',
    loadComponent: () =>
      import('./pages/pickup.component').then((m) => m.PickupComponent),
  },
  {
    path: 'import',
    loadComponent: () =>
      import('./pages/import.component').then((m) => m.ImportComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings.component').then((m) => m.SettingsComponent),
  },
];
