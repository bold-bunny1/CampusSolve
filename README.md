# HostelPulse — Intelligent Hostel Operations
**Centralized College Hostel Complaint Management & Operational Triage Platform**

HostelPulse is a modern full-stack web application designed for campus hostels to eliminate lost complaints, enforce transparent service-level agreements (SLAs), detect chronic infrastructure failure hotspots, and guarantee resident privacy.

---

## 1. Key Problems Solved

1. **Lost Informal Communication:** Informal verbal and messaging complaints are replaced by an immutable, sequential ticketing ledger (`HP-1001`, `HP-1002`...).
2. **Transparent Resident Tracking:** Residents track their issue along a live 6-stage lifecycle progress tracker with timestamped audit logs.
3. **Deterministic Urgency Triage:** Complaints are evaluated deterministically (Critical, High, Medium, Low) using location scope, essential services, and safety hazard detection rather than arbitrary guesswork or paid AI APIs.
4. **Recurring Hotspot Detection:** Automatically groups and flags recurring incidents occurring in the same block and floor within a rolling 14-day window.
5. **Overdue SLA Escalation:** Automatic SLA computation (Critical: 6h, High: 24h, Medium: 48h, Low: 72h) with dynamic pause handling while on hold and visual overdue alerts.
6. **Strict Role-Based Privacy (RBAC):** Students can only view their own private tickets. Cross-ticket tampering is blocked at the backend with HTTP 403 Forbidden.

---

## 2. Technology Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, React Router 7, Lucide React icons, Native Fetch API.
- **Backend:** Python 3.14 / 3.11+, FastAPI, Pydantic v2, SQLAlchemy ORM 2.x, SQLite, Uvicorn, PyJWT, Bcrypt.
- **Testing:** Pytest, HTTPX / TestClient.
- **Storage:** SQLite file-based persistent database (`hostelpulse.db`) with zero external cloud dependencies. Local file storage for photos with strict MIME and extension validation.

---

## 3. Project Architecture

```
hostelpulse/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── analytics.py      # Real-time metrics & recurring clusters
│   │   │       ├── auth.py           # JWT auth, register, login, profile
│   │   │       ├── complaints.py     # Complaint CRUD, upload, lifecycle
│   │   │       ├── deps.py           # Dependency injection & RBAC guards
│   │   │       ├── notifications.py  # In-app notification center
│   │   │       └── users.py          # Staff & resident management
│   │   ├── core/
│   │   │   ├── config.py             # App settings, CORS, upload config
│   │   │   ├── priority_engine.py    # Deterministic priority & safety engine
│   │   │   ├── recurring_engine.py   # Hotspot & recurring cluster detector
│   │   │   ├── security.py           # Bcrypt hashing & PyJWT tokens
│   │   │   └── sla_engine.py         # SLA calculations & overdue checker
│   │   ├── database/
│   │   │   ├── seed.py               # Idempotent demo database seeder
│   │   │   └── session.py            # SQLAlchemy session & Base
│   │   ├── models/                   # SQLAlchemy ORM models (User, Complaint, History, Comment, Notification)
│   │   ├── schemas/                  # Pydantic v2 validation models
│   │   ├── services/                 # Business logic services
│   │   └── main.py                   # FastAPI entrypoint, CORS, lifespan
│   ├── tests/
│   │   └── test_backend.py           # Comprehensive pytest suite (14 test cases)
│   ├── uploads/                      # Safely sanitized image uploads
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/               # StatusBadge, PriorityBadge, Modals, Navbar, Sidebar
│   │   ├── context/                  # AuthContext with 1-click demo role switcher
│   │   ├── layouts/                  # DashboardLayout
│   │   ├── pages/                    # Login, StudentDashboard, ComplaintForm, Detail, Admin, Staff
│   │   ├── services/                 # Centralized API client (api.js)
│   │   ├── App.jsx                   # Role-guarded routing
│   │   └── index.css                 # Tailwind CSS v4 styling
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── index.html
├── .gitignore
└── README.md
```

---

## 4. Pre-Seeded Demo Accounts for Judges

The application includes an idempotent database seeder and a **sticky 1-click Demo Switcher Bar** in the frontend header to quickly toggle between roles:

