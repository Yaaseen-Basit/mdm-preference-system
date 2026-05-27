import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

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



/* =========================================================
   VALIDATORS
========================================================= */

function mobileValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value || '').toString().trim();
  return /^[6-9]\d{9}$/.test(v)
    ? null
    : { invalidMobile: true };
}

function nameValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value || '').toString().trim();

  if (!v) return null;

  return /^[A-Za-z\s]+$/.test(v)
    ? null
    : { invalidName: true };
}



/* =========================================================
   DUPLICATE PREFERENCE VALIDATOR
========================================================= */

function noDuplicatePrefs(group: AbstractControl): ValidationErrors | null {

  const p1Control = group.get('preference_1');
  const p2Control = group.get('preference_2');
  const p3Control = group.get('preference_3');

  const p1 = p1Control?.value;
  const p2 = p2Control?.value;
  const p3 = p3Control?.value;

  // Clear old duplicate errors
  [p2Control, p3Control].forEach(control => {

    if (control?.hasError('duplicateWith')) {

      const errors = { ...control.errors };

      delete errors['duplicateWith'];

      control.setErrors(
        Object.keys(errors).length ? errors : null
      );
    }
  });

  // Duplicate checks
  if (p1 && p2 && p1 === p2) {
    p2Control?.setErrors({
      ...p2Control.errors,
      duplicateWith: 1
    });
  }

  if (p3) {

    if (p3 === p1) {
      p3Control?.setErrors({
        ...p3Control.errors,
        duplicateWith: 1
      });

    } else if (p3 === p2) {
      p3Control?.setErrors({
        ...p3Control.errors,
        duplicateWith: 2
      });
    }
  }

  // Form level duplicate error
  if (
    (p1 && p2 && p1 === p2) ||
    (p1 && p3 && p1 === p3) ||
    (p2 && p3 && p2 === p3)
  ) {
    return { duplicatePrefs: true };
  }

  return null;
}



/* =========================================================
   COMPONENT
========================================================= */

