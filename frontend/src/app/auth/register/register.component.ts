import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatStepperModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  form: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);
  hideConfirm = signal(true);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snack: SnackbarService,
  ) {
    this.form = this.fb.group({
      prn: ['', [Validators.required, Validators.minLength(4)]],
      full_name: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-z\s]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required],
    }, { validators: this.passwordMatch });
  }

  private passwordMatch(group: AbstractControl) {
    const pw = group.get('password')?.value;
    const conf = group.get('confirm_password')?.value;
    return pw === conf ? null : { passwordMismatch: true };
  }

  register(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { prn, full_name, email, password } = this.form.value;
    this.auth.studentRegister({ prn, full_name, email, password }).subscribe({
      next: () => {
        this.snack.success('Registration successful! Welcome to MDM Portal.');
        this.router.navigate(['/student/dashboard']);
      },
      error: (e) => {
        this.snack.error(e.error?.detail || 'Registration failed. Check your PRN.');
        this.loading.set(false);
      },
    });
  }
}