| Role | Name / Designation | Email | Password | Primary Capabilities |
|---|---|---|---|---|
| **Hostel Admin** | Chief Warden Sharma | `admin@hostelpulse.com` | `Admin@123` | Master triage, staff assignment, priority override, SLA analytics, recurring hotspots |
| **Resident Student 1** | Arjun Mehta (Room 204) | `arjun@student.com` | `Student@123` | Submit issues, track live status, work notes, reopen resolved issues |
| **Resident Student 2** | Priya Sharma (Room 102) | `priya@student.com` | `Student@123` | Demonstrates student privacy isolation (cannot view Arjun's tickets) |
| **Maintenance Staff** | Rajesh Kumar (Electrical) | `electrician@hostelpulse.com` | `Staff@123` | View assigned electrical tasks, update progress, add technician notes |
| **Maintenance Staff** | Manoj Singh (Plumbing) | `plumber@hostelpulse.com` | `Staff@123` | View plumbing assignments, record formal resolution report |

---

## 5. Step-by-Step Local Setup Guide

### Step 1: Clone or Navigate to the Project

```bash
cd hostelpulse
```

### Step 2: Set Up Backend (Python FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows:**
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create the `.env` file (optional, defaults are auto-configured):
   ```bash
   cp .env.example .env
   ```

5. Run automated tests to verify your setup:
   ```bash
   pytest tests/test_backend.py -v
   ```
   *Expected output: `14 passed in ~6s`*

6. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Root: `http://127.0.0.1:8000/`
   - Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`
   - Health Check: `http://127.0.0.1:8000/health`

### Step 3: Set Up Frontend (React + Vite)

1. Open a **new terminal** and navigate to the frontend directory:
   ```bash
   cd hostelpulse/frontend
   ```

2. Install Node.js packages:
   ```bash
   npm install
   ```

3. Configure environment file:
   ```bash
   cp .env.example .env
   ```

4. Run the frontend development server:
   ```bash
   npm run dev
   ```
   - Local Web Application: `http://localhost:5173`

---

## 6. End-to-End Verification Workflow

1. Open `http://localhost:5173` in your browser.
2. Click **"Student (Arjun 204)"** in the top Demo Switcher Bar.
3. Click **"Report a Problem"**:
   - Title: `Water pipe burst in washroom ceiling`
   - Category: `Plumbing`
   - Block: `Block B`, Floor: `2`, Room: `Common Washroom`
   - Scope: `Entire Floor`, Urgency: `High`
   - Notice the **Live Priority Engine Preview** dynamically calculates `High Priority`.
   - Submit the complaint.
4. Note the generated ticket ID (e.g. `HP-1008`) and the instant in-app notification bell update.
5. In the top bar, click **"Admin (Warden)"**:
   - The admin dashboard shows the new ticket in the master registry.
   - Click the blue **Assign** icon on the ticket and select technician **"Manoj Singh (Plumbing)"**.
   - Set an SLA target or keep the default rule. Confirm assignment.
6. In the top bar, click **"Staff (Plumber)"**:
   - Manoj Singh's dashboard now displays the assigned task.
   - Click **"Start Work"** (status moves to `In Progress`).
   - Click **"View Record"**, post a work note: *"Main isolation valve shut off; welding joint."*
   - Click **"Complete & Resolve"**, input resolution details, and confirm.
7. Switch back to **"Student (Arjun 204)"**:
   - Arjun receives an instant in-app notification confirming ticket resolution.
   - The ticket displays the resolution notes and technician timestamp.
   - If the problem recurs, Arjun can click **"Reopen Complaint"** with a persistence reason.

---

## 7. Engine Specifications

### A. Deterministic Priority Engine (`app/core/priority_engine.py`)
- Evaluates:
  1. **Selected Urgency:** Low (10), Medium (25), High (45), Emergency (70).
  2. **Location Scope:** Single Room (15), Entire Floor (35), Entire Wing/Block (60).
  3. **Critical Utilities:** Electrical, Security, Water Supply baseline score boost.
  4. **Hazard Keyword Detection:** Scans text for safety hazard triggers (`spark`, `exposed wire`, `shock`, `fire`, `smoke`, `flood`, `broken lock`, `gas`).
  5. **Time Escalation:** Automatically escalates tickets open > 48h/72h without intervention.
- Emits human-readable rationale and sets `is_safety_hazard=True` with human safety review warning.
- Admins can override priority with a mandatory audit justification reason.

### B. Recurring Issue Cluster Engine (`app/core/recurring_engine.py`)
- Groups complaints by `(category, block, floor)` within a rolling 14-day window.
- Clusters with $\ge 2$ tickets are automatically tagged as **Recurring Hotspots** with associated ticket cross-references.

### C. SLA & Overdue Engine (`app/core/sla_engine.py`)
- SLA resolution benchmarks:
  - **Critical:** 6 hours
  - **High:** 24 hours
  - **Medium:** 48 hours
  - **Low:** 72 hours
- Dynamically freezes the countdown when a ticket is placed **On Hold** (e.g., awaiting spare parts).
- Flags breached open tickets with `is_overdue=True` and `overdue_by_hours`.

---

## 8. Common Errors & Troubleshooting

- **CORS Error in Browser:** Ensure backend is running on `http://127.0.0.1:8000` and frontend on `http://localhost:5173`. CORS origins are pre-configured in `backend/app/core/config.py`.
- **Database Reset:** To completely re-seed the SQLite database, delete `backend/hostelpulse.db` and restart the backend server; tables and demo data will be regenerated automatically.
- **Port Conflicts:** If port 8000 is occupied, run `python -m uvicorn app.main:app --port 8080` and update `VITE_API_URL` in `frontend/.env`.

---

## 9. Team Collaboration & Git Workflow

For a 4-person development team:
1. **Branch Strategy:**
   - `main`: Production-ready release branch.
   - `feature/auth-rbac`: Resident and admin authentication.
   - `feature/priority-engine`: Deterministic priority and SLA computation.
   - `feature/technician-portal`: Staff assignment and resolution ledger.
   - `feature/ui-dashboard`: React frontend pages and Tailwind components.
2. **Pull Request Protocol:**
   - Run `pytest tests/test_backend.py` and `npm run build` locally before opening a pull request.
   - Require 1 approving teammate review before merging to `main`.
