import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ToolbarComponent } from '../../shared/components/toolbar.component';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';
import { FormData, CorrectionHistory } from '../../shared/models/models';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    ToolbarComponent,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss'],
})
export class StudentDashboardComponent implements OnInit {
  form = signal<FormData | null>(null);
  history = signal<CorrectionHistory[]>([]);
  eligibleSubjects = signal<string[]>([]);
  branch = signal('');
  loading = signal(true);

  statusSteps = computed(() => {
    const currentStatus = this.form()?.status;
    const steps = [
      { label: 'Draft Saved', key: ['draft', 'submitted', 'approved', 'rejected', 'correction_requested'] },
      { label: 'Form Submitted', key: ['submitted', 'approved', 'rejected', 'correction_requested'] },
      { label: 'Under Review', key: ['approved', 'rejected', 'correction_requested'] },
      { label: 'Decision Made', key: ['approved', 'rejected'] },
    ];

    return steps.map((step, i) => ({
      label: step.label,
      done: currentStatus ? step.key.includes(currentStatus) : false,
      active: currentStatus ? (step.key.includes(currentStatus) && !steps[i + 1]?.key.includes(currentStatus ?? '')) : false,
    }));
  });

  canEdit = computed(() => {
    const s = this.form()?.status;
    return !s || s === 'draft' || s === 'correction_requested';
  });

  statusClass = computed(() => this.form()?.status || 'draft');

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.api.getStudentForm().subscribe({
      next: (res) => {
        this.form.set(res.form);
        this.eligibleSubjects.set(res.eligible_subjects || []);
        this.branch.set(res.branch || '');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api.getStudentHistory().subscribe({
      next: (h) => this.history.set(h),
    });
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      submitted: 'Form Submitted',
      approved: 'Approved by Admin',
      rejected: 'Rejected by Admin',
      correction_requested: 'Correction Requested',
      resubmitted: 'Resubmitted',
      draft: 'Draft Saved',
    };
    return labels[action] || action;
  }
}