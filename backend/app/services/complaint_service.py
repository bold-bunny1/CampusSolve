from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status

from app.models.complaint import Complaint
from app.models.history import ComplaintHistory
from app.models.comment import ComplaintComment
from app.models.user import User
from app.core.priority_engine import evaluate_priority
from app.core.sla_engine import get_default_target_date, check_overdue
from app.core.recurring_engine import scan_and_tag_recurring
from app.services.notification_service import create_notification, notify_admins

VALID_TRANSITIONS = {
    "Submitted": ["Acknowledged", "Assigned", "Closed"],
    "Acknowledged": ["Assigned", "In Progress", "On Hold", "Closed"],
    "Assigned": ["In Progress", "On Hold", "Closed"],
    "In Progress": ["On Hold", "Resolved", "Closed"],
    "On Hold": ["In Progress", "Assigned", "Closed"],
    "Resolved": ["Closed", "Reopened"],
    "Closed": ["Reopened"],
    "Reopened": ["Acknowledged", "Assigned", "In Progress"],
}

def generate_next_complaint_id(db: Session) -> str:
    """Generates sequential complaint ID starting from HP-1001."""
    last_complaint = db.query(Complaint).order_by(desc(Complaint.id)).first()
    if not last_complaint:
        return "HP-1001"
    
    # Try parsing last complaint ID
    try:
        current_num = int(last_complaint.complaint_id.split("-")[1])
        next_num = max(current_num + 1, last_complaint.id + 1001)
        return f"HP-{next_num}"
    except Exception:
        return f"HP-{1000 + last_complaint.id + 1}"

def log_history(
    db: Session,
    complaint_id: int,
    actor: User,
    action_type: str,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    notes: Optional[str] = None
) -> ComplaintHistory:
    history = ComplaintHistory(
        complaint_id=complaint_id,
        actor_id=actor.id if actor else None,
        actor_name=actor.full_name if actor else "System",
        actor_role=actor.role if actor else "system",
        action_type=action_type,
        old_value=old_value,
        new_value=new_value,
        notes=notes
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history

def create_complaint(
    db: Session,
    student: User,
    title: str,
    description: str,
    category: str,
    block: str,
    floor: int,
    location: str,
    impact_level: str,
    urgency_level: str,
    image_url: Optional[str] = None
) -> Complaint:
    # 1. Deterministic priority evaluation
    priority_result = evaluate_priority(
        category=category,
        urgency_level=urgency_level,
        impact_level=impact_level,
        title=title,
        description=description
    )

    complaint_uid = generate_next_complaint_id(db)
    target_sla = get_default_target_date(priority_result["priority"])

    complaint = Complaint(
        complaint_id=complaint_uid,
        title=title,
        description=description,
        category=category,
        block=block,
        floor=floor,
        location=location,
        impact_level=impact_level,
        urgency_level=urgency_level,
        priority=priority_result["priority"],
        priority_reason=priority_result["priority_reason"],
        is_safety_hazard=priority_result["is_safety_hazard"],
        safety_review_notes=priority_result["safety_review_notes"],
        status="Submitted",
        student_id=student.id,
        image_url=image_url,
        target_resolution_date=target_sla
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # 2. Record initial history
    log_history(
        db=db,
        complaint_id=complaint.id,
        actor=student,
        action_type="submitted",
        old_value=None,
        new_value="Submitted",
        notes=f"Complaint created by resident {student.full_name}. Priority: {complaint.priority}"
    )

    # 3. Notification to resident
    create_notification(
        db=db,
        user_id=student.id,
        title=f"Complaint Received ({complaint.complaint_id})",
        message=f"Your complaint '{title}' was submitted successfully with {complaint.priority} priority.",
        type="submission",
        complaint_id=complaint.id,
        complaint_uid=complaint.complaint_id
    )

    # 4. If safety hazard or Critical, notify all admins immediately
    if complaint.is_safety_hazard or complaint.priority == "Critical":
        notify_admins(
            db=db,
            title=f"CRITICAL SAFETY ALERT ({complaint.complaint_id})",
            message=f"{complaint.priority} complaint submitted at {block}, Floor {floor} ({location}). {priority_result['priority_reason']}",
            type="alert",
            complaint_id=complaint.id,
            complaint_uid=complaint.complaint_id
        )

    # 5. Scan recurring issues
    try:
        scan_and_tag_recurring(db)
        db.refresh(complaint)
    except Exception:
        pass

    return complaint

def transition_status(
    db: Session,
    complaint: Complaint,
    new_status: str,
    actor: User,
    notes: Optional[str] = None,
    hold_reason: Optional[str] = None
) -> Complaint:
    current_status = complaint.status

    if new_status == current_status:
        return complaint

    # Role validation
    if actor.role == "student":
        # Student can only reopen or close their own complaint
        if new_status not in ["Reopened", "Closed"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Students can only reopen resolved complaints or close their own tickets."
            )
    elif actor.role == "staff":
        # Staff can only transition assigned tickets
        if complaint.assigned_staff_id != actor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff may only update tasks assigned to them."
            )
        if new_status not in ["In Progress", "On Hold", "Resolved"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Staff cannot transition ticket from {current_status} to {new_status}."
            )

    # Validate state machine rules
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{current_status}' to '{new_status}'. Allowed transitions: {', '.join(allowed)}."
        )

    if new_status == "On Hold" and not hold_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A hold reason must be provided when putting a complaint On Hold."
        )

    complaint.status = new_status
    if new_status == "On Hold":
        complaint.hold_reason = hold_reason
    elif current_status == "On Hold" and new_status != "On Hold":
        complaint.hold_reason = None

    db.commit()
    db.refresh(complaint)

    # Log audit entry
    log_history(
        db=db,
        complaint_id=complaint.id,
        actor=actor,
        action_type="status_change",
        old_value=current_status,
        new_value=new_status,
        notes=notes or (f"Hold reason: {hold_reason}" if hold_reason else None)
    )

    # Notify student
    create_notification(
        db=db,
        user_id=complaint.student_id,
        title=f"Status Updated: {new_status} ({complaint.complaint_id})",
        message=f"Your complaint '{complaint.title}' is now '{new_status}'. {notes or ''}",
        type="status_change",
        complaint_id=complaint.id,
        complaint_uid=complaint.complaint_id
    )

    return complaint

