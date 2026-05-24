import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

import { ToolbarComponent } from '../../shared/components/toolbar.component';
import { ApiService } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { RegistryEntry } from '../../shared/models/models';

@Component({
  selector: 'app-registry',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ToolbarComponent,
  ],
  templateUrl: './registry.component.html',
  styleUrls: ['./registry.component.scss'],
})
export class RegistryComponent implements OnInit {
  registry = signal<RegistryEntry[]>([]);
  filtered = signal<RegistryEntry[]>([]);
  loading = signal(true);
  uploading = signal(false);

  uploadResult = signal<{
    inserted: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  dragOver = signal(false);
  search = '';

  constructor(
    private api: ApiService,
    private snack: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadRegistry();
  }

  loadRegistry(): void {
    this.api.getRegistry().subscribe({
      next: (r) => {
        this.registry.set(r);
        this.filtered.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snack.error('Failed to load registry');
      },
    });
  }

  onSearch(): void {
    const q = this.search.toLowerCase();

    this.filtered.set(
      q
        ? this.registry().filter(
            (r) =>
              r.name.toLowerCase().includes(q) ||
              r.prn.toLowerCase().includes(q) ||
              r.branch.toLowerCase().includes(q)
          )
        : [...this.registry()]
    );
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files?.length) {
      this.uploadFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);

    const file = event.dataTransfer?.files[0];

    if (file) {
      this.uploadFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }

  uploadFile(file: File): void {
    const valid =
      file.name.endsWith('.csv') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');

    if (!valid) {
      this.snack.error('Only CSV or Excel files accepted');
      return;
    }

    this.uploading.set(true);
    this.uploadResult.set(null);

    this.api.uploadRegistry(file).subscribe({
      next: (res) => {
        this.uploadResult.set(res);
        this.uploading.set(false);

        this.snack.success(
          `Uploaded: ${res.inserted} inserted, ${res.skipped} skipped`
        );

        this.loadRegistry();
      },
      error: (e) => {
        this.uploading.set(false);

        this.snack.error(
          e.error?.detail || 'Upload failed'
        );
      },
    });
  }

  get totalRegistered(): number {
    return this.registry().filter((r) => r.is_registered).length;
  }

  get totalUnregistered(): number {
    return this.registry().filter((r) => !r.is_registered).length;
  }

// downloadSampleCsv(): void {

//   this.api.getRegistry().subscribe({
//     next: (students) => {

//       if (!students || students.length === 0) {
//         this.snack.error('No registry data found');
//         return;
//       }

//       // CSV Header
//       let csv =
//         'Sr.No.,Name of the Students,PRN NO,Branch\n';

//       // Dynamic DB Data
//       students.forEach((s: any, index: number) => {

//         csv +=
//           `${s.sr_no || index + 1},` +
//           `"${s.name}",` +
//           `${s.prn},` +
//           `"${s.branch}"\n`;

//       });

//       // Create File
//       const blob = new Blob(
//         [csv],
//         { type: 'text/csv;charset=utf-8;' }
//       );

//       const url = URL.createObjectURL(blob);

//       const a = document.createElement('a');
//       a.href = url;
//       a.download = 'registry_export.csv';
//       a.click();

//       URL.revokeObjectURL(url);

//       this.snack.success('Registry CSV downloaded');

//     },

//     error: () => {
//       this.snack.error('Failed to download registry data');
//     }
//   });
// }
downloadSampleCsv(): void {
    this.api.getRegistry().subscribe({
      next: (students) => {
        if (!students || students.length === 0) {
          this.snack.error('No registry data found');
          return;
        }

        // CSV Header
        let csv = 'Sr.No.,Name of the Students,PRN NO,Branch\n';

        // Dynamic DB Data
        students.forEach((s: any, index: number) => {
          // EXCEL FIX: Prefix the PRN with =" and wrap it in quotes
          // This creates a standard Excel text-literal formula: ="2502112111191050"
          const formattedPrn = `="${s.prn}"`;

          csv +=
            `${s.sr_no || index + 1},` +
            `"${s.name}",` +
            `${formattedPrn},` +
            `"${s.branch}"\n`;
        });

        // Create File with UTF-8 BOM to help Excel detect column structures cleanly
        const blob = new Blob(
          ['\ufeff' + csv], 
          { type: 'text/csv;charset=utf-8;' }
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'registry_export.csv';
        a.click();

        URL.revokeObjectURL(url);
        this.snack.success('Registry CSV downloaded');
      },
      error: (e: any) => {
        this.snack.error('Failed to download registry data');
      }
    });
  }
}