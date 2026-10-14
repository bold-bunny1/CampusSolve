from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.user import User
from app.schemas.analytics import DashboardMetricsResponse
from app.api.v1.deps import require_admin
from app.services.analytics_service import get_dashboard_metrics
from app.core.recurring_engine import get_recurring_clusters, scan_and_tag_recurring

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardMetricsResponse)
def get_metrics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Calculates all live operational statistics from persistent SQLite records."""
    return get_dashboard_metrics(db)

@router.get("/recurring")
def get_recurring_issues(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Returns recurring issue clusters identified by location and category."""
    return get_recurring_clusters(db)

@router.post("/scan-recurring")
def trigger_scan(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Triggers on-demand recurring issue analysis."""
    count = scan_and_tag_recurring(db)
    return {"message": f"Scan complete. {count} complaints tagged in recurring clusters."}