def assign_complaint(
    db: Session,
    complaint: Complaint,
    staff: User,
    admin: User,
    target_date: Optional[datetime] = None,
    notes: Optional[str] = None
) -> Complaint:
    if staff.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned user must have 'staff' role."
        )

    old_staff_id = complaint.assigned_staff_id
    old_staff_name = complaint.assigned_staff.full_name if complaint.assigned_staff else "Unassigned"

    complaint.assigned_staff_id = staff.id
    if target_date:
        complaint.target_resolution_date = target_date

    # If current status is Submitted or Acknowledged, advance to Assigned
    if complaint.status in ["Submitted", "Acknowledged"]:
        complaint.status = "Assigned"

    db.commit()
    db.refresh(complaint)

    # History audit
    log_history(
        db=db,
        complaint_id=complaint.id,
        actor=admin,
        action_type="assignment" if not old_staff_id else "reassignment",
        old_value=old_staff_name,
        new_value=staff.full_name,
        notes=f"Target SLA: {complaint.target_resolution_date}. Note: {notes or 'None'}"
    )

    # Notify staff
    create_notification(
        db=db,
        user_id=staff.id,
        title=f"New Task Assigned ({complaint.complaint_id})",
        message=f"You have been assigned to: '{complaint.title}' ({complaint.priority} Priority, {complaint.block} {complaint.location}).",
        type="assignment",
        complaint_id=complaint.id,
        complaint_uid=complaint.complaint_id
    )

    # Notify student
    create_notification(
        db=db,
        user_id=complaint.student_id,
        title=f"Staff Assigned ({complaint.complaint_id})",
        message=f"{staff.full_name} ({staff.specialization or 'Maintenance'}) has been assigned to resolve your issue.",
        type="assignment",
        complaint_id=complaint.id,
        complaint_uid=complaint.complaint_id
    )

    return complaint

