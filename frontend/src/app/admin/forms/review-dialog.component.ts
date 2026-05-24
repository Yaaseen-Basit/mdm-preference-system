import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { FormData } from '../../shared/models/models';

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="dialog-title">
        <mat-icon>rate_review</mat-icon>
        <div>
          <h2>Review Form</h2>
          <p>{{ data.student_name }} &mdash; <code>{{ data.prn }}</code></p>
        </div>
      </div>
      <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
    </div>

    <div class="dialog-body">
      <!-- Status Banner -->
      <div class="current-status">
        Current Status: <span class="status-chip" [ngClass]="data.status">{{ data.status }}</span>
        <span class="locked-badge" *ngIf="data.is_locked"><mat-icon>lock</mat-icon> Locked</span>
      </div>

      <!-- Form Details Grid -->
      <div class="detail-grid">
        <div class="detail-section">
          <div class="ds-title">Personal</div>
          <div class="ds-row"><span>Name</span><strong>{{ data.first_name }} {{ data.middle_name }} {{ data.last_name }}</strong></div>
          <div class="ds-row"><span>Father</span><strong>{{ data.father_name }}</strong></div>
          <div class="ds-row"><span>Email</span><strong>{{ data.email }}</strong></div>
          <div class="ds-row"><span>Mobile</span><strong>{{ data.student_mobile }}</strong></div>
          <div class="ds-row"><span>Parent Mob.</span><strong>{{ data.parent_mobile }}</strong></div>
        </div>
        <div class="detail-section">
          <div class="ds-title">Academic</div>
          <div class="ds-row"><span>Branch</span><strong>{{ data.branch }}</strong></div>
          <div class="ds-row"><span>Percentage</span><strong>{{ data.percentage }}%</strong></div>
          <div class="ds-row"><span>SGPA</span><strong>{{ data.sgpa }}</strong></div>
          <div class="ds-row"><span>CGPA</span><strong>{{ data.cgpa }}</strong></div>
          <div class="ds-row"><span>Backlogs</span><strong>{{ data.backlogs }}</strong></div>
        </div>
        <div class="detail-section">
          <div class="ds-title">Preferences</div>
          <div class="ds-row pref-row">
            <span>1st Choice</span><strong class="pref p1">{{ data.preference_1 }}</strong>
          </div>
          <div class="ds-row pref-row">
            <span>2nd Choice</span><strong class="pref p2">{{ data.preference_2 }}</strong>
          </div>
          <div class="ds-row pref-row">
            <span>3rd Choice</span><strong class="pref p3">{{ data.preference_3 }}</strong>
          </div>
          <div class="ds-row"><span>Submitted</span><strong>{{ data.submitted_at | date:'dd MMM yyyy, HH:mm' }}</strong></div>
          <div class="ds-row"><span>Version</span><strong>v{{ data.version }}</strong></div>
        </div>
      </div>

      <!-- Previous Remarks -->
      <div class="prev-remarks" *ngIf="data.admin_remarks">
        <mat-icon>comment</mat-icon>
        <div><strong>Previous Remarks:</strong> {{ data.admin_remarks }}</div>
      </div>

      <!-- Action Section (only if not locked) -->
      <ng-container *ngIf="!data.is_locked">
        <div class="action-section">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Remarks / Correction Notes (optional)</mat-label>
            <textarea matInput [(ngModel)]="remarks" rows="3"
              placeholder="Add notes for the student or record approval reason…"></textarea>
          </mat-form-field>

          <div class="action-buttons">
            <button mat-stroked-button class="btn-reject" (click)="updateStatus('rejected')" [disabled]="loading()">
              <mat-spinner diameter="14" *ngIf="loading() && pendingAction === 'rejected'"></mat-spinner>
              <mat-icon *ngIf="!(loading() && pendingAction === 'rejected')">cancel</mat-icon>
              Reject
            </button>
            <button mat-stroked-button class="btn-correction" (click)="updateStatus('correction_requested')" [disabled]="loading()">
              <mat-spinner diameter="14" *ngIf="loading() && pendingAction === 'correction_requested'"></mat-spinner>
              <mat-icon *ngIf="!(loading() && pendingAction === 'correction_requested')">rate_review</mat-icon>
              Request Correction
            </button>
            <button mat-raised-button class="btn-approve" (click)="updateStatus('approved')" [disabled]="loading()">
              <mat-spinner diameter="14" *ngIf="loading() && pendingAction === 'approved'"></mat-spinner>
              <mat-icon *ngIf="!(loading() && pendingAction === 'approved')">check_circle</mat-icon>
              Approve
            </button>
          </div>
        </div>
      </ng-container>

      <div class="locked-notice" *ngIf="data.is_locked">
        <mat-icon>lock</mat-icon> This form is approved and locked. No further actions can be taken.
      </div>
    </div>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 20px 24px 0; gap: 12px;
    }
    .dialog-title {
      display: flex; align-items: center; gap: 12px;
      mat-icon { font-size: 28px; color: var(--primary); }
      h2 { font-size: 18px; font-weight: 800; color: var(--primary); }
      p  { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
      code { font-family: 'Space Mono', monospace; font-size: 12px; background: var(--bg); padding: 1px 6px; border-radius: 4px; }
    }
    .dialog-body { padding: 16px 24px 24px; }
    .current-status {
      display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
      font-size: 13px; font-weight: 500; color: var(--text-muted);
    }
    .locked-badge {
      display: flex; align-items: center; gap: 4px; font-size: 12px;
      color: var(--danger); font-weight: 700;
      mat-icon { font-size: 14px; }
    }
    .detail-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;
      @media (max-width: 700px) { grid-template-columns: 1fr; }
    }
    .detail-section {
      background: var(--bg); border-radius: var(--radius-sm); padding: 12px 14px;
      border: 1px solid var(--border);
    }
    .ds-title {
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;
      color: var(--primary); margin-bottom: 10px; padding-bottom: 6px;
      border-bottom: 2px solid var(--accent);
    }
    .ds-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 8px; padding: 4px 0; font-size: 12px;
      span { color: var(--text-muted); flex-shrink: 0; }
      strong { color: var(--primary); text-align: right; font-weight: 600; }
    }
    .pref { padding: 1px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }
    .pref.p1 { background: rgba(0,194,255,0.12); color: #0369a1; }
    .pref.p2 { background: rgba(124,58,237,0.1);  color: #6d28d9; }
    .pref.p3 { background: rgba(0,214,143,0.12);  color: #059669; }
    .prev-remarks {
      display: flex; align-items: flex-start; gap: 8px; padding: 10px 14px;
      background: rgba(245,166,35,0.07); border: 1px solid rgba(245,166,35,0.3);
      border-radius: var(--radius-sm); margin-bottom: 14px; font-size: 13px;
      color: #7a4f00;
      mat-icon { font-size: 16px; color: var(--warning); flex-shrink: 0; margin-top: 1px; }
    }
    .action-section { margin-top: 4px; }
    .full-width { width: 100%; }
    .action-buttons {
      display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; flex-wrap: wrap;
    }
    .btn-approve {
      background: var(--success) !important; color: white !important;
      border-radius: 8px !important; font-weight: 700 !important;
      display: flex; align-items: center; gap: 6px;
      mat-icon { font-size: 18px; }
    }
    .btn-reject {
      border-color: var(--danger) !important; color: var(--danger) !important;
      border-radius: 8px !important; font-weight: 600 !important;
      display: flex; align-items: center; gap: 6px;
    }
    .btn-correction {
      border-color: var(--warning) !important; color: #c05621 !important;
      border-radius: 8px !important; font-weight: 600 !important;
      display: flex; align-items: center; gap: 6px;
    }
    .locked-notice {
      display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background: rgba(255,71,87,0.06); border: 1px solid rgba(255,71,87,0.2);
      border-radius: var(--radius-sm); color: #9b2335; font-size: 13px;
      mat-icon { color: var(--danger); }
    }
  `],
})
export class ReviewDialogComponent {
  remarks = '';
  loading = signal(false);
  pendingAction = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FormData,
    private ref: MatDialogRef<ReviewDialogComponent>,
    private api: ApiService,
    private snack: SnackbarService,
  ) {
    this.remarks = data.admin_remarks || '';
  }

  updateStatus(status: string): void {
    this.loading.set(true);
    this.pendingAction = status;
    this.api.updateFormStatus(this.data.id!, status, this.remarks || undefined).subscribe({
      next: () => {
        this.snack.success(`Form ${status.replace('_', ' ')} successfully`);
        this.loading.set(false);
        this.ref.close(true);
      },
      error: (e) => {
        this.snack.error(e.error?.detail || 'Action failed');
        this.loading.set(false);
        this.pendingAction = '';
      },
    });
  }

  close(): void { this.ref.close(false); }
}
