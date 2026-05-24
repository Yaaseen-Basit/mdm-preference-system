import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../shared/services/auth.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <mat-icon>school</mat-icon>
          </div>
          <div class="logo-text" *ngIf="!collapsed()">
            <span class="logo-name">MDM</span>
            <span class="logo-sub">Smart Allocation</span>
          </div>
        </div>
        <button class="collapse-btn" (click)="toggleCollapse()">
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>

      <div class="user-card" *ngIf="!collapsed()">
        <div class="user-avatar">{{ userInitials }}</div>
        <div class="user-info">
          <span class="user-name">{{ user?.full_name }}</span>
          <span class="user-role">{{ user?.role | titlecase }}</span>
        </div>
      </div>

      <nav class="nav-menu">
        <a
          *ngFor="let item of navItems"
          [routerLink]="item.route"
          routerLinkActive="active"
          class="nav-item"
          [matTooltip]="collapsed() ? item.label : ''"
          matTooltipPosition="right"
        >
          <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
          <span class="nav-label" *ngIf="!collapsed()">{{ item.label }}</span>
          <span class="nav-badge" *ngIf="item.badge && !collapsed()">{{ item.badge }}</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" (click)="logout()" [matTooltip]="collapsed() ? 'Logout' : ''" matTooltipPosition="right">
          <mat-icon>logout</mat-icon>
          <span *ngIf="!collapsed()">Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      min-height: 100vh;
      background: var(--primary);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: relative;
      flex-shrink: 0;
      &.collapsed { width: 72px; }
    }
    .sidebar-header {
      padding: 20px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      background: var(--accent);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { color: var(--primary); font-size: 22px; }
    }
    .logo-text {
      display: flex;
      flex-direction: column;
    }
    .logo-name {
      font-size: 18px;
      font-weight: 800;
      color: white;
      letter-spacing: 2px;
    }
    .logo-sub {
      font-size: 10px;
      color: var(--accent);
      font-weight: 500;
      letter-spacing: 0.5px;
      margin-top: -2px;
    }
    .collapse-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      transition: background 0.2s;
      flex-shrink: 0;
      mat-icon { font-size: 18px; }
      &:hover { background: rgba(255,255,255,0.2); }
    }
    .user-card {
      margin: 16px;
      padding: 12px;
      background: rgba(255,255,255,0.08);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      background: var(--accent);
      color: var(--primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: white;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 130px;
    }
    .user-role {
      font-size: 11px;
      color: var(--accent);
      font-weight: 500;
    }
    .nav-menu {
      flex: 1;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 12px;
      border-radius: var(--radius-sm);
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
      position: relative;
      white-space: nowrap;
      overflow: hidden;
      &:hover {
        background: rgba(255,255,255,0.1);
        color: white;
      }
      &.active {
        background: var(--accent);
        color: var(--primary);
        font-weight: 700;
        .nav-icon { color: var(--primary); }
      }
    }
    .nav-icon { font-size: 20px; flex-shrink: 0; }
    .nav-label { flex: 1; }
    .nav-badge {
      background: var(--danger);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      min-width: 20px;
      text-align: center;
    }
    .sidebar-footer {
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: rgba(255,75,87,0.15);
      border: 1px solid rgba(255,75,87,0.3);
      border-radius: var(--radius-sm);
      color: #FF8A8A;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      font-family: 'DM Sans', sans-serif;
      &:hover { background: rgba(255,75,87,0.3); color: white; }
      mat-icon { font-size: 20px; flex-shrink: 0; }
    }
    .collapsed .sidebar-header { justify-content: center; padding: 20px 16px; }
    .collapsed .sidebar-footer .logout-btn { justify-content: center; }
  `]
})
export class SidebarComponent {
  @Input() navItems: NavItem[] = [];

  collapsed = signal(false);

  constructor(private auth: AuthService) {}

  get user() { return this.auth.currentUser(); }
  get userInitials(): string {
    const name = this.user?.full_name || '';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  toggleCollapse(): void { this.collapsed.update(v => !v); }
  logout(): void { this.auth.logout(); }
}
