import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, RegisterRequest, TokenResponse,
  FormData, DashboardStats, CorrectionHistory, StudentRecord, RegistryEntry
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Auth
  adminLogin(data: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/api/auth/admin-login`, data);
  }

  studentLogin(data: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/api/auth/student-login`, data);
  }

  studentRegister(data: RegisterRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/api/auth/student-register`, data);
  }

  refreshToken(refreshToken: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/api/auth/refresh-token`, { refresh_token: refreshToken });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.base}/api/auth/logout`, {});
  }

  // Admin
  uploadRegistry(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.base}/api/admin/upload-registry`, fd);
  }

  getForms(statusFilter?: string): Observable<FormData[]> {
    let params = new HttpParams();
    if (statusFilter) params = params.set('status_filter', statusFilter);
    return this.http.get<FormData[]>(`${this.base}/api/admin/forms`, { params });
  }

  updateFormStatus(formId: number, status: string, remarks?: string): Observable<any> {
    return this.http.put(`${this.base}/api/admin/update-form-status`, {
      form_id: formId, status, admin_remarks: remarks
    });
  }

  getDashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/api/admin/dashboard`);
  }

  getCorrectionHistory(formId?: number): Observable<CorrectionHistory[]> {
    let params = new HttpParams();
    if (formId) params = params.set('form_id', formId);
    return this.http.get<CorrectionHistory[]>(`${this.base}/api/admin/correction-history`, { params });
  }

  getAdminStudents(): Observable<StudentRecord[]> {
    return this.http.get<StudentRecord[]>(`${this.base}/api/admin/students`);
  }

  getRegistry(): Observable<RegistryEntry[]> {
    return this.http.get<RegistryEntry[]>(`${this.base}/api/admin/registry`);
  }

  // Student
  getStudentForm(): Observable<any> {
    return this.http.get(`${this.base}/api/student/form`);
  }

  saveDraft(data: any): Observable<any> {
    return this.http.post(`${this.base}/api/student/save-draft`, data);
  }

  submitForm(data: any): Observable<any> {
    return this.http.post(`${this.base}/api/student/submit-form`, data);
  }

  resubmitForm(data: any): Observable<any> {
    return this.http.put(`${this.base}/api/student/resubmit-corrected-form`, data);
  }

  getStudentHistory(): Observable<CorrectionHistory[]> {
    return this.http.get<CorrectionHistory[]>(`${this.base}/api/student/history`);
  }

  getEligibleSubjects(): Observable<any> {
    return this.http.get(`${this.base}/api/student/eligible-subjects`);
  }
  getFormsData(): Observable<FormData[]> {
  return this.http.get<FormData[]>(`${this.base}/api/admin/forms`);
}

requestPasswordReset(prn: string, newPassword: string): Observable<any> {
  return this.http.post(`${this.base}/api/auth/forgot-password`, { 
    prn, 
    new_password: newPassword 
  });
}
}
