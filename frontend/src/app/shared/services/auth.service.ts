import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { TokenResponse, LoginRequest, RegisterRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_KEY = 'mdm_access_token';
  private readonly REFRESH_KEY = 'mdm_refresh_token';
  private readonly USER_KEY = 'mdm_user';

  isAuthenticated = signal(this.hasValidToken());
  currentUser = signal<any>(this.getStoredUser());

  constructor(private api: ApiService, private router: Router) {}

  adminLogin(data: LoginRequest): Observable<TokenResponse> {
    return this.api.adminLogin(data).pipe(tap(r => this.storeAuth(r)));
  }

  studentLogin(data: LoginRequest): Observable<TokenResponse> {
    return this.api.studentLogin(data).pipe(tap(r => this.storeAuth(r)));
  }

  studentRegister(data: RegisterRequest): Observable<TokenResponse> {
    return this.api.studentRegister(data).pipe(tap(r => this.storeAuth(r)));
  }

  private storeAuth(res: TokenResponse): void {
    localStorage.setItem(this.ACCESS_KEY, res.access_token);
    localStorage.setItem(this.REFRESH_KEY, res.refresh_token);
    const user = { id: res.user_id, full_name: res.full_name, role: res.role, prn: res.prn };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.isAuthenticated.set(true);
    this.currentUser.set(user);
  }

  logout(): void {
    this.api.logout().subscribe();
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  getRole(): string | null {
    return this.currentUser()?.role ?? null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  isStudent(): boolean {
    return this.getRole() === 'student';
  }

  private hasValidToken(): boolean {
    return !!localStorage.getItem(this.ACCESS_KEY);
  }

  private getStoredUser(): any {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u) : null;
  }

// studentRegister(data: RegisterRequest): Observable<TokenResponse> {
//   return this.api.studentRegister(data).pipe(tap(r => this.storeAuth(r)));
// }


requestPasswordReset(prn: string, newPassword: string): Observable<any> {
  return this.api.requestPasswordReset(prn, newPassword);
}
}