def override_priority(
    db: Session,
    complaint: Complaint,
    new_priority: str,
    reason: str,
    admin: User
) -> Complaint:
    old_priority = complaint.priority
    complaint.priority = new_priority
    complaint.priority_overridden = True
    complaint.priority_override_reason = reason
    complaint.target_resolution_date = get_default_target_date(new_priority, complaint.created_at)

    db.commit()
    db.refresh(complaint)

    log_history(
        db=db,
        complaint_id=complaint.id,
        actor=admin,
        action_type="priority_override",
        old_value=old_priority,
        new_value=new_priority,
        notes=f"Warden Override Reason: {reason}"
    )

    # Notify student
    create_notification(
        db=db,
        user_id=complaint.student_id,
        title=f"Priority Adjusted ({complaint.complaint_id})",
        message=f"Complaint priority was adjusted to {new_priority} by {admin.full_name}. Reason: {reason}",
        type="priority_change",
        complaint_id=complaint.id,
        complaint_uid=complaint.complaint_id
    )

    return complaint

def resolve_complaint(
    db: Session,
    complaint: Complaint,
    resolution_notes: str,
    actor: User
) -> Complaint:
    now = datetime.now(timezone.utc)
    
    # Calculate time taken
    created_time = complaint.created_at
    if created_time.tzinfo is None:
        created_time = created_time.replace(tzinfo=timezone.utc)
    diff_minutes = max(1, int((now - created_time).total_seconds() // 60))

    complaint.status = "Resolved"
    complaint.resolved_at = now
    complaint.resolution_notes = resolution_notes
    complaint.resolved_by_id = actor.id
    complaint.resolution_time_minutes = diff_minutes
    complaint.is_overdue = False

    db.commit()
    db.refresh(complaint)

    hours = round(diff_minutes / 60.0, 1)
    log_history(
        db=db,
        complaint_id=complaint.id,
        actor=actor,
        action_type="resolution",
        old_value=complaint.status,
        new_value="Resolved",
        notes=f"Resolution ({hours}h): {resolution_notes}"
    )

    # Notify student
    create_notification(
        db=db,
        user_id=complaint.student_id,
        title=f"Issue Resolved ({complaint.complaint_id})",
        message=f"Your complaint has been marked Resolved by {actor.full_name}. Resolution note: '{resolution_notes}'. If the issue persists, you may reopen it.",
        type="resolution",
        complaint_id=complaint.id,
        complaint_uid=complaint.complaint_id
    )

    return complaint

def reopen_complaint(
    db: Session,
    complaint: Complaint,
    reopen_reason: str,
    student: User
) -> Complaint:
    if complaint.student_id != student.id and student.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are only permitted to reopen your own complaints."
        )

    old_status = complaint.status
    complaint.status = "Reopened"
    # Reset SLA for reopened complaint
    complaint.target_resolution_date = get_default_target_date(complaint.priority)
    complaint.resolved_at = None
    complaint.resolution_time_minutes = None

    db.commit()
    db.refresh(complaint)

    log_history(
        db=db,
        complaint_id=complaint.id,
        actor=student,
        action_type="reopened",
        old_value=old_status,
        new_value="Reopened",
        notes=f"Resident reopened ticket. Reason: {reopen_reason}"
    )

    # Notify assigned staff if any
    if complaint.assigned_staff_id:
        create_notification(
            db=db,
            user_id=complaint.assigned_staff_id,
            title=f"Complaint Reopened ({complaint.complaint_id})",
            message=f"Resident {student.full_name} reopened ticket '{complaint.title}'. Reason: {reopen_reason}",
            type="reopened",
            complaint_id=complaint.id,
            complaint_uid=complaint.complaint_id
        )

    # Notify admins
    notify_admins(
        db=db,
        title=f"Ticket Reopened ({complaint.complaint_id})",
        message=f"Resident {student.full_name} reopened '{complaint.title}'. Reason: {reopen_reason}",
        type="reopened",
        complaint_id=complaint.id,
        complaint_uid=complaint.complaint_id
    )

    return complaint

def refresh_overdue_statuses(db: Session):
    """Refreshes overdue status for open tickets."""
    open_complaints = db.query(Complaint).filter(Complaint.status.notin_(["Resolved", "Closed"])).all()
    for c in open_complaints:
        is_overdue, overdue_hours, _ = check_overdue(
            status=c.status,
            target_date=c.target_resolution_date,
            priority=c.priority,
            created_at=c.created_at
        )
        c.is_overdue = is_overdue
        c.overdue_by_hours = overdue_hours
    db.commit()
