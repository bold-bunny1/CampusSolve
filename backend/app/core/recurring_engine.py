"""
HostelPulse Recurring Issue Detection Engine
Analyzes complaints sharing category, block, and floor within a rolling window.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.complaint import Complaint

DEFAULT_LOOKBACK_DAYS = 14
RECURRING_THRESHOLD = 2  # 2 or more complaints in same category, block, and floor

def scan_and_tag_recurring(db: Session, lookback_days: int = DEFAULT_LOOKBACK_DAYS) -> int:
    """
    Scans the complaints table and updates recurring flags and cluster descriptions.
    Returns number of complaints flagged as recurring.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=lookback_days)
    
    # Fetch all complaints in lookback window
    complaints = db.query(Complaint).filter(Complaint.created_at >= cutoff).all()
    
    # Group by (category, block, floor)
    clusters: Dict[tuple, List[Complaint]] = {}
    for c in complaints:
        key = (c.category.strip().title(), c.block.strip().title(), c.floor)
        if key not in clusters:
            clusters[key] = []
        clusters[key].append(c)

    flagged_count = 0
    for (category, block, floor), group in clusters.items():
        if len(group) >= RECURRING_THRESHOLD:
            uid_list = [c.complaint_id for c in group]
            cluster_text = (
                f"Recurring cluster detected: {len(group)} '{category}' complaints "
                f"in {block}, Floor {floor} within the last {lookback_days} days. "
                f"Associated tickets: {', '.join(uid_list)}."
            )
            for c in group:
                c.is_recurring = True
                c.recurring_cluster_info = cluster_text
                flagged_count += 1
        else:
            for c in group:
                c.is_recurring = False
                c.recurring_cluster_info = None

    db.commit()
    return flagged_count

def get_recurring_clusters(db: Session, lookback_days: int = DEFAULT_LOOKBACK_DAYS) -> List[Dict[str, Any]]:
    """Returns clustered recurring groups with associated complaints for admin dashboard."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=lookback_days)
    complaints = db.query(Complaint).filter(Complaint.created_at >= cutoff).all()

    clusters: Dict[tuple, List[Complaint]] = {}
    for c in complaints:
        key = (c.category.strip().title(), c.block.strip().title(), c.floor)
        if key not in clusters:
            clusters[key] = []
        clusters[key].append(c)

    result = []
    for (category, block, floor), group in clusters.items():
        if len(group) >= RECURRING_THRESHOLD:
            open_count = sum(1 for item in group if item.status not in ["Resolved", "Closed"])
            result.append({
                "category": category,
                "block": block,
                "floor": floor,
                "total_complaints": len(group),
                "open_complaints": open_count,
                "complaint_ids": [c.complaint_id for c in group],
                "latest_complaint_date": max(c.created_at for c in group).isoformat() if group else None,
                "complaints": [
                    {
                        "id": c.id,
                        "complaint_id": c.complaint_id,
                        "title": c.title,
                        "status": c.status,
                        "priority": c.priority,
                        "location": c.location,
                        "created_at": c.created_at.isoformat() if c.created_at else None
                    }
                    for c in group
                ]
            })

    # Sort clusters by highest total complaints then open complaints
    result.sort(key=lambda x: (x["open_complaints"], x["total_complaints"]), reverse=True)
    return result
