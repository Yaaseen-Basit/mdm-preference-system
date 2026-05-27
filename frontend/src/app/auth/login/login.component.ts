import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  adminForm: FormGroup;
  studentForm: FormGroup;
  forgotPasswordForm: FormGroup;

  loading = signal(false);
  hidePassword = signal(true);
  hideForgotPassword = signal(true);
  isForgotPasswordMode = signal(false);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snack: SnackbarService
  ) {
    this.adminForm = this.fb.group({
      email: ['admin@mdm.edu', [Validators.required, Validators.email]],
      password: ['Admin@123', Validators.required]
    });

  this.studentForm = this.fb.group({
  // Changed from 'email' to 'prn'
  prn: ['', [Validators.required]], 
  password: ['', Validators.required]
});

    this.forgotPasswordForm = this.fb.group({
      prn: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  toggleForgotPassword(enabled: boolean): void {
    this.isForgotPasswordMode.set(enabled);
    if (!enabled) {
      this.forgotPasswordForm.reset();
    }
  }

  loginAdmin(): void {
    if (this.adminForm.invalid) return;
    this.loading.set(true);
    this.auth.adminLogin(this.adminForm.value).subscribe({
      next: () => {
        this.snack.success('Welcome back, Administrator!');
        this.router.navigate(['/admin/dashboard']);
      },
      error: (e: any) => {
        this.snack.error(e.error?.detail || 'Invalid credentials');
        this.loading.set(false);
      }
    });
  }

  loginStudent(): void {
    if (this.studentForm.invalid) return;
    this.loading.set(true);
    this.auth.studentLogin(this.studentForm.value).subscribe({
      next: () => {
        this.snack.success('Welcome back!');
        this.router.navigate(['/student/dashboard']);
      },
      error: (e: any) => {
        this.snack.error(e.error?.detail || 'Invalid credentials');
        this.loading.set(false);
      }
    });
  }


resetPassword(): void {
  if (this.forgotPasswordForm.invalid) return;
  this.loading.set(true);

  const { prn, newPassword } = this.forgotPasswordForm.value;

  this.auth.requestPasswordReset(prn, newPassword).subscribe({
    next: () => {
      this.snack.success('Password updated successfully! Please login.');
      this.toggleForgotPassword(false);
      this.loading.set(false);
    },
    error: (e: any) => {
      this.snack.error(e.error?.detail || 'Failed to reset password. Please verify your PRN.');
      this.loading.set(false);
    }
  });
}

}