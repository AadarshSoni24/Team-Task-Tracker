import os
import sys
import time
import json
import urllib.request
import urllib.error
import urllib.parse
import subprocess

API_URL = "http://127.0.0.1:8000/api"

def make_req(path, method="GET", body=None, token=None):
    url = f"{API_URL}{path}"
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        return e.code, json.loads(content) if content else None

def run_tests():
    ts = int(time.time())
    admin_email = f"cadence_admin_{ts}@example.com"
    member_email = f"cadence_member_{ts}@example.com"
    
    print("=== Step 5 E2E Verification ===")

    # 1. Register Admin
    print("1. Testing Registration (Admin)...")
    st, res = make_req("/auth/register", "POST", {
        "name": "E2E Admin",
        "email": admin_email,
        "password": "Password@123",
        "role": "admin"
    })
    assert st == 201, f"Register admin failed: {st} {res}"
    admin_access = res["access"]
    admin_refresh = res["refresh"]
    admin_id = res["user"]["id"]
    print("   -> Admin registered successfully:", admin_id)

    # 2. Login
    print("2. Testing Login...")
    st, res = make_req("/auth/login", "POST", {
        "email": admin_email,
        "password": "Password@123"
    })
    assert st == 200, f"Login failed: {st} {res}"
    admin_access = res["access"]
    admin_refresh = res["refresh"]
    print("   -> Logged in, tokens obtained.")

    # 3. Token Refresh
    print("3. Testing Token Refresh & Rotation...")
    st, res = make_req("/auth/refresh", "POST", {"refresh": admin_refresh})
    assert st == 200, f"Refresh failed: {st} {res}"
    admin_access = res["access"]
    new_refresh = res["refresh"]
    assert new_refresh != admin_refresh, "Refresh token should rotate"
    admin_refresh = new_refresh
    print("   -> Token refreshed and rotated successfully.")

    # 4. Create Team (Admin only)
    print("4. Testing Team Creation...")
    st, res = make_req("/teams/", "POST", {
        "name": f"Cadence Squad {ts}",
        "description": "Next.js migration verification team"
    }, token=admin_access)
    assert st == 201, f"Create team failed: {st} {res}"
    team_id = res["id"]
    print("   -> Team created:", team_id)

    # 5. Member Invite
    print("5. Testing Team Member Invite (to future user)...")
    st, res = make_req(f"/teams/{team_id}/invite", "POST", {
        "email": member_email
    }, token=admin_access)
    assert st == 200, f"Invite failed: {st} {res}"
    print("   -> Invitation sent:", res["detail"])

    # 6. Register Member (auto-joins team from invitation)
    print("6. Testing Member Registration & Pending Invite Application...")
    st, res = make_req("/auth/register", "POST", {
        "name": "E2E Member",
        "email": member_email,
        "password": "Password@123",
        "role": "member"
    })
    assert st == 201, f"Member register failed: {st} {res}"
    member_access = res["access"]
    member_id = res["user"]["id"]
    
    # Check that member is now in the team
    st, res = make_req(f"/teams/{team_id}/", "GET", token=member_access)
    assert st == 200, f"Get team failed: {st} {res}"
    member_ids = [m["id"] for m in res["members"]]
    assert member_id in member_ids, "Invited member should have auto-joined team"
    print("   -> Member verified in team members list.")

    # 7. Task Creation
    print("7. Testing Task Creation...")
    st, res = make_req(f"/teams/{team_id}/tasks/", "POST", {
        "title": "Build Next.js Frontend",
        "description": "Convert Vite React app to Next.js App Router",
        "assigned_to": member_id,
        "status": "pending"
    }, token=admin_access)
    assert st == 201, f"Create task failed: {st} {res}"
    task_id = res["id"]
    print("   -> Task created:", task_id)

    # 8. Task Detail & Patch (Optimistic update scenario)
    print("8. Testing Task Update & Optimistic Status Transitions...")
    st, res = make_req(f"/tasks/{task_id}/", "PATCH", {
        "status": "in_progress"
    }, token=member_access)
    assert st == 200 and res["status"] == "in_progress", f"Status change failed: {st} {res}"
    print("   -> Status moved to in_progress.")

    # Testing Rollback on invalid status
    print("   -> Testing invalid status error response for rollback...")
    st, res = make_req(f"/tasks/{task_id}/", "PATCH", {
        "status": "invalid_status"
    }, token=member_access)
    assert st == 400, f"Expected 400 for invalid status, got: {st}"
    print("   -> Properly returned 400 validation error (triggers UI rollback).")

    # 9. Comments
    print("9. Testing Task Comments...")
    st, res = make_req(f"/tasks/{task_id}/comments/", "POST", {
        "text": "All Next.js components ported with zero lint errors!"
    }, token=member_access)
    assert st == 201, f"Add comment failed: {st} {res}"
    
    st, comments = make_req(f"/tasks/{task_id}/comments/", "GET", token=admin_access)
    assert st == 200 and len(comments) >= 1, "Comments retrieval failed"
    print("   -> Comment added and retrieved successfully.")

    # 10. Activity Timeline & ?since= Polling
    print("10. Testing Activity Timeline & Polling with ?since=...")
    st, activities = make_req(f"/teams/{team_id}/activity/", "GET", token=admin_access)
    assert st == 200 and len(activities) >= 3, f"Expected activity events, got: {len(activities)}"
    cursor = activities[0]["created_at"]
    
    # Add another comment to create delta
    time.sleep(1)
    make_req(f"/tasks/{task_id}/comments/", "POST", {
        "text": "Second comment for delta polling test."
    }, token=admin_access)
    
    # Poll with ?since=
    st, delta = make_req(f"/teams/{team_id}/activity/?since={urllib.parse.quote(cursor)}", "GET", token=admin_access)
    assert st == 200 and len(delta) >= 1, f"Expected delta polling items, got: {len(delta)}"
    assert delta[0]["action"] == "commented"
    print("   -> Activity timeline delta polling (?since=) verified successfully.")

    print("\nALL E2E CHECKS PASSED WITH FULL BACKEND CONTRACT FIDELITY!")

if __name__ == "__main__":
    run_tests()
