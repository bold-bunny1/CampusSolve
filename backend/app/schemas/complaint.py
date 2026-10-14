from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserResponse
from app.schemas.comment import CommentResponse

# Category choices: Electrical, Plumbing, Cleanliness, Furniture, Internet, Security, Water Supply, Other
# Impact choices: Single Room, Entire Floor, Entire Wing/Block
# Urgency choices: Low, Medium, High, Emergency
# Status choices: Submitted, Acknowledged, Assigned, In Progress, On Hold, Resolved, Closed, Reopened

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=3000)
    category: str = Field(..., pattern="^(Electrical|Plumbing|Cleanliness|Furniture|Internet|Security|Water Supply|Other)$")
    block: str = Field(..., min_length=1, max_length=50)
    floor: int = Field(..., ge=0, le=20)
    location: str = Field(..., min_length=2, max_length=100)
    impact_level: str = Field(..., pattern="^(Single Room|Entire Floor|Entire Wing/Block)$")
    urgency_level: str = Field(..., pattern="^(Low|Medium|High|Emergency)$")

class ComplaintUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(Submitted|Acknowledged|Assigned|In Progress|On Hold|Resolved|Closed|Reopened)$")
    notes: Optional[str] = None
    hold_reason: Optional[str] = None

class ComplaintAssign(BaseModel):
    assigned_staff_id: int
    target_resolution_date: Optional[datetime] = None
    notes: Optional[str] = None

class ComplaintPriorityOverride(BaseModel):
    priority: str = Field(..., pattern="^(Critical|High|Medium|Low)$")
    reason: str = Field(..., min_length=5, max_length=500)

class ComplaintResolve(BaseModel):
    resolution_notes: str = Field(..., min_length=5, max_length=2000)

class ComplaintReopen(BaseModel):
    reason: str = Field(..., min_length=5, max_length=1000)

class HistoryItemResponse(BaseModel):
    id: int
    complaint_id: int
    actor_id: Optional[int]
    actor_name: str
    actor_role: str
    action_type: str
    old_value: Optional[str]
    new_value: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComplaintListItemResponse(BaseModel):
    id: int
    complaint_id: str
    title: str
    category: str
    block: str
    floor: int
    location: str
    impact_level: str
    urgency_level: str
    priority: str
    priority_reason: str
    is_safety_hazard: bool
    status: str
    student_id: int
    student_name: Optional[str] = None
    assigned_staff_id: Optional[int] = None
    assigned_staff_name: Optional[str] = None
    is_recurring: bool
    is_overdue: bool
    overdue_by_hours: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComplaintDetailResponse(BaseModel):
    id: int
    complaint_id: str
    title: str
    description: str
    category: str
    block: str
    floor: int
    location: str
    impact_level: str
    urgency_level: str
    priority: str
    priority_reason: str
    is_safety_hazard: bool
    safety_review_notes: Optional[str] = None
    priority_overridden: bool = False
    priority_override_reason: Optional[str] = None
    status: str
    hold_reason: Optional[str] = None
    student_id: int
    assigned_staff_id: Optional[int] = None
    image_url: Optional[str] = None
    target_resolution_date: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    resolved_by_id: Optional[int] = None
    resolution_time_minutes: Optional[int] = None
    is_recurring: bool = False
    recurring_cluster_info: Optional[str] = None
    is_overdue: bool = False
    overdue_by_hours: int = 0
    created_at: datetime
    updated_at: datetime

    student: Optional[UserResponse] = None
    assigned_staff: Optional[UserResponse] = None
    resolved_by: Optional[UserResponse] = None
    history: List[HistoryItemResponse] = []
    comments: List[CommentResponse] = []

    model_config = ConfigDict(from_attributes=True)
