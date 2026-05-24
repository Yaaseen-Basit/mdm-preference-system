import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToolbarComponent } from '../../shared/components/toolbar.component';
import { ApiService } from '../../shared/services/api.service';
import { StudentRecord } from '../../shared/models/models';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    FormsModule, RouterModule, ToolbarComponent,
  ],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss'],
})
export class StudentsComponent implements OnInit {
  students = signal<StudentRecord[]>([]);
  filtered = signal<StudentRecord[]>([]);
  loading = signal(true);
  search = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAdminStudents().subscribe({
      next: (d) => { this.students.set(d); this.filtered.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    const q = this.search.toLowerCase().trim();
    this.filtered.set(
      q ? this.students().filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.prn.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.branch.toLowerCase().includes(q)
      ) : this.students()
    );
  }

  statusClass(s?: string): string {
    return s || 'draft';
  }

  get totalApproved(): number { return this.students().filter(s => s.form_status === 'approved').length; }
  get totalPending(): number { return this.students().filter(s => s.form_status === 'submitted').length; }
  get totalNoForm(): number { return this.students().filter(s => !s.form_status).length; }
}
