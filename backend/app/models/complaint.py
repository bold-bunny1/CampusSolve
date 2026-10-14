from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. "HP-1001"
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), index=True, nullable=False) # Electrical, Plumbing, Cleanliness, Furniture, Internet, Security, Water Supply, Other
    block = Column(String(50), index=True, nullable=False) # Block A, Block B, Block C, Block D
    floor = Column(Integer, index=True, nullable=False)
    location = Column(String(255), nullable=False) # Room 204, Common Room 1st Floor, etc.
    
    impact_level = Column(String(50), nullable=False) # Single Room, Entire Floor, Entire Wing/Block
    urgency_level = Column(String(50), nullable=False) # Low, Medium, High, Emergency
    
    # Priority engine calculated fields
    priority = Column(String(50), index=True, nullable=False) # Critical, High, Medium, Low
    priority_reason = Column(Text, nullable=False)
    is_safety_hazard = Column(Boolean, default=False, nullable=False)
    safety_review_notes = Column(Text, nullable=True)
    priority_overridden = Column(Boolean, default=False)
    priority_override_reason = Column(Text, nullable=True)
    
    # Lifecycle status
    status = Column(String(50), index=True, nullable=False, default="Submitted")
    # Allowed: Submitted, Acknowledged, Assigned, In Progress, On Hold, Resolved, Closed, Reopened
    hold_reason = Column(Text, nullable=True)
    
    # Ownership and Assignment
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assigned_staff_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Attachments
    image_url = Column(String(500), nullable=True)
    
    # Resolution & SLA
    target_resolution_date = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_time_minutes = Column(Integer, nullable=True)
    
    # Recurring & Overdue indicators
    is_recurring = Column(Boolean, default=False, index=True)
    recurring_cluster_info = Column(Text, nullable=True)
    is_overdue = Column(Boolean, default=False, index=True)
    overdue_by_hours = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="complaints")
    assigned_staff = relationship("User", foreign_keys=[assigned_staff_id], back_populates="assigned_tasks")
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintHistory.created_at.desc()")
    comments = relationship("ComplaintComment", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintComment.created_at.asc()")
