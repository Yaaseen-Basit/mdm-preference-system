import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const requiredRole = route.data?.['role'];
  if (requiredRole && auth.getRole() !== requiredRole) {
    if (auth.isAdmin()) router.navigate(['/admin/dashboard']);
    else router.navigate(['/student/dashboard']);
    return false;
  }

  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    if (auth.isAdmin()) router.navigate(['/admin/dashboard']);
    else router.navigate(['/student/dashboard']);
    return false;
  }
  return true;
};
