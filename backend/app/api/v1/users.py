from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate
from app.api.v1.deps import get_current_user, require_admin
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/staff", response_model=List[UserResponse])
def get_staff_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns active maintenance staff members for assignment workflows."""
    return db.query(User).filter(User.role == "staff", User.is_active == True).all()

@router.get("", response_model=List[UserResponse])
def list_all_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin view of all registered residents and staff."""
    return db.query(User).order_by(User.role, User.full_name).all()

@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_staff_account(
    staff_in: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin creates a new maintenance staff account."""
    existing = db.query(User).filter(User.email == staff_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    staff_user = User(
        email=staff_in.email.lower().strip(),
        hashed_password=get_password_hash(staff_in.password),
        full_name=staff_in.full_name.strip(),
        role="staff",
        specialization=staff_in.specialization or "General Maintenance",
        phone=staff_in.phone,
        is_active=True
    )
    db.add(staff_user)
    db.commit()
    db.refresh(staff_user)
    return staff_user
