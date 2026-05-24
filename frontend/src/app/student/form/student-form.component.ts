import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { ToolbarComponent } from '../../shared/components/toolbar.component';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

function mobileValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value || '').toString().trim();
  return /^[6-9]\d{9}$/.test(v) ? null : { invalidMobile: true };
}

function nameValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value || '').toString().trim();
  return /^[A-Za-z\s]+$/.test(v) ? null : { invalidName: true };
}

function noDuplicatePrefs(group: AbstractControl): ValidationErrors | null {
  const p1Control = group.get('preference_1');
  const p2Control = group.get('preference_2');
  const p3Control = group.get('preference_3');

  const p1 = p1Control?.value;
  const p2 = p2Control?.value;
  const p3 = p3Control?.value;

  // Clear existing duplicate errors to prevent stale error locks
  [p2Control, p3Control].forEach(control => {
    if (control?.hasError('duplicateWith')) {
      const errors = { ...control.errors };
      delete errors['duplicateWith'];
      control.setErrors(Object.keys(errors).length ? errors : null);
    }
  });

  // Cross-evaluate preference fields for duplicates
  if (p2 && p1 === p2) {
    p2Control?.setErrors({ ...p2Control.errors, duplicateWith: 1 });
  }

  if (p3) {
    if (p3 === p1) {
      p3Control?.setErrors({ ...p3Control.errors, duplicateWith: 1 });
    } else if (p3 === p2) {
      p3Control?.setErrors({ ...p3Control.errors, duplicateWith: 2 });
    }
  }

  // Set form-level status flag if a duplicate exists anywhere
  if ((p1 && p2 && p1 === p2) || (p1 && p3 && p1 === p3) || (p2 && p3 && p2 === p3)) {
    return { duplicatePrefs: true };
  }

  return null;
}

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDialogModule, MatStepperModule, MatChipsModule, ToolbarComponent,
  ],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss'],
})
export class StudentFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  eligibleSubjects = signal<string[]>([]);
  existingForm = signal<any>(null);
  branch = signal('');
  loading = signal(true);
  saving = signal(false);
  submitting = signal(false);
  isResubmit = signal(false);
  autoSaveMsg = signal('');
  private autoSaveSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    public auth: AuthService,
    private snack: SnackbarService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.api.getStudentForm().subscribe({
      next: (res) => {
        this.eligibleSubjects.set(res.eligible_subjects || []);
        this.branch.set(res.branch || '');
        if (res.form) {
          this.existingForm.set(res.form);
          this.isResubmit.set(res.form.status === 'correction_requested');
          this.patchForm(res.form);
        }
        this.loading.set(false);
        this.setupAutoSave();
      },
      error: () => this.loading.set(false),
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      prn:            [{ value: '', disabled: true }, Validators.required], // Identity Protection Locked Field
      first_name:     ['', [Validators.required, nameValidator]],
      middle_name:    [''],
      last_name:      ['', [Validators.required, nameValidator]],
      father_name:    ['', [Validators.required, nameValidator]],
      email:          ['', [Validators.required, Validators.email]],
      student_mobile: ['', [Validators.required, mobileValidator]],
      parent_mobile:  ['', [Validators.required, mobileValidator]],
      percentage:     [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      sgpa:           [null, [Validators.required, Validators.min(0), Validators.max(10)]],
      cgpa:           [null, [Validators.required, Validators.min(0), Validators.max(10)]],
      backlogs:       [0,    [Validators.required, Validators.min(0)]],
      preference_1:   ['', Validators.required],
      preference_2:   ['', Validators.required],
      preference_3:   ['', Validators.required],
    }, { validators: noDuplicatePrefs });
  }

  private patchForm(data: any): void {
    this.form.patchValue({
      prn: data.prn, // Assign verified identity key
      first_name: data.first_name, middle_name: data.middle_name,
      last_name: data.last_name, father_name: data.father_name,
      email: data.email, student_mobile: data.student_mobile,
      parent_mobile: data.parent_mobile, percentage: data.percentage,
      sgpa: data.sgpa, cgpa: data.cgpa, backlogs: data.backlogs,
      preference_1: data.preference_1, preference_2: data.preference_2,
      preference_3: data.preference_3,
    });
    if (this.existingForm()?.is_locked) this.form.disable();
  }

  private setupAutoSave(): void {
    if (this.existingForm()?.is_locked) return;
    this.autoSaveSub = this.form.valueChanges.pipe(
      debounceTime(3000),
      distinctUntilChanged(),
    ).subscribe(() => {
      if (this.form.valid) this.saveDraft(true);
    });
  }

  saveDraft(silent = false): void {
    if (this.form.invalid) { if (!silent) this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    
    // Retain the locked PRN value inside data submission payload
    const payload = this.form.getRawValue();

    this.api.saveDraft(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.autoSaveMsg.set('Draft auto-saved ' + new Date().toLocaleTimeString());
        if (!silent) this.snack.info('Draft saved successfully');
      },
      error: (e) => {
        this.saving.set(false);
        if (!silent) this.snack.error(e.error?.detail || 'Save failed');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);

    // Retain the locked PRN value inside data submission payload
    const payload = this.form.getRawValue();

    const call = this.isResubmit()
      ? this.api.resubmitForm(payload)
      : this.api.submitForm(payload);
    call.subscribe({
      next: () => {
        this.snack.success(this.isResubmit() ? 'Form resubmitted successfully!' : 'Form submitted successfully!');
        this.submitting.set(false);
      },
      error: (e) => {
        this.snack.error(e.error?.detail || 'Submission failed');
        this.submitting.set(false);
      },
    });
  }

  getAvailablePrefs(exclude: string[]): string[] {
    return this.eligibleSubjects().filter(s => !exclude.includes(s));
  }

  fieldError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(error) && (c.dirty || c.touched));
  }

  getDuplicateTarget(field: string): number | null {
    const control = this.form.get(field);
    return control?.errors?.['duplicateWith'] || null;
  }

  get isLocked(): boolean { return !!this.existingForm()?.is_locked; }
  get adminRemarks(): string { return this.existingForm()?.admin_remarks || ''; }
  get hasDuplicates(): boolean { return !!this.form.errors?.['duplicatePrefs']; }

  ngOnDestroy(): void { this.autoSaveSub?.unsubscribe(); }
}