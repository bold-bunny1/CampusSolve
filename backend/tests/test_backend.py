import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.session import Base, get_db
from app.main import app
from app.database.seed import seed_database
from app.core.priority_engine import evaluate_priority
from app.core.sla_engine import check_overdue
from datetime import datetime, timedelta, timezone

# In-memory test SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

# 1. AUTH & ROLES TESTS
def test_login_admin(client):
    res = client.post("/api/v1/auth/login", json={"email": "admin@hostelpulse.com", "password": "Admin@123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_login_student(client):
    res = client.post("/api/v1/auth/login", json={"email": "arjun@student.com", "password": "Student@123"})
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "student"

def test_login_staff(client):
    res = client.post("/api/v1/auth/login", json={"email": "electrician@hostelpulse.com", "password": "Staff@123"})
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "staff"

def test_login_invalid_credentials(client):
    res = client.post("/api/v1/auth/login", json={"email": "admin@hostelpulse.com", "password": "WrongPassword"})
    assert res.status_code == 401

def test_student_registration(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "newstudent@test.com",
        "password": "Password123",
        "full_name": "Test Student",
        "role": "student",
        "room_number": "301",
        "block": "Block C",
        "floor": 3
    })
    assert res.status_code == 201
    assert res.json()["user"]["email"] == "newstudent@test.com"

# 2. PRIORITY ENGINE TESTS
def test_priority_safety_hazard():
    res = evaluate_priority(
        category="Electrical",
        urgency_level="Emergency",
        impact_level="Entire Floor",
        title="Sparks and exposed wire in hallway",
        description="Dangerous exposed wiring with smoke"
    )
    assert res["priority"] == "Critical"
    assert res["is_safety_hazard"] is True
    assert "Immediate safety hazard" in res["priority_reason"]

def test_priority_routine_furniture():
    res = evaluate_priority(
        category="Furniture",
        urgency_level="Low",
        impact_level="Single Room",
        title="Slight squeak in study chair",
        description="Chair leg makes small sound"
    )
    assert res["priority"] == "Low"
    assert res["is_safety_hazard"] is False

# 3. COMPLAINT WORKFLOW & STUDENT ISOLATION
def test_student_isolation(client):
    # Login as Priya
    priya_res = client.post("/api/v1/auth/login", json={"email": "priya@student.com", "password": "Student@123"})
    priya_token = priya_res.json()["access_token"]
    priya_headers = {"Authorization": f"Bearer {priya_token}"}

    # Arjun's complaint is HP-1001 (ID 1)
    # Priya tries to read HP-1001
    res = client.get("/api/v1/complaints/1", headers=priya_headers)
    assert res.status_code == 403
    assert "forbidden" in res.json()["detail"].lower()

def test_student_create_complaint(client):
    arjun_res = client.post("/api/v1/auth/login", json={"email": "arjun@student.com", "password": "Student@123"})
    arjun_token = arjun_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {arjun_token}"}

    form_data = {
        "title": "Study table bulb socket spark",
        "description": "The bulb socket had an electrical spark when plugging in charger.",
        "category": "Electrical",
        "block": "Block B",
        "floor": "2",
        "location": "Room 204 Desk",
        "impact_level": "Single Room",
        "urgency_level": "Emergency"
    }
    res = client.post("/api/v1/complaints", data=form_data, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["complaint_id"].startswith("HP-")
    assert data["priority"] in ["Critical", "High"]
    assert data["status"] == "Submitted"

# 4. ADMIN ASSIGNMENT & LIFECYCLE
def test_admin_assignment_and_status(client):
    admin_res = client.post("/api/v1/auth/login", json={"email": "admin@hostelpulse.com", "password": "Admin@123"})
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Assign staff to complaint ID 3 (HP-1003)
    assign_res = client.post("/api/v1/complaints/3/assign", json={
        "assigned_staff_id": 3, # Plumber Manoj Singh
        "notes": "Urgent attention needed for 2nd floor common washroom"
    }, headers=admin_headers)
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_staff_id"] == 3
    assert assign_res.json()["status"] == "Assigned"

# 5. STAFF RESOLUTION
def test_staff_resolve(client):
    plumber_res = client.post("/api/v1/auth/login", json={"email": "plumber@hostelpulse.com", "password": "Staff@123"})
    plumber_token = plumber_res.json()["access_token"]
    plumber_headers = {"Authorization": f"Bearer {plumber_token}"}

    # First move to In Progress
    trans_res = client.patch("/api/v1/complaints/3/status", json={"status": "In Progress"}, headers=plumber_headers)
    assert trans_res.status_code == 200

    # Resolve complaint 3
    resolve_res = client.post("/api/v1/complaints/3/resolve", json={
        "resolution_notes": "Cleaned the drain strainer and tightened the tap spindle."
    }, headers=plumber_headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "Resolved"
    assert resolve_res.json()["resolved_at"] is not None

# 6. STUDENT REOPEN
def test_student_reopen_complaint(client):
    # Complaint 5 was resolved (HP-1005 owned by Priya)
    priya_res = client.post("/api/v1/auth/login", json={"email": "priya@student.com", "password": "Student@123"})
    priya_token = priya_res.json()["access_token"]
    priya_headers = {"Authorization": f"Bearer {priya_token}"}

    reopen_res = client.post("/api/v1/complaints/5/reopen", json={
        "reason": "Chair wheel is slipping again on tiled surface"
    }, headers=priya_headers)
    assert reopen_res.status_code == 200
    assert reopen_res.json()["status"] == "Reopened"

# 7. NOTIFICATIONS
def test_notifications(client):
    arjun_res = client.post("/api/v1/auth/login", json={"email": "arjun@student.com", "password": "Student@123"})
    arjun_token = arjun_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {arjun_token}"}

    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) > 0

    count_res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert count_res.status_code == 200
    assert "unread_count" in count_res.json()

# 8. ANALYTICS & RECURRING DETECTION
def test_admin_analytics_and_recurring(client):
    admin_res = client.post("/api/v1/auth/login", json={"email": "admin@hostelpulse.com", "password": "Admin@123"})
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    analytics_res = client.get("/api/v1/analytics/dashboard", headers=admin_headers)
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert data["total_complaints"] >= 7
    assert "by_category" in data
    assert "staff_workload" in data
    assert len(data["staff_workload"]) >= 3

    recurring_res = client.get("/api/v1/analytics/recurring", headers=admin_headers)
    assert recurring_res.status_code == 200
    clusters = recurring_res.json()
    # At least Block B Floor 2 Plumbing should be flagged
    assert len(clusters) > 0
    plumbing_cluster = next((c for c in clusters if c["category"] == "Plumbing" and c["block"] == "Block B"), None)
    assert plumbing_cluster is not None
    assert plumbing_cluster["total_complaints"] >= 2
