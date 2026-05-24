from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_student
from app.models.student import Student
from app.models.form import StudentForm, CorrectionHistory
from app.schemas.schemas import FormCreateRequest, FormResponse, CorrectionHistoryResponse
from app.services.eligibility import get_eligible_subjects

router = APIRouter(prefix="/api/student", tags=["Student"])


def _form_to_dict(form: StudentForm) -> dict:
    return {
        "prn": form.prn,
        "first_name": form.first_name,
        "middle_name": form.middle_name,
        "last_name": form.last_name,
        "father_name": form.father_name,
        "email": form.email,
        "student_mobile": form.student_mobile,
        "parent_mobile": form.parent_mobile,
        "percentage": form.percentage,
        "sgpa": form.sgpa,
        "cgpa": form.cgpa,
        "backlogs": form.backlogs,
        "preference_1": form.preference_1,
        "preference_2": form.preference_2,
        "preference_3": form.preference_3,
    }


@router.get("/form")
def get_form(
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    form = db.query(StudentForm).filter(StudentForm.student_id == student.id).first()
    eligible = get_eligible_subjects(student.branch)
    if not form:
        return {
            "form": None,
            "eligible_subjects": eligible,
            "branch": student.branch,
            "prn": student.prn,
            "full_name": student.full_name,
        }
    fr = FormResponse.model_validate(form)
    fr.student_name = student.full_name
    fr.branch = student.branch
    return {
        "form": fr,
        "eligible_subjects": eligible,
        "branch": student.branch,
        "prn": student.prn,
        "full_name": student.full_name,
    }


@router.post("/save-draft")
def save_draft(
    data: FormCreateRequest,
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    # Validate preferences against eligible subjects
    eligible = get_eligible_subjects(student.branch)
    for pref in [data.preference_1, data.preference_2, data.preference_3]:
        if pref not in eligible:
            raise HTTPException(
                status_code=400,
                detail=f"'{pref}' is not eligible for your branch ({student.branch}). Eligible: {eligible}"
            )

    form = db.query(StudentForm).filter(StudentForm.student_id == student.id).first()

    if form and form.is_locked:
        raise HTTPException(status_code=400, detail="Approved form cannot be modified")

    if not form:
        form = StudentForm(student_id=student.id, prn=student.prn)
        db.add(form)

    for field, value in data.model_dump().items():
        setattr(form, field, value)
    form.status = "draft"

    db.commit()
    db.refresh(form)
    return {"message": "Draft saved", "form_id": form.id, "status": form.status}


@router.post("/submit-form")
def submit_form(
    data: FormCreateRequest,
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    eligible = get_eligible_subjects(student.branch)
    for pref in [data.preference_1, data.preference_2, data.preference_3]:
        if pref not in eligible:
            raise HTTPException(
                status_code=400,
                detail=f"'{pref}' is not eligible for your branch. Eligible: {eligible}"
            )

    form = db.query(StudentForm).filter(StudentForm.student_id == student.id).first()
    if form and form.is_locked:
        raise HTTPException(status_code=400, detail="Approved form is locked")

    old_data = _form_to_dict(form) if form else None

    if not form:
        form = StudentForm(student_id=student.id, prn=student.prn)
        db.add(form)

    for field, value in data.model_dump().items():
        setattr(form, field, value)
    form.status = "submitted"
    form.submitted_at = datetime.now(timezone.utc)

    db.flush()

    history = CorrectionHistory(
        form_id=form.id,
        version=form.version,
        changed_by_role="student",
        changed_by_id=student.id,
        changed_by_name=student.full_name,
        action="submitted",
        old_data=old_data,
        new_data=_form_to_dict(form),
    )
    db.add(history)
    db.commit()
    return {"message": "Form submitted successfully", "form_id": form.id, "status": form.status}


@router.put("/resubmit-corrected-form")
def resubmit_corrected_form(
    data: FormCreateRequest,
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    form = db.query(StudentForm).filter(StudentForm.student_id == student.id).first()
    if not form:
        raise HTTPException(status_code=404, detail="No form found")
    if form.status != "correction_requested":
        raise HTTPException(status_code=400, detail="Form is not in correction_requested state")

    eligible = get_eligible_subjects(student.branch)
    for pref in [data.preference_1, data.preference_2, data.preference_3]:
        if pref not in eligible:
            raise HTTPException(
                status_code=400,
                detail=f"'{pref}' is not eligible. Eligible: {eligible}"
            )

    old_data = _form_to_dict(form)
    form.version += 1

    for field, value in data.model_dump().items():
        setattr(form, field, value)
    form.status = "submitted"
    form.submitted_at = datetime.now(timezone.utc)
    form.admin_remarks = None

    history = CorrectionHistory(
        form_id=form.id,
        version=form.version,
        changed_by_role="student",
        changed_by_id=student.id,
        changed_by_name=student.full_name,
        action="resubmitted",
        old_data=old_data,
        new_data=_form_to_dict(form),
        remarks=f"Version {form.version} resubmission",
    )
    db.add(history)
    db.commit()
    return {"message": "Form resubmitted successfully", "version": form.version}


@router.get("/history", response_model=List[CorrectionHistoryResponse])
def get_history(
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    form = db.query(StudentForm).filter(StudentForm.student_id == student.id).first()
    if not form:
        return []
    history = (
        db.query(CorrectionHistory)
        .filter(CorrectionHistory.form_id == form.id)
        .order_by(CorrectionHistory.created_at.desc())
        .all()
    )
    return history


@router.get("/eligible-subjects")
def eligible_subjects(student: Student = Depends(get_current_student)):
    return {"eligible_subjects": get_eligible_subjects(student.branch), "branch": student.branch}
