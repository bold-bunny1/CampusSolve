from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from typing import Optional, List
import uuid
import shutil
from pathlib import Path
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.complaint import Complaint
from app.models.comment import ComplaintComment
from app.models.history import ComplaintHistory
from app.models.user import User
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintListItemResponse,
    ComplaintDetailResponse,
    ComplaintUpdateStatus,
    ComplaintAssign,
    ComplaintPriorityOverride,
    ComplaintResolve,
    ComplaintReopen
)
from app.schemas.comment import CommentCreate, CommentResponse
from app.api.v1.deps import get_current_user, require_admin, require_staff_or_admin
from app.services.complaint_service import (
    create_complaint as service_create_complaint,
    transition_status,
    assign_complaint as service_assign_complaint,
    override_priority as service_override_priority,
    resolve_complaint as service_resolve_complaint,
    reopen_complaint as service_reopen_complaint,
    log_history,
    refresh_overdue_statuses
)
from app.services.notification_service import create_notification
from app.core.config import settings

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.post("", response_model=ComplaintDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint_endpoint(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    block: str = Form(...),
    floor: int = Form(...),
    location: str = Form(...),
    impact_level: str = Form(...),
    urgency_level: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a new complaint with optional image attachment.
    Validates file format, size, executes priority rules, records history, and dispatches notifications.
    """
    image_url = None
    if image and image.filename:
        # Validate extension
        ext = Path(image.filename).suffix.lower()
        if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}"
            )

        # Validate MIME type
        if image.content_type not in settings.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file content type '{image.content_type}'."
            )

        # Safe unique filename
        safe_name = f"{uuid.uuid4().hex}{ext}"
        destination = settings.UPLOAD_FOLDER / safe_name

        # Enforce max file size during stream reading
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        file_size = 0
        with open(destination, "wb") as buffer:
            while chunk := await image.read(1024 * 1024):
                file_size += len(chunk)
                if file_size > max_bytes:
                    destination.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
                    )
                buffer.write(chunk)

        image_url = f"/uploads/{safe_name}"

    complaint = service_create_complaint(
        db=db,
        student=current_user,
        title=title,
        description=description,
        category=category,
        block=block,
        floor=floor,
        location=location,
        impact_level=impact_level,
        urgency_level=urgency_level,
        image_url=image_url
    )

    # Return full complaint with relations
    return db.query(Complaint).filter(Complaint.id == complaint.id).options(
        joinedload(Complaint.student),
        joinedload(Complaint.assigned_staff),
        joinedload(Complaint.history),
        joinedload(Complaint.comments)
    ).first()

@router.get("", response_model=List[ComplaintListItemResponse])
def list_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_filter: Optional[str] = Query(None, alias="category"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    block_filter: Optional[str] = Query(None, alias="block"),
    is_overdue_filter: Optional[bool] = Query(None, alias="is_overdue"),
    is_recurring_filter: Optional[bool] = Query(None, alias="is_recurring"),
    search: Optional[str] = Query(None),
    my_tasks_only: Optional[bool] = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists complaints based on role-based access control and optional filters.
    - Students: ONLY view their own submitted complaints.
    - Staff: View assigned complaints (or hostel tasks if requested).
    - Admins: View all complaints across the hostel.
    """
    refresh_overdue_statuses(db)

    query = db.query(Complaint).options(
        joinedload(Complaint.student),
        joinedload(Complaint.assigned_staff)
    )

    # Enforce Role-Based Visibility
    if current_user.role == "student":
        query = query.filter(Complaint.student_id == current_user.id)
    elif current_user.role == "staff":
        if my_tasks_only:
            query = query.filter(Complaint.assigned_staff_id == current_user.id)
        else:
            # Default for staff: show their assigned tasks or general tasks
            query = query.filter(
                or_(
                    Complaint.assigned_staff_id == current_user.id,
                    Complaint.status.in_(["Submitted", "Acknowledged", "Assigned"])
                )
            )

    # Apply filters
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if category_filter:
        query = query.filter(Complaint.category == category_filter)
    if priority_filter:
        query = query.filter(Complaint.priority == priority_filter)
    if block_filter:
        query = query.filter(Complaint.block == block_filter)
    if is_overdue_filter is not None:
        query = query.filter(Complaint.is_overdue == is_overdue_filter)
    if is_recurring_filter is not None:
        query = query.filter(Complaint.is_recurring == is_recurring_filter)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.title.ilike(search_pattern),
                Complaint.complaint_id.ilike(search_pattern),
                Complaint.location.ilike(search_pattern),
                Complaint.description.ilike(search_pattern)
            )
        )

    # Order by priority weight and creation date
    complaints = query.order_by(desc(Complaint.created_at)).all()

    # Map to response format
    results = []
    for c in complaints:
        results.append(
            ComplaintListItemResponse(
                id=c.id,
                complaint_id=c.complaint_id,
                title=c.title,
                category=c.category,
                block=c.block,
                floor=c.floor,
                location=c.location,
                impact_level=c.impact_level,
                urgency_level=c.urgency_level,
                priority=c.priority,
                priority_reason=c.priority_reason,
                is_safety_hazard=c.is_safety_hazard,
                status=c.status,
                student_id=c.student_id,
                student_name=c.student.full_name if c.student else None,
                assigned_staff_id=c.assigned_staff_id,
                assigned_staff_name=c.assigned_staff.full_name if c.assigned_staff else None,
                is_recurring=c.is_recurring,
                is_overdue=c.is_overdue,
                overdue_by_hours=c.overdue_by_hours,
                created_at=c.created_at,
                updated_at=c.updated_at
            )
        )
    return results

