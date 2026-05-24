from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, List, Any
from datetime import datetime
import re


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class StudentRegisterRequest(BaseModel):
    prn: str
    email: EmailStr
    password: str
    full_name: str

    @field_validator("prn")
    @classmethod
    def validate_prn(cls, v):
        if not v.strip():
            raise ValueError("PRN is required")
        return v.strip().upper()


class StudentLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    prn: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── Registry Schemas ──────────────────────────────────────────────────────────

class RegistryEntry(BaseModel):
    id: int
    sr_no: Optional[int]
    name: str
    prn: str
    branch: str
    is_registered: bool
    uploaded_at: datetime

    class Config:
        from_attributes = True


class RegistryUploadResponse(BaseModel):
    inserted: int
    skipped: int
    errors: List[str]


# ── Form Schemas ──────────────────────────────────────────────────────────────

class FormBase(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    father_name: str
    email: EmailStr
    student_mobile: str
    parent_mobile: str
    percentage: float
    sgpa: float
    cgpa: float
    backlogs: int
    preference_1: str
    preference_2: str
    preference_3: str

    @field_validator("student_mobile", "parent_mobile")
    @classmethod
    def validate_mobile(cls, v):
        if not re.match(r'^[6-9]\d{9}$', v.strip()):
            raise ValueError("Mobile must be 10 digits starting with 6, 7, 8, or 9")
        return v.strip()

    @field_validator("first_name", "last_name", "father_name")
    @classmethod
    def validate_name(cls, v):
        if not re.match(r'^[A-Za-z\s]+$', v.strip()):
            raise ValueError("Name must contain alphabets only")
        return v.strip()

    @field_validator("percentage")
    @classmethod
    def validate_percentage(cls, v):
        if not 0 <= v <= 100:
            raise ValueError("Percentage must be between 0 and 100")
        return v

    @field_validator("sgpa", "cgpa")
    @classmethod
    def validate_gpa(cls, v):
        if not 0 <= v <= 10:
            raise ValueError("GPA must be between 0 and 10")
        return v

    @field_validator("backlogs")
    @classmethod
    def validate_backlogs(cls, v):
        if v < 0:
            raise ValueError("Backlogs cannot be negative")
        return v

    @model_validator(mode="after")
    def validate_preferences(self):
        prefs = [self.preference_1, self.preference_2, self.preference_3]
        if len(set(prefs)) != 3:
            raise ValueError("All three preferences must be different")
        return self


class FormCreateRequest(FormBase):
    pass


class FormUpdateRequest(FormBase):
    pass


class FormStatusUpdateRequest(BaseModel):
    form_id: int
    status: str
    admin_remarks: Optional[str] = None


class FormResponse(BaseModel):
    id: int
    student_id: int
    prn: str
    first_name: str
    middle_name: Optional[str]
    last_name: str
    father_name: str
    email: str
    student_mobile: str
    parent_mobile: str
    percentage: float
    sgpa: float
    cgpa: float
    backlogs: int
    preference_1: str
    preference_2: str
    preference_3: str
    status: str
    admin_remarks: Optional[str]
    version: int
    is_locked: bool
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    student_name: Optional[str] = None
    branch: Optional[str] = None

    class Config:
        from_attributes = True


# ── Correction History Schemas ────────────────────────────────────────────────

class CorrectionHistoryResponse(BaseModel):
    id: int
    form_id: int
    version: int
    changed_by_role: str
    changed_by_name: str
    action: str
    old_data: Optional[Any]
    new_data: Optional[Any]
    remarks: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard Schemas ─────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_students: int
    total_registry: int
    pending_forms: int
    approved_forms: int
    rejected_forms: int
    correction_requested: int
    total_submitted: int
    branch_distribution: List[dict]
    preference_distribution: List[dict]
    recent_activity: List[dict]
    weekly_submissions: List[dict]


# ── Student Schemas ───────────────────────────────────────────────────────────

class StudentResponse(BaseModel):
    id: int
    prn: str
    email: str
    full_name: str
    branch: str
    is_active: bool
    created_at: datetime
    form_status: Optional[str] = None

    class Config:
        from_attributes = True
