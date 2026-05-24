from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class StudentRegistry(Base):
    __tablename__ = "student_registry"

    id = Column(Integer, primary_key=True, index=True)
    sr_no = Column(Integer, nullable=True)
    name = Column(String(255), nullable=False)
    prn = Column(String(50), unique=True, nullable=False, index=True)
    branch = Column(String(100), nullable=False)
    is_registered = Column(Boolean, default=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
