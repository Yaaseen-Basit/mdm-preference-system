import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { ToolbarComponent } from '../../shared/components/toolbar.component';
import { ApiService } from '../../shared/services/api.service';
import { CorrectionHistory } from '../../shared/models/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatProgressSpinnerModule,
    MatCardModule, MatExpansionModule, ToolbarComponent,
  ],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {
  history = signal<CorrectionHistory[]>([]);
  loading = signal(true);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getStudentHistory().subscribe({
      next: (h) => { this.history.set(h); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getIcon(action: string): string {
    const m: Record<string, string> = {
      submitted: 'send', approved: 'check_circle', rejected: 'cancel',
      correction_requested: 'rate_review', resubmitted: 'replay', draft: 'save',
    };
    return m[action] || 'history';
  }

  getLabel(action: string): string {
    const m: Record<string, string> = {
      submitted: 'Form Submitted', approved: 'Approved by Admin',
      rejected: 'Rejected by Admin', correction_requested: 'Correction Requested',
      resubmitted: 'Form Resubmitted', draft: 'Draft Saved',
    };
    return m[action] || action;
  }

  getChangedFields(old: any, nw: any): { field: string; from: any; to: any }[] {
    if (!old || !nw) return [];
    return Object.keys(nw)
      .filter(k => old[k] !== undefined && old[k] !== nw[k])
      .map(k => ({ field: k.replace(/_/g, ' '), from: old[k], to: nw[k] }));
  }
}
