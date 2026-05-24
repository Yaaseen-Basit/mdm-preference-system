from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timezone
from typing import List, Optional
import pandas as pd
import io

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.admin import Admin
from app.models.registry import StudentRegistry
from app.models.student import Student
from app.models.form import StudentForm, CorrectionHistory
from app.schemas.schemas import (
    RegistryUploadResponse, FormResponse, FormStatusUpdateRequest,
    DashboardStats, CorrectionHistoryResponse, StudentResponse
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# @router.post("/upload-registry", response_model=RegistryUploadResponse)
# async def upload_registry(
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
#     admin: Admin = Depends(get_current_admin),
# ):
#     if not file.filename.endswith(".csv"):
#         raise HTTPException(status_code=400, detail="Only CSV files accepted")

#     content = await file.read()
#     try:
#         df = pd.read_csv(io.StringIO(content.decode("utf-8")), dtype=str)
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid CSV format")

#     # Normalize column names
#     df.columns = [c.strip().lower().replace(" ", "_").replace(".", "") for c in df.columns]

#     inserted, skipped = 0, 0
#     errors = []

#     for _, row in df.iterrows():
#         try:
#             prn_col = next((c for c in df.columns if "prn" in c), None)
#             name_col = next((c for c in df.columns if "name" in c), None)
#             branch_col = next((c for c in df.columns if "branch" in c), None)
#             sr_col = next((c for c in df.columns if "sr" in c or "sno" in c or "no" in c), None)

#             if not prn_col or not name_col or not branch_col:
#                 errors.append("Required columns (PRN, Name, Branch) not found")
#                 break

#             prn = str(row.get(prn_col, "")).strip().upper()
#             name = str(row.get(name_col, "")).strip()
#             branch = str(row.get(branch_col, "")).strip()
#             sr_no = str(row.get(sr_col, "")).strip() if sr_col else None

#             if not prn or not name or not branch or prn == "NAN":
#                 skipped += 1
#                 continue

#             existing = db.query(StudentRegistry).filter(StudentRegistry.prn == prn).first()
#             if existing:
#                 skipped += 1
#                 continue

#             entry = StudentRegistry(
#                 sr_no=int(sr_no) if sr_no and sr_no.isdigit() else None,
#                 name=name,
#                 prn=prn,
#                 branch=branch,
#             )
#             db.add(entry)
#             inserted += 1
#         except Exception as e:
#             errors.append(str(e))

#     db.commit()
#     return RegistryUploadResponse(inserted=inserted, skipped=skipped, errors=errors[:10])
@router.post("/upload-registry", response_model=RegistryUploadResponse)
async def upload_registry(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    filename = file.filename.lower()

    try:
        # CSV SUPPORT
        if filename.endswith(".csv"):
            content = await file.read()
            df = pd.read_csv(
                io.StringIO(content.decode("utf-8")),
                dtype=str
            )

        # EXCEL SUPPORT
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            content = await file.read()
            df = pd.read_excel(
                io.BytesIO(content),
                dtype=str
            )

        else:
            raise HTTPException(
                status_code=400,
                detail="Only CSV, XLSX, XLS files accepted"
            )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format: {str(e)}"
        )

    # Normalize columns
    df.columns = [
        c.strip()
        .lower()
        .replace(" ", "_")
        .replace(".", "")
        for c in df.columns
    ]

    inserted = 0
    skipped = 0
    errors = []

    # Detect columns dynamically
    prn_col = next((c for c in df.columns if "prn" in c), None)
    name_col = next((c for c in df.columns if "name" in c), None)
    branch_col = next((c for c in df.columns if "branch" in c), None)
    sr_col = next(
        (
            c for c in df.columns
            if "sr" in c or "sno" in c or "no" in c
        ),
        None
    )

    if not prn_col or not name_col or not branch_col:
        raise HTTPException(
            status_code=400,
            detail="Required columns not found: PRN, Name, Branch"
        )

    for idx, row in df.iterrows():
        try:
            prn = str(row.get(prn_col, "")).strip().upper()
            name = str(row.get(name_col, "")).strip()
            branch = str(row.get(branch_col, "")).strip()

            sr_no = str(row.get(sr_col, "")).strip() if sr_col else None

            # Skip invalid rows
            if (
                not prn or
                not name or
                not branch or
                prn == "NAN"
            ):
                skipped += 1
                continue

            # Duplicate check
            existing = db.query(StudentRegistry).filter(
                StudentRegistry.prn == prn
            ).first()

            if existing:
                skipped += 1
                continue

            entry = StudentRegistry(
                sr_no=int(sr_no)
                if sr_no and sr_no.isdigit()
                else None,
                name=name,
                prn=prn,
                branch=branch,
            )

            db.add(entry)
            inserted += 1

        except Exception as e:
            errors.append(
                f"Row {idx + 1}: {str(e)}"
            )

    db.commit()

    return RegistryUploadResponse(
        inserted=inserted,
        skipped=skipped,
        errors=errors[:10]
    )

@router.get("/forms", response_model=List[FormResponse])
def get_all_forms(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    query = db.query(StudentForm).join(Student, StudentForm.student_id == Student.id)
    if status_filter:
        query = query.filter(StudentForm.status == status_filter)
    forms = query.order_by(StudentForm.updated_at.desc()).all()

    result = []
    for f in forms:
        fr = FormResponse.model_validate(f)
        fr.student_name = f.student.full_name if f.student else None
        fr.branch = f.student.branch if f.student else None
        result.append(fr)
    return result


@router.put("/update-form-status")
def update_form_status(
    data: FormStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    form = db.query(StudentForm).filter(StudentForm.id == data.form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    if form.is_locked:
        raise HTTPException(status_code=400, detail="Form is locked and cannot be modified")

    allowed = ["approved", "rejected", "correction_requested"]
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    old_data = {
        "status": form.status,
        "admin_remarks": form.admin_remarks,
    }

    form.status = data.status
    form.admin_remarks = data.admin_remarks
    form.reviewed_at = datetime.now(timezone.utc)
    form.reviewed_by = admin.id

    if data.status == "approved":
        form.is_locked = True

    history = CorrectionHistory(
        form_id=form.id,
        version=form.version,
        changed_by_role="admin",
        changed_by_id=admin.id,
        changed_by_name=admin.full_name,
        action=data.status,
        old_data=old_data,
        new_data={"status": data.status, "admin_remarks": data.admin_remarks},
        remarks=data.admin_remarks,
    )
    db.add(history)
    db.commit()
    return {"message": f"Form {data.status} successfully"}


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    total_students = db.query(Student).count()
    total_registry = db.query(StudentRegistry).count()

    status_counts = db.query(StudentForm.status, func.count(StudentForm.id)).group_by(StudentForm.status).all()
    status_map = {s: c for s, c in status_counts}

    pending = status_map.get("submitted", 0)
    approved = status_map.get("approved", 0)
    rejected = status_map.get("rejected", 0)
    correction = status_map.get("correction_requested", 0)
    total_submitted = pending + approved + rejected + correction

    # Branch distribution
    branch_data = db.query(Student.branch, func.count(Student.id)).group_by(Student.branch).all()
    branch_dist = [{"branch": b, "count": c} for b, c in branch_data]

    # Preference distribution
    pref_counts = {}
    forms = db.query(StudentForm).filter(StudentForm.status != "draft").all()
    for f in forms:
        for p in [f.preference_1, f.preference_2, f.preference_3]:
            pref_counts[p] = pref_counts.get(p, 0) + 1
    pref_dist = [{"subject": k, "count": v} for k, v in sorted(pref_counts.items(), key=lambda x: -x[1])[:8]]

    # Recent activity
    recent_history = (
        db.query(CorrectionHistory)
        .order_by(CorrectionHistory.created_at.desc())
        .limit(8)
        .all()
    )
    recent = [
        {
            "id": h.id,
            "action": h.action,
            "changed_by": h.changed_by_name,
            "role": h.changed_by_role,
            "created_at": h.created_at.isoformat() if h.created_at else None,
        }
        for h in recent_history
    ]

    # Weekly submissions (last 7 days)
    from datetime import timedelta
    weekly = []
    today = datetime.now(timezone.utc).date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = db.query(StudentForm).filter(
            func.date(StudentForm.submitted_at) == day
        ).count()
        weekly.append({"day": day.strftime("%a"), "count": count})

    return DashboardStats(
        total_students=total_students,
        total_registry=total_registry,
        pending_forms=pending,
        approved_forms=approved,
        rejected_forms=rejected,
        correction_requested=correction,
        total_submitted=total_submitted,
        branch_distribution=branch_dist,
        preference_distribution=pref_dist,
        recent_activity=recent,
        weekly_submissions=weekly,
    )


@router.get("/correction-history", response_model=List[CorrectionHistoryResponse])
def get_correction_history(
    form_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    query = db.query(CorrectionHistory)
    if form_id:
        query = query.filter(CorrectionHistory.form_id == form_id)
    return query.order_by(CorrectionHistory.created_at.desc()).limit(100).all()


@router.get("/students", response_model=List[StudentResponse])
def get_students(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    students = db.query(Student).all()
    result = []
    for s in students:
        sr = StudentResponse.model_validate(s)
        sr.form_status = s.form.status if s.form else None
        result.append(sr)
    return result


@router.get("/registry")
def get_registry(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    entries = db.query(StudentRegistry).order_by(StudentRegistry.sr_no).all()
    return [
        {
            "id": e.id,
            "sr_no": e.sr_no,
            "name": e.name,
            "prn": e.prn,
            "branch": e.branch,
            "is_registered": e.is_registered,
            "uploaded_at": e.uploaded_at.isoformat() if e.uploaded_at else None,
        }
        for e in entries
    ]