@router.get("/{id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches full complaint details.
    Enforces student isolation: students CANNOT access other students' complaints.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).options(
        joinedload(Complaint.student),
        joinedload(Complaint.assigned_staff),
        joinedload(Complaint.resolved_by),
        joinedload(Complaint.history),
        joinedload(Complaint.comments)
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint ticket not found."
        )

    # Strict ownership isolation for students
    if current_user.role == "student" and complaint.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not authorized to view another resident's private complaint."
        )

    # For staff, if comment has internal notes, staff/admin can see, student cannot
    return complaint

@router.patch("/{id}/status", response_model=ComplaintDetailResponse)
def update_complaint_status(
    id: int,
    status_in: ComplaintUpdateStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates complaint lifecycle status adhering to allowed state machine transitions."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # If student, ensure ticket ownership
    if current_user.role == "student" and complaint.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this complaint.")

    updated = transition_status(
        db=db,
        complaint=complaint,
        new_status=status_in.status,
        actor=current_user,
        notes=status_in.notes,
        hold_reason=status_in.hold_reason
    )
    return updated

@router.post("/{id}/assign", response_model=ComplaintDetailResponse)
def assign_staff(
    id: int,
    assign_in: ComplaintAssign,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Assigns complaint to maintenance staff (Admin only)."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    staff = db.query(User).filter(User.id == assign_in.assigned_staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    updated = service_assign_complaint(
        db=db,
        complaint=complaint,
        staff=staff,
        admin=current_user,
        target_date=assign_in.target_resolution_date,
        notes=assign_in.notes
    )
    return updated

@router.post("/{id}/priority-override", response_model=ComplaintDetailResponse)
def override_complaint_priority(
    id: int,
    override_in: ComplaintPriorityOverride,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Overrides automated priority with mandatory administrative justification."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    updated = service_override_priority(
        db=db,
        complaint=complaint,
        new_priority=override_in.priority,
        reason=override_in.reason,
        admin=current_user
    )
    return updated

@router.post("/{id}/resolve", response_model=ComplaintDetailResponse)
def resolve_ticket(
    id: int,
    resolve_in: ComplaintResolve,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Marks a complaint as resolved with detailed resolution notes."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "staff" and complaint.assigned_staff_id != current_user.id:
        raise HTTPException(status_code=403, detail="Staff can only resolve tickets assigned to them.")

    updated = service_resolve_complaint(
        db=db,
        complaint=complaint,
        resolution_notes=resolve_in.resolution_notes,
        actor=current_user
    )
    return updated

@router.post("/{id}/reopen", response_model=ComplaintDetailResponse)
def reopen_ticket(
    id: int,
    reopen_in: ComplaintReopen,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reopens a resolved or closed complaint if issue persists."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint.status not in ["Resolved", "Closed"]:
        raise HTTPException(status_code=400, detail="Only Resolved or Closed complaints can be reopened.")

    updated = service_reopen_complaint(
        db=db,
        complaint=complaint,
        reopen_reason=reopen_in.reason,
        student=current_user
    )
    return updated

@router.post("/{id}/comments", response_model=CommentResponse)
def add_comment(
    id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adds a comment or maintenance work note."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # If student, verify ownership and prevent internal note
    if current_user.role == "student":
        if complaint.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden: Not your complaint.")
        if comment_in.is_internal:
            raise HTTPException(status_code=403, detail="Students cannot post internal staff notes.")

    comment = ComplaintComment(
        complaint_id=complaint.id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_role=current_user.role,
        message=comment_in.message.strip(),
        is_internal=comment_in.is_internal if current_user.role in ["staff", "admin"] else False
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Log in history
    log_history(
        db=db,
        complaint_id=complaint.id,
        actor=current_user,
        action_type="comment_added",
        old_value=None,
        new_value=None,
        notes=f"{'[INTERNAL NOTE] ' if comment.is_internal else ''}{current_user.full_name}: {comment.message[:80]}..."
    )

    # Dispatch notification to other party
    if current_user.id == complaint.student_id:
        # Notify assigned staff or admins
        if complaint.assigned_staff_id:
            create_notification(
                db=db,
                user_id=complaint.assigned_staff_id,
                title=f"New Comment on {complaint.complaint_id}",
                message=f"Resident {current_user.full_name} commented: '{comment.message[:100]}'",
                type="note",
                complaint_id=complaint.id,
                complaint_uid=complaint.complaint_id
            )
    else:
        # Notify student if not an internal note
        if not comment.is_internal:
            create_notification(
                db=db,
                user_id=complaint.student_id,
                title=f"Update on Complaint {complaint.complaint_id}",
                message=f"{current_user.full_name} ({current_user.role.title()}): '{comment.message[:100]}'",
                type="note",
                complaint_id=complaint.id,
                complaint_uid=complaint.complaint_id
            )

    return comment
