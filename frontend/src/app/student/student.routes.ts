import { Routes } from '@angular/router';
import { StudentShellComponent } from './shared/student-shell.component';

export const studentRoutes: Routes = [
  {
    path: '',
    component: StudentShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
      },
      {
        path: 'form',
        loadComponent: () => import('./form/student-form.component').then(m => m.StudentFormComponent),
      },
      {
        path: 'history',
        loadComponent: () => import('./history/history.component').then(m => m.HistoryComponent),
      },
    ],
  },
];
