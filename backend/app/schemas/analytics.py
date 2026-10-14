from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class StaffWorkloadItem(BaseModel):
    staff_id: int
    full_name: str
    email: str
    specialization: Optional[str] = None
    active_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int

class CategoryMetricItem(BaseModel):
    category: str
    count: int
    percentage: float

class BlockMetricItem(BaseModel):
    block: str
    count: int

class StatusMetricItem(BaseModel):
    status: str
    count: int

class PriorityMetricItem(BaseModel):
    priority: str
    count: int

class DashboardMetricsResponse(BaseModel):
    total_complaints: int
    new_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    critical_and_high: int
    overdue_complaints: int
    recurring_groups_count: int
    average_resolution_hours: float
    resolution_rate_percent: float

    by_status: List[StatusMetricItem]
    by_category: List[CategoryMetricItem]
    by_priority: List[PriorityMetricItem]
    by_block: List[BlockMetricItem]
    staff_workload: List[StaffWorkloadItem]
