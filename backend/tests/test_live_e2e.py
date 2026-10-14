import urllib.request
import urllib.parse
import json

BASE = "http://127.0.0.1:8001/api/v1"

def post(path, body, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", data=json.dumps(body).encode(), headers=headers)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def get(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", headers=headers)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def run_workflow():
    # 1. Student login
    print("Step 1: Student logs in...")
    arjun_auth = post("/auth/login", {"email": "arjun@student.com", "password": "Student@123"})
    arjun_token = arjun_auth["access_token"]
    print(f"   Student authenticated: {arjun_auth['user']['full_name']}")

    # 2 & 3: Submit complaint via multipart form
    print("Step 2 & 3: Resident submits plumbing issue...")
    boundary = "----HostelPulseE2EBoundary"
    body = (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"title\"\r\n\r\nLive E2E Shower Head Leak\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"description\"\r\n\r\nWater is leaking heavily from the pipe connector in Room 204 washroom.\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"category\"\r\n\r\nPlumbing\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"block\"\r\n\r\nBlock B\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"floor\"\r\n\r\n2\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"location\"\r\n\r\nRoom 204 Bathroom\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"impact_level\"\r\n\r\nSingle Room\r\n"
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"urgency_level\"\r\n\r\nHigh\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    req = urllib.request.Request(f"{BASE}/complaints", data=body, headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Authorization": f"Bearer {arjun_token}"
    })
    with urllib.request.urlopen(req) as res:
        created = json.loads(res.read().decode())
    cid = created["id"]
    cuid = created["complaint_id"]
    print(f"   Complaint saved to SQLite: {cuid} (Priority: {created['priority']}, Status: {created['status']})")

    # 4. Administrator sees complaint
    print("Step 4: Administrator views new complaint...")
    admin_auth = post("/auth/login", {"email": "admin@hostelpulse.com", "password": "Admin@123"})
    admin_token = admin_auth["access_token"]
    admin_view = get(f"/complaints/{cid}", token=admin_token)
    print(f"   Admin verified ticket {admin_view['complaint_id']} submitted by {admin_view['student']['full_name']}")

    # 5. Administrator assigns maintenance staff
    print("Step 5: Administrator assigns plumber Manoj Singh...")
    staff_list = get("/users/staff", token=admin_token)
    plumber = next(s for s in staff_list if "Plumbing" in (s.get("specialization") or ""))
    assigned = post(f"/complaints/{cid}/assign", {
        "assigned_staff_id": plumber["id"],
        "notes": "Inspect and replace pipe gasket immediately."
    }, token=admin_token)
    print(f"   Staff assigned: {assigned['assigned_staff']['full_name']} (Status: {assigned['status']})")

    # 6. Staff member sees assigned task
    print("Step 6: Technician logs in and views assigned work order...")
    staff_auth = post("/auth/login", {"email": plumber["email"], "password": "Staff@123"})
    staff_token = staff_auth["access_token"]
    staff_tasks = get("/complaints?my_tasks_only=true", token=staff_token)
    my_task = next(t for t in staff_tasks if t["id"] == cid)
    print(f"   Technician confirmed ticket in queue: {my_task['complaint_id']}")

    # 7. Staff updates status and adds work note
    print("Step 7: Staff moves ticket to In Progress and posts work note...")
    patch_req = urllib.request.Request(
        f"{BASE}/complaints/{cid}/status",
        data=json.dumps({"status": "In Progress", "notes": "On-site troubleshooting started"}).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {staff_token}"},
        method="PATCH"
    )
    with urllib.request.urlopen(patch_req) as res:
        in_prog = json.loads(res.read().decode())
    print(f"   Status updated: {in_prog['status']}")

    note = post(f"/complaints/{cid}/comments", {
        "message": "Arrived at Room 204. Replaced cracked rubber gasket and Teflon tape."
    }, token=staff_token)
    print(f"   Work note recorded: \"{note['message']}\"")

    # 8. Student sees updated status and notification
    print("Step 8: Student checks notification center and ticket status...")
    student_notifs = get("/notifications", token=arjun_token)
    latest_notif = student_notifs[0]
    print(f"   Notification received: [{latest_notif['title']}] {latest_notif['message']}")

    # 9. Staff records resolution
    print("Step 9: Staff completes repair and logs resolution report...")
    resolved = post(f"/complaints/{cid}/resolve", {
        "resolution_notes": "Fitted new 0.5 inch brass connector, pressure tested for 15 minutes without leakage. Issue resolved."
    }, token=staff_token)
    print(f"   Resolved by {resolved['resolved_by']['full_name']} at {resolved['resolved_at']}")

    # 10. Audit history and dashboard statistics reflect change
    print("Step 10: Validating complete audit history and live operational statistics...")
    final_ticket = get(f"/complaints/{cid}", token=admin_token)
    print(f"   Total audit history entries logged: {len(final_ticket['history'])}")
    for h in final_ticket["history"][:3]:
        print(f"     - [{h['action_type']}] by {h['actor_name']}: {h['notes'] or h['new_value']}")

    metrics = get("/analytics/dashboard", token=admin_token)
    print(f"   Live Dashboard Metrics:")
    print(f"     - Total complaints: {metrics['total_complaints']}")
    print(f"     - Resolved complaints: {metrics['resolved_complaints']}")
    print(f"     - Resolution rate: {metrics['resolution_rate_percent']}%")
    print(f"     - Average resolution hours: {metrics['average_resolution_hours']}h")

    print("\n============================================================")
    print("SUCCESS: Full 10-step hackathon end-to-end workflow verified!")
    print("============================================================")

if __name__ == "__main__":
    run_workflow()
