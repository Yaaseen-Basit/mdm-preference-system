from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_current_user_payload
from app.models.admin import Admin
from app.models.student import Student
from app.models.registry import StudentRegistry
from app.schemas.schemas import (
    AdminLoginRequest, StudentRegisterRequest, StudentLoginRequest,
    TokenResponse, RefreshTokenRequest
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/admin-login", response_model=TokenResponse)
def admin_login(data: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == data.email).first()
    if not admin or not verify_password(data.password, admin.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token_data = {"sub": str(admin.id), "role": "admin", "email": admin.email}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        role="admin",
        user_id=admin.id,
        full_name=admin.full_name,
    )


@router.post("/student-register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def student_register(data: StudentRegisterRequest, db: Session = Depends(get_db)):
    # Verify PRN in registry
    registry = db.query(StudentRegistry).filter(StudentRegistry.prn == data.prn.upper()).first()
    if not registry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PRN not found in registry. Please contact admin."
        )
    if registry.is_registered:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="PRN already registered. Please login."
        )
    # Check email uniqueness
    existing = db.query(Student).filter(Student.email == data.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    student = Student(
        prn=data.prn.upper(),
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        branch=registry.branch,
        registry_id=registry.id,
    )
    db.add(student)
    registry.is_registered = True
    db.commit()
    db.refresh(student)

    token_data = {"sub": str(student.id), "role": "student", "email": student.email, "prn": student.prn}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        role="student",
        user_id=student.id,
        full_name=student.full_name,
        prn=student.prn,
    )


@router.post("/student-login", response_model=TokenResponse)
def student_login(data: StudentLoginRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == data.email).first()
    if not student or not verify_password(data.password, student.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not student.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token_data = {"sub": str(student.id), "role": "student", "email": student.email, "prn": student.prn}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        role="student",
        user_id=student.id,
        full_name=student.full_name,
        prn=student.prn,
    )


@router.post("/refresh-token", response_model=TokenResponse)
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    role = payload.get("role")
    user_id = int(payload.get("sub"))

    if role == "admin":
        user = db.query(Admin).filter(Admin.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        token_data = {"sub": str(user.id), "role": "admin", "email": user.email}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            role="admin", user_id=user.id, full_name=user.full_name,
        )
    else:
        user = db.query(Student).filter(Student.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        token_data = {"sub": str(user.id), "role": "student", "email": user.email, "prn": user.prn}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            role="student", user_id=user.id, full_name=user.full_name, prn=user.prn,
        )


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
