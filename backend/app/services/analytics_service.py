from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from app.models.complaint import Complaint
from app.models.user import User
from app.core.recurring_engine import get_recurring_clusters
from app.services.complaint_service import refresh_overdue_statuses

def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
    # Refresh overdue flags across all active tickets
    refresh_overdue_statuses(db)

    total_complaints = db.query(Complaint).count()
    new_complaints = db.query(Complaint).filter(Complaint.status == "Submitted").count()
    in_progress_complaints = db.query(Complaint).filter(Complaint.status == "In Progress").count()
    resolved_complaints = db.query(Complaint).filter(Complaint.status.in_(["Resolved", "Closed"])).count()
    critical_and_high = db.query(Complaint).filter(Complaint.priority.in_(["Critical", "High"])).count()
    overdue_complaints = db.query(Complaint).filter(Complaint.is_overdue == True).count()

    # Recurring clusters
    clusters = get_recurring_clusters(db)
    recurring_groups_count = len(clusters)

    # Resolution rate
    resolution_rate = round((resolved_complaints / total_complaints * 100), 1) if total_complaints > 0 else 0.0

    # Average resolution time
    avg_minutes_query = db.query(func.avg(Complaint.resolution_time_minutes)).filter(
        Complaint.status.in_(["Resolved", "Closed"]),
        Complaint.resolution_time_minutes.isnot(None)
    ).scalar()
    avg_resolution_hours = round((float(avg_minutes_query) / 60.0), 1) if avg_minutes_query else 0.0

    # By Status
    status_counts = db.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status).all()
    by_status = [{"status": row[0], "count": row[1]} for row in status_counts]

    # By Category
    category_counts = db.query(Complaint.category, func.count(Complaint.id)).group_by(Complaint.category).all()
    by_category = [
        {
            "category": row[0],
            "count": row[1],
            "percentage": round((row[1] / total_complaints * 100), 1) if total_complaints > 0 else 0.0
        }
        for row in category_counts
    ]

    # By Priority
    priority_counts = db.query(Complaint.priority, func.count(Complaint.id)).group_by(Complaint.priority).all()
    by_priority = [{"priority": row[0], "count": row[1]} for row in priority_counts]

    # By Block
    block_counts = db.query(Complaint.block, func.count(Complaint.id)).group_by(Complaint.block).all()
    by_block = [{"block": row[0], "count": row[1]} for row in block_counts]

    # Staff Workload
    staff_members = db.query(User).filter(User.role == "staff", User.is_active == True).all()
    staff_workload = []
    for staff in staff_members:
        active = db.query(Complaint).filter(
            Complaint.assigned_staff_id == staff.id,
            Complaint.status.notin_(["Resolved", "Closed"])
        ).count()
        in_prog = db.query(Complaint).filter(
            Complaint.assigned_staff_id == staff.id,
            Complaint.status == "In Progress"
        ).count()
        completed = db.query(Complaint).filter(
            Complaint.assigned_staff_id == staff.id,
            Complaint.status.in_(["Resolved", "Closed"])
        ).count()
        overdue = db.query(Complaint).filter(
            Complaint.assigned_staff_id == staff.id,
            Complaint.is_overdue == True
        ).count()

        staff_workload.append({
            "staff_id": staff.id,
            "full_name": staff.full_name,
            "email": staff.email,
            "specialization": staff.specialization,
            "active_tasks": active,
            "in_progress_tasks": in_prog,
            "completed_tasks": completed,
            "overdue_tasks": overdue
        })

    return {
        "total_complaints": total_complaints,
        "new_complaints": new_complaints,
        "in_progress_complaints": in_progress_complaints,
        "resolved_complaints": resolved_complaints,
        "critical_and_high": critical_and_high,
        "overdue_complaints": overdue_complaints,
        "recurring_groups_count": recurring_groups_count,
        "average_resolution_hours": avg_resolution_hours,
        "resolution_rate_percent": resolution_rate,
        "by_status": by_status,
        "by_category": by_category,
        "by_priority": by_priority,
        "by_block": by_block,
        "staff_workload": staff_workload
    }