@Component({
  selector: 'app-student-form',
  standalone: true,

  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatStepperModule,
    MatChipsModule,

    ToolbarComponent,
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



  /* =========================================================
     INIT
  ========================================================= */

  ngOnInit(): void {

    this.buildForm();

    this.api.getStudentForm().subscribe({

      next: (res) => {

        console.log('API RESPONSE:', res);

        this.eligibleSubjects.set(
          res.eligible_subjects || []
        );

        this.branch.set(
          res.branch || ''
        );

        // =================================================
        // AUTO SET PRN FROM VERIFIED LOGIN USER
        // =================================================

        const verifiedPRN =
          res?.form?.prn ||
          res?.student?.prn ||
          res?.prn ||
          '';

        this.form.get('prn')?.setValue(verifiedPRN);

        // =================================================
        // PATCH EXISTING FORM
        // =================================================

        if (res.form) {

          this.existingForm.set(res.form);

          this.isResubmit.set(
            res.form.status === 'correction_requested'
          );

          this.patchForm(res.form);
        }

        this.loading.set(false);

        this.setupAutoSave();
      },

      error: () => {
        this.loading.set(false);
      },
    });
  }



  /* =========================================================
     BUILD FORM
  ========================================================= */

  private buildForm(): void {

    this.form = this.fb.group({

      // LOCKED VERIFIED PRN FIELD
      prn: [
        {
          value: '',
          disabled: true
        },
        Validators.required
      ],

      first_name: [
        '',
        [Validators.required, nameValidator]
      ],

      middle_name: [''],

      last_name: [
        '',
        [Validators.required, nameValidator]
      ],

      father_name: [
        '',
        [Validators.required, nameValidator]
      ],

      email: [
        '',
        [Validators.required, Validators.email]
      ],

      student_mobile: [
        '',
        [Validators.required, mobileValidator]
      ],

      parent_mobile: [
        '',
        [Validators.required, mobileValidator]
      ],

      percentage: [
        null,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(100)
        ]
      ],

      sgpa: [
        null,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(10)
        ]
      ],

      cgpa: [
        null,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(10)
        ]
      ],

      backlogs: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      preference_1: [
        '',
        Validators.required
      ],

      preference_2: [
        '',
        Validators.required
      ],

      preference_3: [
        '',
        Validators.required
      ],

    }, {
      validators: noDuplicatePrefs
    });
  }



  /* =========================================================
     PATCH EXISTING FORM
  ========================================================= */

  private patchForm(data: any): void {

    // IMPORTANT:
    // Disabled controls must be set separately

    this.form.get('prn')?.setValue(data?.prn || '');

    this.form.patchValue({

      first_name: data.first_name,
      middle_name: data.middle_name,

      last_name: data.last_name,

      father_name: data.father_name,

      email: data.email,

      student_mobile: data.student_mobile,

      parent_mobile: data.parent_mobile,

      percentage: data.percentage,

      sgpa: data.sgpa,

      cgpa: data.cgpa,

      backlogs: data.backlogs,

      preference_1: data.preference_1,

      preference_2: data.preference_2,

      preference_3: data.preference_3,
    });

    // LOCK ENTIRE FORM IF APPROVED

    if (data?.is_locked) {
      this.form.disable();
    }
  }



  /* =========================================================
     AUTO SAVE
  ========================================================= */

  private setupAutoSave(): void {

    if (this.existingForm()?.is_locked) {
      return;
    }

    this.autoSaveSub = this.form.valueChanges.pipe(

      debounceTime(3000),

      distinctUntilChanged(),

    ).subscribe(() => {

      if (this.form.valid) {
        this.saveDraft(true);
      }
    });
  }



  /* =========================================================
     SAVE DRAFT
  ========================================================= */

  saveDraft(silent = false): void {

    if (this.form.invalid) {

      if (!silent) {
        this.form.markAllAsTouched();
      }

      return;
    }

    this.saving.set(true);

    // IMPORTANT:
    // getRawValue() includes disabled PRN field

    const payload = this.form.getRawValue();

    console.log('SAVE PAYLOAD:', payload);

    this.api.saveDraft(payload).subscribe({

      next: () => {

        this.saving.set(false);

        this.autoSaveMsg.set(
          'Draft auto-saved at ' +
          new Date().toLocaleTimeString()
        );

        if (!silent) {
          this.snack.info('Draft saved successfully');
        }
      },

      error: (e) => {

        this.saving.set(false);

        this.snack.error(
          e.error?.detail || 'Save failed'
        );
      },
    });
  }



  /* =========================================================
     SUBMIT
  ========================================================= */

  submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    this.submitting.set(true);

    // IMPORTANT:
    // Includes disabled PRN

    const payload = this.form.getRawValue();

    console.log('SUBMIT PAYLOAD:', payload);

    const call = this.isResubmit()
      ? this.api.resubmitForm(payload)
      : this.api.submitForm(payload);

    call.subscribe({

      next: () => {

        this.snack.success(
          this.isResubmit()
            ? 'Form resubmitted successfully!'
            : 'Form submitted successfully!'
        );

        this.submitting.set(false);

        // LOCK FORM AFTER SUBMISSION
        this.form.disable();
      },

      error: (e) => {

        this.snack.error(
          e.error?.detail || 'Submission failed'
        );

        this.submitting.set(false);
      },
    });
  }



  /* =========================================================
     HELPERS
  ========================================================= */

  getAvailablePrefs(exclude: string[]): string[] {

    return this.eligibleSubjects().filter(
      s => !exclude.includes(s)
    );
  }

  fieldError(field: string, error: string): boolean {

    const c = this.form.get(field);

    return !!(
      c?.hasError(error) &&
      (c.dirty || c.touched)
    );
  }

  getDuplicateTarget(field: string): number | null {

    const control = this.form.get(field);

    return control?.errors?.['duplicateWith'] || null;
  }



  /* =========================================================
     GETTERS
  ========================================================= */

  get isLocked(): boolean {
    return !!this.existingForm()?.is_locked;
  }

  get adminRemarks(): string {
    return this.existingForm()?.admin_remarks || '';
  }

  get hasDuplicates(): boolean {
    return !!this.form.errors?.['duplicatePrefs'];
  }



  /* =========================================================
     DESTROY
  ========================================================= */

  ngOnDestroy(): void {
    this.autoSaveSub?.unsubscribe();
  }
}