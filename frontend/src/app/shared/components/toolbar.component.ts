import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatBadgeModule],
  template: `
    <header class="toolbar">
      <div class="toolbar-left">
        <div class="breadcrumb">
          <span class="breadcrumb-root">{{ root }}</span>
          <mat-icon class="sep">chevron_right</mat-icon>
          <span class="breadcrumb-current">{{ title }}</span>
        </div>
      </div>
      <div class="toolbar-right">
        <div class="system-badge">
          <span class="dot"></span>
          System Online
        </div>
        <div class="time">{{ timeString() }}</div>
      </div>
    </header>
  `,
  styles: [`
    .toolbar {
      height: 60px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
    }
    .breadcrumb-root { color: var(--text-muted); font-weight: 400; }
    .sep { font-size: 16px; color: var(--border-dark); }
    .breadcrumb-current { color: var(--primary); font-weight: 600; }
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .system-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--success);
      font-weight: 600;
      background: rgba(0,214,143,0.1);
      padding: 4px 12px;
      border-radius: 20px;
    }
    .dot {
      width: 7px;
      height: 7px;
      background: var(--success);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .time {
      font-size: 13px;
      color: var(--text-muted);
      font-family: 'Space Mono', monospace;
      font-weight: 400;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class ToolbarComponent implements OnInit, OnDestroy {
  @Input() title = '';
  @Input() root = 'MDM System';

  //  1. Declare a signal with an initial timestamp state
  timeString = signal<string>(this.getFormattedTime());
  private timerId: any;

  ngOnInit(): void {
    // 2. Set up a predictable timer loop that updates the signal
    this.timerId = setInterval(() => {
      this.timeString.set(this.getFormattedTime());
    }, 1000);
  }

  ngOnDestroy(): void {
    // 3. Always clean up resource intervals to prevent memory leaks
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private getFormattedTime(): string {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}