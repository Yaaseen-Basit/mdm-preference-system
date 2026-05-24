import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar.component';
import { ToolbarComponent } from '../../shared/components/toolbar.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ToolbarComponent],
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
export class AdminShellComponent {
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Students', icon: 'people', route: '/admin/students' },
    { label: 'Forms & Review', icon: 'assignment', route: '/admin/forms' },
    { label: 'Corrections', icon: 'rate_review', route: '/admin/corrections' },
    { label: 'Registry Upload', icon: 'upload_file', route: '/admin/registry' },
  ];
}
