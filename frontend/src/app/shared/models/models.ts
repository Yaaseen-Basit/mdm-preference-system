
export interface LoginRequest {
  email?: string;     // Optional now, since admins use email
  prn?: string;       // Added for student login
  password: string;
}

export interface RegisterRequest {
  prn: string;
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: string;
  user_id: number;
  full_name: string;
  prn?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  prn?: string;
}

export interface FormData {
  id?: number;
  student_id?: number;
  prn?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  father_name: string;
  email: string;
  student_mobile: string;
  parent_mobile: string;
  percentage: number;
  sgpa: number;
  cgpa: number;
  backlogs: number;
  preference_1: string;
  preference_2: string;
  preference_3: string;
  status?: string;
  admin_remarks?: string;
  version?: number;
  is_locked?: boolean;
  submitted_at?: string;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
  student_name?: string;
  branch?: string;
}

export interface DashboardStats {
  total_students: number;
  total_registry: number;
  pending_forms: number;
  approved_forms: number;
  rejected_forms: number;
  correction_requested: number;
  total_submitted: number;
  branch_distribution: { branch: string; count: number }[];
  preference_distribution: { subject: string; count: number }[];
  recent_activity: any[];
  weekly_submissions: { day: string; count: number }[];
}

export interface CorrectionHistory {
  id: number;
  form_id: number;
  version: number;
  changed_by_role: string;
  changed_by_name: string;
  action: string;
  old_data: any;
  new_data: any;
  remarks?: string;
  created_at: string;
}
export interface ProcessedHistory {
  id: number;
  form_id: number;
  version: number;

  changed_by_role: string;
  changed_by_name: string;

  action: string;

  old_data: any;
  new_data: any;

  remarks?: string;
  created_at: string;

  icon: string;
  actionLabel: string;

  changes: {
    field: string;
    from: string;
    to: string;
  }[];
}

export interface StudentRecord {
  id: number;
  prn: string;
  email: string;
  full_name: string;
  branch: string;
  is_active: boolean;
  created_at: string;
  form_status?: string;
}

export interface RegistryEntry {
  id: number;
  sr_no?: number;
  name: string;
  prn: string;
  branch: string;
  is_registered: boolean;
  uploaded_at: string;
}
