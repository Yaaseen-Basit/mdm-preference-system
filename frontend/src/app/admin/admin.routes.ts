import { Routes } from '@angular/router';
import { AdminShellComponent } from './shared/admin-shell.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'students',
        loadComponent: () => import('./students/students.component').then(m => m.StudentsComponent),
      },
      {
        path: 'forms',
        loadComponent: () => import('./forms/forms.component').then(m => m.FormsComponent),
      },
      {
        path: 'corrections',
        loadComponent: () => import('./corrections/corrections.component').then(m => m.CorrectionsComponent),
      },
      {
        path: 'registry',
        loadComponent: () => import('./registry/registry.component').then(m => m.RegistryComponent),
      },
    ],
  },
];
