"""
HostelPulse Idempotent Database Seeder
Seeds standard demo accounts, complaints across various lifecycle stages,
realistic histories, comments, and notifications for hackathon demonstrations.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.complaint import Complaint
from app.models.history import ComplaintHistory
from app.models.comment import ComplaintComment
from app.models.notification import Notification
from app.core.security import get_password_hash
from app.core.priority_engine import evaluate_priority
from app.core.sla_engine import get_default_target_date
from app.core.recurring_engine import scan_and_tag_recurring

def seed_database(db: Session) -> bool:
    """Idempotently seeds initial users and complaints."""
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == "admin@hostelpulse.com").first()
    if existing_admin:
        # Already seeded, refresh recurring scan & overdue
        scan_and_tag_recurring(db)
        return False

    now = datetime.now(timezone.utc)

    # 1. Seed Users
    users_data = [
        {
            "email": "admin@hostelpulse.com",
            "full_name": "Chief Warden Sharma",
            "role": "admin",
            "password": "Admin@123",
            "phone": "+91 98765 43210",
        },
        {
            "email": "electrician@hostelpulse.com",
            "full_name": "Rajesh Kumar (Electrical)",
            "role": "staff",
            "specialization": "Electrical",
            "password": "Staff@123",
            "phone": "+91 98111 22334",
        },
        {
            "email": "plumber@hostelpulse.com",
            "full_name": "Manoj Singh (Plumbing)",
            "role": "staff",
            "specialization": "Plumbing",
            "password": "Staff@123",
            "phone": "+91 98222 33445",
        },
        {
            "email": "cleaning@hostelpulse.com",
            "full_name": "Sunil Verma (Housekeeping)",
            "role": "staff",
            "specialization": "Cleanliness",
            "password": "Staff@123",
            "phone": "+91 98333 44556",
        },
        {
            "email": "arjun@student.com",
            "full_name": "Arjun Mehta",
            "role": "student",
            "block": "Block B",
            "floor": 2,
            "room_number": "Room 204",
            "password": "Student@123",
            "phone": "+91 98444 55667",
        },
        {
            "email": "priya@student.com",
            "full_name": "Priya Sharma",
            "role": "student",
            "block": "Block A",
            "floor": 1,
            "room_number": "Room 102",
            "password": "Student@123",
            "phone": "+91 98555 66778",
        },
        {
            "email": "rohan@student.com",
            "full_name": "Rohan Verma",
            "role": "student",
            "block": "Block B",
            "floor": 2,
            "room_number": "Room 208",
            "password": "Student@123",
            "phone": "+91 98666 77889",
        },
    ]

    users_map = {}
    for u in users_data:
        pwd = u.pop("password")
        user = User(
            hashed_password=get_password_hash(pwd),
            is_active=True,
            **u
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        users_map[user.email] = user

    admin = users_map["admin@hostelpulse.com"]
    electrician = users_map["electrician@hostelpulse.com"]
    plumber = users_map["plumber@hostelpulse.com"]
    housekeeper = users_map["cleaning@hostelpulse.com"]
    arjun = users_map["arjun@student.com"]
    priya = users_map["priya@student.com"]
    rohan = users_map["rohan@student.com"]

    # 2. Seed Complaints
    complaints_data = [
        {
            "complaint_id": "HP-1001",
            "title": "Exposed high voltage wiring near corridor switchboard with sparks",
            "description": "The switchboard casing in the 2nd floor corridor has cracked open. Exposed copper wires are sparking whenever lights are switched on. Very dangerous for students passing by.",
            "category": "Electrical",
            "block": "Block B",
            "floor": 2,
            "location": "Corridor near Room 204",
            "impact_level": "Entire Floor",
            "urgency_level": "Emergency",
            "status": "Assigned",
            "student_id": arjun.id,
            "assigned_staff_id": electrician.id,
            "created_offset_hours": 3,
            "is_safety_hazard": True
        },
        {
            "complaint_id": "HP-1002",
            "title": "Major water pipe burst in 2nd floor common washroom",
            "description": "The overhead supply pipe has ruptured. Water is gushing onto the washroom floor and beginning to seep into the adjacent rooms.",
            "category": "Plumbing",
            "block": "Block B",
            "floor": 2,
            "location": "East Wing Common Washroom",
            "impact_level": "Entire Floor",
            "urgency_level": "High",
            "status": "In Progress",
            "student_id": arjun.id,
            "assigned_staff_id": plumber.id,
            "created_offset_hours": 5,
            "is_safety_hazard": False
        },
        {
            "complaint_id": "HP-1003",
            "title": "Continuous tap leakage and drain clogging in Floor 2 washroom",
            "description": "Tap 3 does not shut off completely, and the sink drain is backing up causing overflow in the second floor washroom.",
            "category": "Plumbing",
            "block": "Block B",
            "floor": 2,
            "location": "East Wing Washroom Basin 3",
            "impact_level": "Entire Floor",
            "urgency_level": "Medium",
            "status": "Submitted",
            "student_id": rohan.id,
            "assigned_staff_id": None,
            "created_offset_hours": 2,
            "is_safety_hazard": False
        },
        {
            "complaint_id": "HP-1004",
            "title": "Floor Wi-Fi access point showing offline / no signal",
            "description": "The corridor Wi-Fi router for Block A 1st Floor has been flashing red since yesterday evening. No student in rooms 101-110 can access academic portals.",
            "category": "Internet",
            "block": "Block A",
            "floor": 1,
            "location": "Corridor AP-1A",
            "impact_level": "Entire Floor",
            "urgency_level": "High",
            "status": "In Progress",
            "student_id": priya.id,
            "assigned_staff_id": electrician.id,
            "created_offset_hours": 18,
            "is_safety_hazard": False
        },
        {
            "complaint_id": "HP-1005",
            "title": "Study table chair caster wheel snapped off",
            "description": "One of the swivel wheels broke while studying. Chair wobbles and is uncomfortable to use for assignments.",
            "category": "Furniture",
            "block": "Block A",
            "floor": 1,
            "location": "Room 102 Desk 1",
            "impact_level": "Single Room",
            "urgency_level": "Low",
            "status": "Resolved",
            "student_id": priya.id,
            "assigned_staff_id": housekeeper.id,
            "resolved_by_id": housekeeper.id,
            "resolution_notes": "Replaced the damaged swivel caster assembly and tightened all frame bolts. Tested stable.",
            "resolution_time_minutes": 140,
            "created_offset_hours": 30,
            "is_safety_hazard": False
        },
        {
            "complaint_id": "HP-1006",
            "title": "Security latch broken on entrance fire-exit doorway",
            "description": "The emergency exit door on the ground floor does not latch shut, allowing stray animals and unauthorized external access during nighttime.",
            "category": "Security",
            "block": "Block C",
            "floor": 0,
            "location": "Ground Floor Rear Emergency Exit",
            "impact_level": "Entire Wing/Block",
            "urgency_level": "High",
            "status": "Acknowledged",
            "student_id": arjun.id,
            "assigned_staff_id": None,
            "created_offset_hours": 8,
            "is_safety_hazard": True
        },
        {
            "complaint_id": "HP-1007",
            "title": "Main MCB tripping repeatedly under load in Wing D",
            "description": "Power cuts off every 20 minutes across the 3rd floor. Staff examined yesterday but issue remains unresolved.",
            "category": "Electrical",
            "block": "Block D",
            "floor": 3,
            "location": "Floor 3 Electrical DB Box",
            "impact_level": "Entire Wing/Block",
            "urgency_level": "High",
            "status": "In Progress",
            "student_id": arjun.id,
            "assigned_staff_id": electrician.id,
            "created_offset_hours": 96, # 4 days ago -> deliberate overdue showcase!
            "is_safety_hazard": False
        }
    ]

    for item in complaints_data:
        offset_hours = item.pop("created_offset_hours")
        created_time = now - timedelta(hours=offset_hours)

        priority_res = evaluate_priority(
            category=item["category"],
            urgency_level=item["urgency_level"],
            impact_level=item["impact_level"],
            title=item["title"],
            description=item["description"],
            created_at=created_time
        )

        target_sla = created_time + timedelta(hours=6 if priority_res["priority"] == "Critical" else 24 if priority_res["priority"] == "High" else 48)

        resolved_time = None
        if item["status"] in ["Resolved", "Closed"]:
            resolved_time = created_time + timedelta(minutes=item.get("resolution_time_minutes", 120))

        # Check overdue
        is_overdue = False
        overdue_hours = 0
        if item["status"] not in ["Resolved", "Closed"] and now > target_sla:
            is_overdue = True
            overdue_hours = int((now - target_sla).total_seconds() // 3600)

        complaint = Complaint(
            complaint_id=item["complaint_id"],
            title=item["title"],
            description=item["description"],
            category=item["category"],
            block=item["block"],
            floor=item["floor"],
            location=item["location"],
            impact_level=item["impact_level"],
            urgency_level=item["urgency_level"],
            priority=priority_res["priority"],
            priority_reason=priority_res["priority_reason"],
            is_safety_hazard=priority_res["is_safety_hazard"],
            safety_review_notes=priority_res["safety_review_notes"],
            status=item["status"],
            student_id=item["student_id"],
            assigned_staff_id=item.get("assigned_staff_id"),
            target_resolution_date=target_sla,
            resolved_at=resolved_time,
            resolution_notes=item.get("resolution_notes"),
            resolved_by_id=item.get("resolved_by_id"),
            resolution_time_minutes=item.get("resolution_time_minutes"),
            is_overdue=is_overdue,
            overdue_by_hours=overdue_hours,
            created_at=created_time,
            updated_at=now
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        # Audit History
        h1 = ComplaintHistory(
            complaint_id=complaint.id,
            actor_id=complaint.student_id,
            actor_name=complaint.student.full_name,
            actor_role="student",
            action_type="submitted",
            new_value="Submitted",
            notes="Initial submission by resident.",
            created_at=created_time
        )
        db.add(h1)

        if complaint.assigned_staff_id:
            h2 = ComplaintHistory(
                complaint_id=complaint.id,
                actor_id=admin.id,
                actor_name=admin.full_name,
                actor_role="admin",
                action_type="assignment",
                old_value="Unassigned",
                new_value=complaint.assigned_staff.full_name,
                notes=f"Assigned by {admin.full_name}. Target resolution: {complaint.target_resolution_date.strftime('%b %d, %H:%M')}",
                created_at=created_time + timedelta(minutes=30)
            )
            db.add(h2)

        if complaint.status in ["In Progress", "Resolved"]:
            h3 = ComplaintHistory(
                complaint_id=complaint.id,
                actor_id=complaint.assigned_staff_id,
                actor_name=complaint.assigned_staff.full_name if complaint.assigned_staff else "Staff",
                actor_role="staff",
                action_type="status_change",
                old_value="Assigned",
                new_value="In Progress",
                notes="Technician arrived on site and initiated diagnostic troubleshooting.",
                created_at=created_time + timedelta(hours=1)
            )
            db.add(h3)

        if complaint.status == "Resolved":
            h4 = ComplaintHistory(
                complaint_id=complaint.id,
                actor_id=complaint.resolved_by_id,
                actor_name=complaint.resolved_by.full_name if complaint.resolved_by else "Staff",
                actor_role="staff",
                action_type="resolution",
                old_value="In Progress",
                new_value="Resolved",
                notes=complaint.resolution_notes,
                created_at=resolved_time
            )
            db.add(h4)

        # Work notes / comments
        if complaint.complaint_id == "HP-1002":
            c1 = ComplaintComment(
                complaint_id=complaint.id,
                user_id=plumber.id,
                user_name=plumber.full_name,
                user_role="staff",
                message="Main isolation valve shut off to arrest flooding. Replacing 1.5-inch PVC elbow fitting.",
                is_internal=False,
                created_at=created_time + timedelta(hours=1, minutes=15)
            )
            c2 = ComplaintComment(
                complaint_id=complaint.id,
                user_id=arjun.id,
                user_name=arjun.full_name,
                user_role="student",
                message="Thank you Manoj ji, water was entering room 204. Great quick response.",
                is_internal=False,
                created_at=created_time + timedelta(hours=1, minutes=45)
            )
            db.add_all([c1, c2])

        # Notifications
        n1 = Notification(
            user_id=complaint.student_id,
            complaint_id=complaint.id,
            complaint_uid=complaint.complaint_id,
            title=f"Complaint Logged: {complaint.complaint_id}",
            message=f"Ticket '{complaint.title}' has been registered with {complaint.priority} priority.",
            type="submission",
            is_read=True,
            created_at=created_time
        )
        db.add(n1)

        if complaint.assigned_staff_id:
            n2 = Notification(
                user_id=complaint.assigned_staff_id,
                complaint_id=complaint.id,
                complaint_uid=complaint.complaint_id,
                title=f"Task Assignment: {complaint.complaint_id}",
                message=f"You have been assigned to {complaint.priority} issue: {complaint.title}",
                type="assignment",
                is_read=False,
                created_at=created_time + timedelta(minutes=30)
            )
            db.add(n2)

        db.commit()

    # Scan and update recurring issue tags across all seeded tickets
    scan_and_tag_recurring(db)
    return True
