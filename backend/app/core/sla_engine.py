"""
HostelPulse SLA & Overdue Engine
Computes expected resolution targets and assesses overdue state based on priority.
"""

from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional

# Default resolution SLAs in hours
SLA_HOURS_MAP = {
    "Critical": 6,
    "High": 24,
    "Medium": 48,
    "Low": 72
}

def get_default_target_date(priority: str, base_time: Optional[datetime] = None) -> datetime:
    """Calculates default target resolution timestamp from priority."""
    if base_time is None:
        base_time = datetime.now(timezone.utc)
    elif base_time.tzinfo is None:
        base_time = base_time.replace(tzinfo=timezone.utc)
        
    hours = SLA_HOURS_MAP.get(priority, 48)
    return base_time + timedelta(hours=hours)

def check_overdue(
    status: str,
    target_date: Optional[datetime],
    priority: str,
    created_at: Optional[datetime] = None
) -> Tuple[bool, int, str]:
    """
    Checks if a complaint is overdue.
    Returns: (is_overdue, overdue_by_hours, explanation)
    """
    # Resolved or Closed complaints cannot be overdue
    if status in ["Resolved", "Closed"]:
        return False, 0, "Resolved / Closed"

    # Paused while On Hold
    if status == "On Hold":
        return False, 0, "SLA Timer Paused (Complaint On Hold)"

    now = datetime.now(timezone.utc)
    
    # If no explicit target_date set, compute default from created_at
    effective_target = target_date
    if not effective_target:
        if created_at:
            effective_target = get_default_target_date(priority, created_at)
        else:
            return False, 0, "No target SLA configured"

    if effective_target.tzinfo is None:
        effective_target = effective_target.replace(tzinfo=timezone.utc)

    if now > effective_target:
        diff_seconds = (now - effective_target).total_seconds()
        overdue_hours = max(1, int(diff_seconds // 3600))
        return True, overdue_hours, f"Overdue by {overdue_hours}h (Target was {effective_target.strftime('%Y-%m-%d %H:%M UTC')})"
    else:
        remaining_seconds = (effective_target - now).total_seconds()
        remaining_hours = max(0, int(remaining_seconds // 3600))
        return False, 0, f"Within SLA ({remaining_hours}h remaining)"
