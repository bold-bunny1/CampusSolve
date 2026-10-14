from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.notification import Notification
from app.models.user import User

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str,
    complaint_id: Optional[int] = None,
    complaint_uid: Optional[str] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        complaint_uid=complaint_uid,
        title=title,
        message=message,
        type=type,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def notify_admins(
    db: Session,
    title: str,
    message: str,
    type: str,
    complaint_id: Optional[int] = None,
    complaint_uid: Optional[str] = None
):
    admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
    for admin in admins:
        create_notification(
            db=db,
            user_id=admin.id,
            title=title,
            message=message,
            type=type,
            complaint_id=complaint_id,
            complaint_uid=complaint_uid
        )
