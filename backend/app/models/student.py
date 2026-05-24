from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    prn = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    branch = Column(String(100), nullable=False)
    role = Column(String(50), default="student")
    is_active = Column(Boolean, default=True)
    registry_id = Column(Integer, ForeignKey("student_registry.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    form = relationship("StudentForm", back_populates="student", uselist=False)
    registry = relationship("StudentRegistry", foreign_keys=[registry_id])
