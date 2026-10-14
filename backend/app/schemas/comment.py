from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class CommentCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    is_internal: bool = False

class CommentResponse(BaseModel):
    id: int
    complaint_id: int
    user_id: int
    user_name: str
    user_role: str
    message: str
    is_internal: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
