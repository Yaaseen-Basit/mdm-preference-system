import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ToolbarComponent } from '../../shared/components/toolbar.component';
import { ApiService } from '../../shared/services/api.service';
import { ProcessedHistory } from '../../shared/models/models';

@Component({
  selector: 'app-corrections',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatExpansionModule, MatProgressSpinnerModule,
    FormsModule, ToolbarComponent,
  ],
  templateUrl: './corrections.component.html',
  styleUrls: ['./corrections.component.scss'],
})
export class CorrectionsComponent implements OnInit {
  
  history = signal<ProcessedHistory[]>([]);
  loading = signal(true);
  search = signal(''); // Turn search into a signal to make it cleanly reactive

  // Automatically computes the filtered records down whenever 'history' or 'search' signals change
  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const allHistory = this.history();
    
    if (!q) {
      return allHistory;
    }
    
    return allHistory.filter(h =>
      h.changed_by_name?.toLowerCase().includes(q) ||
      h.action?.toLowerCase().includes(q)
    );
  });

  private iconMap: Record<string, string> = {
    submitted: 'send', approved: 'check_circle', rejected: 'cancel',
    correction_requested: 'rate_review', resubmitted: 'replay',
  };

  private labelMap: Record<string, string> = {
    submitted: 'Submitted', approved: 'Approved', rejected: 'Rejected',
    correction_requested: 'Correction Requested', resubmitted: 'Resubmitted',
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getCorrectionHistory().subscribe({
      next: (rawHistory) => {
        if (!rawHistory) {
          this.history.set([]);
          this.loading.set(false);
          return;
        }

        const processed = rawHistory.map(h => ({
          ...h,
          icon: this.iconMap[h.action] || 'history',
          actionLabel: this.labelMap[h.action] || h.action,
          changes: this.calculateChanges(h.old_data, h.new_data)
        }));

        this.history.set(processed);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private calculateChanges(old: any, nw: any): { field: string; from: string; to: string }[] {
    if (!old || !nw) return [];
    return Object.keys(nw)
      .filter(k => old[k] !== undefined && String(old[k]) !== String(nw[k]))
      .map(k => ({ 
        field: k.replace(/_/g, ' '), 
        from: String(old[k] ?? ''), 
        to: String(nw[k] ?? '') 
      }));
  }
}