import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ToolbarComponent } from '../../shared/components/toolbar.component';
import { ApiService } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { FormData } from '../../shared/models/models';
import { ReviewDialogComponent } from './review-dialog.component';

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDialogModule, MatProgressSpinnerModule,
    MatChipsModule, ToolbarComponent,
  ],
  templateUrl: './forms.component.html',
  styleUrls: ['./forms.component.scss'],
})
export class FormsComponent implements OnInit {
  forms = signal<FormData[]>([]);
  filtered = signal<FormData[]>([]);
  loading = signal(true);
  statusFilter = '';
  search = '';

  readonly statuses = [
    { value: '', label: 'All' },
    { value: 'submitted', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'correction_requested', label: 'Correction' },
    { value: 'draft', label: 'Draft' },
  ];

  constructor(private api: ApiService, private dialog: MatDialog, private snack: SnackbarService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getForms(this.statusFilter || undefined).subscribe({
      next: (d) => { this.forms.set(d); this.applySearch(); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  applySearch(): void {
    const q = this.search.toLowerCase();
    this.filtered.set(q
      ? this.forms().filter(f =>
          f.student_name?.toLowerCase().includes(q) ||
          f.prn?.toLowerCase().includes(q) ||
          f.branch?.toLowerCase().includes(q)
        )
      : [...this.forms()]
    );
  }

  openReview(form: FormData): void {
    const ref = this.dialog.open(ReviewDialogComponent, {
      width: '720px', maxWidth: '96vw', data: form, disableClose: false,
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  get pendingCount(): number { return this.forms().filter(f => f.status === 'submitted').length; }
  get approvedCount(): number { return this.forms().filter(f => f.status === 'approved').length; }
}
