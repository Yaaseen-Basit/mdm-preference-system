import { Component, OnInit, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { ToolbarComponent } from '../../shared/components/toolbar.component';
import { ApiService } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snackbar.service'; // Imported Snackbar
import { DashboardStats, FormData as StudentFormData } from '../../shared/models/models'; // Aliased FormData
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatProgressBarModule, RouterModule,
    ToolbarComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef<HTMLCanvasElement>;

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  private charts: Chart[] = [];

  // Injected SnackbarService into the constructor
  constructor(
    private api: ApiService,
    private snack: SnackbarService 
  ) {}

  ngOnInit(): void {
    this.api.getDashboard().subscribe({
      next: (d) => { this.stats.set(d); this.loading.set(false); },
      error: (e: any) => {
        this.loading.set(false);
        this.snack.error('Failed to load dashboard statistics');
      },
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => { if (this.stats()) this.initCharts(); }, 300);
  }

  private initCharts(): void {
    const d = this.stats()!;
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    // Status bar chart
    if (this.barChartRef) {
      const ctx = this.barChartRef.nativeElement.getContext('2d')!;
      this.charts.push(new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Pending', 'Approved', 'Rejected', 'Correction'],
          datasets: [{
            label: 'Forms',
            data: [d.pending_forms, d.approved_forms, d.rejected_forms, d.correction_requested],
            backgroundColor: ['#00C2FF', '#00D68F', '#FF4757', '#F5A623'],
            borderRadius: 8,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: 'DM Sans' } } },
            x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', weight: 600 } } },
          },
        },
      }));
    }

    // Branch pie chart
    if (this.pieChartRef && d.branch_distribution.length) {
      const ctx = this.pieChartRef.nativeElement.getContext('2d')!;
      const colors = ['#002147','#00C2FF','#00D68F','#F5A623','#FF4757','#FF6B35','#7C3AED','#0EA5E9'];
      this.charts.push(new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: d.branch_distribution.map(b => b.branch),
          datasets: [{
            data: d.branch_distribution.map(b => b.count),
            backgroundColor: colors.slice(0, d.branch_distribution.length),
            borderWidth: 3, borderColor: '#fff',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { position: 'right', labels: { font: { family: 'DM Sans', size: 12 }, padding: 16 } },
          },
        },
      }));
    }

    // Weekly submissions line chart
    if (this.weeklyChartRef && d.weekly_submissions.length) {
      const ctx = this.weeklyChartRef.nativeElement.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 0, 200);
      grad.addColorStop(0, 'rgba(0,194,255,0.3)');
      grad.addColorStop(1, 'rgba(0,194,255,0)');
      this.charts.push(new Chart(ctx, {
        type: 'line',
        data: {
          labels: d.weekly_submissions.map(w => w.day),
          datasets: [{
            label: 'Submissions',
            data: d.weekly_submissions.map(w => w.count),
            borderColor: '#00C2FF',
            backgroundColor: grad,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#00C2FF',
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2.5,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: 'DM Sans' } } },
            x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', weight: 600 } } },
          },
        },
      }));
    }
  }

  getStatusLabel(s: string): string {
    const m: Record<string, string> = {
      submitted: 'Pending Review', approved: 'Approved',
      rejected: 'Rejected', correction_requested: 'Needs Correction', draft: 'Draft',
    };
    return m[s] || s;
  }

  get completionRate(): number {
    const d = this.stats();
    if (!d || !d.total_submitted) return 0;
    return Math.round((d.approved_forms / d.total_submitted) * 100);
  }

  downloadStudentPreferencesCsv(): void {
    this.loading.set(true);
    
    // Changed this.api.getFormsData() to match your service method getForms()
    this.api.getForms().subscribe({
      next: (forms: StudentFormData[]) => {
        this.loading.set(false);

        if (!forms || forms.length === 0) {
          this.snack.error('No student preference forms found to export');
          return;
        }

        let csvContent = 'Sr.No.,PRN,Student Name,Email,Mobile,Branch,CGPA,Preference 1,Preference 2,Preference 3,Status\n';

        forms.forEach((form: StudentFormData, index: number) => {
          const protectedPrn = `="${form.prn || ''}"`;
          const fullName = form.student_name || `${form.first_name || ''} ${form.last_name || ''}`.trim();
          
          const safeName = `"${fullName.replace(/"/g, '""')}"`;
          const safeEmail = `"${(form.email || '').replace(/"/g, '""')}"`;
          const safeBranch = `"${(form.branch || '').replace(/"/g, '""')}"`;
          const safePref1 = `"${(form.preference_1 || '').replace(/"/g, '""')}"`;
          const safePref2 = `"${(form.preference_2 || '').replace(/"/g, '""')}"`;
          const safePref3 = `"${(form.preference_3 || '').replace(/"/g, '""')}"`;

          csvContent += 
            `${index + 1},` +
            `${protectedPrn},` +
            `${safeName},` +
            `${safeEmail},` +
            `'${form.student_mobile || ''},` +
            `${safeBranch},` +
            `${form.cgpa || 0},` +
            `${safePref1},` +
            `${safePref2},` +
            `${safePref3},` +
            `"${form.status || 'Submitted'}"\n`;
        });

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = `student_preference_allocations_${new Date().toISOString().split('T')[0]}.csv`;
        anchor.click();

        URL.revokeObjectURL(downloadUrl);
        this.snack.success('Student preference records exported!');
      },
      error: (e: any) => {
        this.loading.set(false);
        this.snack.error(e.error?.detail || 'Failed to download student preferences list');
      }
    });
  }
}