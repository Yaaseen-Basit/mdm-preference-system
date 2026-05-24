import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar.component';

@Component({
  selector: 'app-student-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="shell">
      <app-sidebar [navItems]="navItems" />
      <div class="shell-content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .shell { display: flex; min-height: 100vh; background: var(--bg); }
    .shell-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
  `],
})
export class StudentShellComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard',   icon: 'dashboard',      route: '/student/dashboard' },
    { label: 'My Form',     icon: 'assignment',      route: '/student/form'      },
    { label: 'History',     icon: 'history',         route: '/student/history'   },
  ];
}
