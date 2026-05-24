from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class StudentForm(Base):
    __tablename__ = "student_forms"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)

    # Personal Details
    prn = Column(String(50), nullable=False)
    first_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=False)
    father_name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    student_mobile = Column(String(15), nullable=False)
    parent_mobile = Column(String(15), nullable=False)

    # Academic Details
    percentage = Column(Float, nullable=False)
    sgpa = Column(Float, nullable=False)
    cgpa = Column(Float, nullable=False)
    backlogs = Column(Integer, default=0)

    # Preferences
    preference_1 = Column(String(100), nullable=False)
    preference_2 = Column(String(100), nullable=False)
    preference_3 = Column(String(100), nullable=False)

    # Workflow
    status = Column(String(50), default="draft")  # draft, submitted, approved, rejected, correction_requested
    admin_remarks = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    is_locked = Column(Boolean, default=False)

    submitted_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("admins.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student", back_populates="form")
    reviewer = relationship("Admin", foreign_keys=[reviewed_by])
    correction_history = relationship("CorrectionHistory", back_populates="form", order_by="CorrectionHistory.created_at")


class CorrectionHistory(Base):
    __tablename__ = "correction_history"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("student_forms.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    changed_by_role = Column(String(50), nullable=False)  # admin or student
    changed_by_id = Column(Integer, nullable=False)
    changed_by_name = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)  # submitted, correction_requested, resubmitted, approved, rejected
    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    form = relationship("StudentForm", back_populates="correction_history")
