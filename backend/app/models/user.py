from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student")  # 'student', 'admin', 'staff'
    room_number = Column(String(50), nullable=True)
    block = Column(String(50), nullable=True)
    floor = Column(Integer, nullable=True)
    phone = Column(String(50), nullable=True)
    specialization = Column(String(100), nullable=True)  # 'Electrical', 'Plumbing', 'Cleanliness', 'General'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    complaints = relationship("Complaint", back_populates="student", foreign_keys="Complaint.student_id")
    assigned_tasks = relationship("Complaint", back_populates="assigned_staff", foreign_keys="Complaint.assigned_staff_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
