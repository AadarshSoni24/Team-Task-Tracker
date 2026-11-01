# PRD: Team Task Tracker API (Backend Only)

Internship assessment project. **Scope for now: backend only.** The frontend will be built separately in Figma Make against this API, so the API contract, error shapes, and docs must be precise and stable.

Every decision below is final. Do not swap libraries or change the architecture.

## 1. Goal

A REST API where Admins create teams and invite members, team members create and update tasks inside their team, and every change is recorded in a chronological activity timeline.

Evaluated on: backend design, MongoDB usage, auth and permissions, code quality, and how easily a frontend can integrate.

## 2. Fixed tech stack

| Layer | Choice |
|---|---|
| Language/Framework | Python 3.11+, Django, Django REST Framework |
| DB | MongoDB via **mongoengine** (no djongo, no Django ORM models) |
| Auth | Custom JWT with **PyJWT**: access token (15 min) + refresh token (7 days, rotated) |
| Password hashing | `django.contrib.auth.hashers.make_password / check_password` |
| CORS | django-cors-headers |
| Config | python-dotenv |

Docs to follow:
- DRF permissions: https://www.django-rest-framework.org/api-guide/permissions/
- DRF custom authentication: https://www.django-rest-framework.org/api-guide/authentication/#custom-authentication
- mongoengine: https://docs.mongoengine.org/guide/defining-documents.html
- PyJWT: https://pyjwt.readthedocs.io/en/stable/usage.html

## 3. Repo layout

```
task-tracker/
  README.md
  PRD.md
  docs/
    API.md             request/response examples for every endpoint
  backend/
    manage.py
    requirements.txt
    .env.example
    seed.py
    config/            (settings.py, urls.py)
    core/
      models.py        User, Team, Invitation, Task, Comment, Activity
      auth.py          make_token, decode_token, JWTAuthentication
      permissions.py   IsAdmin, IsTeamMember
      serializers.py   plain DRF Serializers (not ModelSerializer)
      services.py      log_activity(), apply_pending_invites(), serialize helpers
      views/
        auth_views.py
        team_views.py
        task_views.py
      urls.py
      tests/
```

## 4. Data models (mongoengine)

All ids are exposed to clients as strings. Timestamps are UTC, serialized as ISO 8601 with `Z`.

- **User**: `name` (req), `email` (req, unique, lowercased), `password` (hashed), `role` ("admin" | "member", default "member"), `created_at`.
- **Team**: `name` (req), `description`, `created_by` (ref User), `members` (list of ref User), `created_at`. The creator is added to `members` automatically.
- **Invitation**: `team` (ref), `email`, `invited_by` (ref User), `created_at`. Used for invites to emails that have not registered yet.
- **Task**: `title` (req), `description`, `assigned_to` (ref User, optional), `status` ("pending" | "in_progress" | "done", default "pending"), `team` (ref), `created_by` (ref), `created_at`, `updated_at` (auto-set on every save).
- **Comment**: `task` (ref), `user` (ref), `text` (req, max 1000), `created_at`.
- **Activity**: `team` (ref), `actor` (ref), `task` (ref, optional), `action` ("task_created" | "task_updated" | "status_changed" | "commented" | "member_added"), `message` (req), `created_at`.

Indexes: `User.email` unique, `Task.team + status`, `Activity.team + -created_at`, `Comment.task`, `Invitation.email`.

## 5. Business rules

1. Registration accepts `name`, `email`, `password`, and optional `role`. Default role is `member`. Passing `role: "admin"` is allowed (this is how a reviewer gets an admin; document it in the README). Password minimum 8 characters.
2. Only users with role `admin` can create teams and invite members.
3. An admin can only invite to a team they are a member of.
4. Invite flow (simulated, no real email): admin submits an email.
   - User exists: add to `team.members`, log `member_added`.
   - User does not exist: store an `Invitation`. When that email registers, `apply_pending_invites(user)` adds them to every invited team and logs `member_added`.
   - Already a member: return 409 with a clear message.
5. Only team members can list, read, create, update, or comment on tasks in that team. Non-members get 403.
6. `assigned_to`, when set, must be a member of the task's team (else 400).
7. Any team member can create and update tasks and comments in their team.
8. Every task create, task update, status change, and comment writes one Activity row through `services.log_activity()`. No view writes Activity directly.
9. Activity timeline is ordered newest first.

## 6. Activity message formats

Use the actor's `name`.
- `Aadarsh created task "Design API endpoints"`
- `Aadarsh changed status of "Design API endpoints" to In Progress`  (labels: Pending, In Progress, Done)
- `Aadarsh updated task "Design API endpoints"`  (title, description, or assignee changed)
- `Aadarsh commented on "Design API endpoints"`
- `Aadarsh added riya@example.com to the team`  (or the user's name when known)

If one PATCH changes status and other fields, log two entries: one `status_changed`, one `task_updated`.

## 7. API contract

Base path `/api`. JSON in, JSON out. Auth header: `Authorization: Bearer <access>`.

**Errors** always look like `{"detail": "human readable message"}`. Validation errors (400) additionally include `{"errors": {"field": ["message"]}}`. Status codes: 400, 401, 403, 404, 409.

**401 rule:** a missing, invalid, or expired access token returns **401** (not 403). The frontend uses this to trigger a refresh. An expired token returns `{"detail": "Token expired", "code": "token_expired"}`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | none | create user, return `{user, access, refresh}` (201) |
| POST | `/auth/login` | none | return `{user, access, refresh}` |
| POST | `/auth/refresh` | refresh token in body `{refresh}` | return `{access, refresh}` (rotate refresh) |
| GET | `/auth/me` | any user | current user |
| GET | `/teams/` | any user | teams the user belongs to |
| POST | `/teams/` | admin | create team `{name, description}` (201) |
| GET | `/teams/:id/` | member | team detail with populated members `[{id,name,email,role}]` |
| POST | `/teams/:id/invite` | admin + member | `{email}` |
| GET | `/teams/:id/tasks/` | member | optional `?status=pending|in_progress|done` |
| POST | `/teams/:id/tasks/` | member | `{title, description?, assigned_to?, status?}` (201) |
| GET | `/tasks/:id/` | member of task's team | task detail |
| PATCH | `/tasks/:id/` | member of task's team | partial update |
| GET | `/tasks/:id/comments/` | member | oldest first |
| POST | `/tasks/:id/comments/` | member | `{text}` (201) |
| GET | `/teams/:id/activity/` | member | newest first, `?limit=50` (default 50, max 200), optional `?since=<ISO>` returns only entries newer than that time (for polling) |

Serialized shapes:
- User: `{id, name, email, role, created_at}` (never include password)
- Team (list): `{id, name, description, created_by: {id,name}, member_count, created_at}`
- Team (detail): same plus `members: [{id,name,email,role}]`
- Task: `{id, title, description, status, team_id, assigned_to: {id,name}|null, created_by: {id,name}, created_at, updated_at}`
- Activity: `{id, action, message, actor: {id,name}, task_id|null, created_at}`
- Comment: `{id, text, user: {id,name}, created_at}`

## 8. Backend requirements

- `JWTAuthentication` (DRF `BaseAuthentication`) loads the mongoengine User and implements `authenticate_header` returning `"Bearer"`.
- `IsAdmin`: `request.user.role == "admin"`.
- `IsTeamMember`: object-level, resolves the team from the Team or Task and checks membership.
- Views are class-based `APIView`s using plain `Serializer` validation. Business logic lives in `services.py`, not views.
- Invalid ObjectId gives 404, not 500.
- A custom DRF exception handler enforces the error shape in section 7.
- Settings read `SECRET_KEY`, `MONGO_URI`, `MONGO_DB`, `CORS_ALLOWED_ORIGINS` (comma-separated) from environment. Provide `.env.example`. Default CORS to `http://localhost:3000,http://localhost:5173`, and allow overriding with a deployed Figma Make origin.
- `requirements.txt` pinned to installed versions.
- Tests (Django `TestCase` or pytest) covering: register/login/refresh (including rotation and wrong token type), expired token returns 401, admin-only team creation, non-member gets 403 on tasks and activity, assigned_to must be a team member, status filter, activity written on create/status change/comment, pending invite applied on register. Use a separate test database name.

## 9. Frontend handoff (Figma Make will consume this)

- `docs/API.md` must contain, for every endpoint: method, path, auth requirement, example request body, example success response, and example error response. Use realistic data. This file will be pasted into Figma Make as context.
- Token behavior to document in `docs/API.md`: access lasts 15 min, refresh lasts 7 days and is rotated on every refresh, call `/auth/refresh` on a 401 with `code: token_expired` and retry once.
- Polling guidance to document: call `/teams/:id/activity/?since=<created_at of newest item>` every 5 seconds.
- `seed.py` data gives the frontend something to display immediately.

## 10. Build phases (stop and verify after each)

1. **Foundation**: project setup, env-based settings, models, `auth.py`, custom exception handler, register/login/refresh/me, auth tests. Verify with curl.
2. **Teams and permissions**: team create/list/detail, invite flow, `IsAdmin`, `IsTeamMember`, tests.
3. **Tasks, comments, activity**: all task endpoints, status filter, `log_activity`, activity endpoint with `limit` and `since`, tests.
4. **Docs and polish**: `seed.py`, `docs/API.md`, README, `.env.example`, `.gitignore`, final full test run and a curl walkthrough of the whole flow.

## 11. Seed script

`backend/seed.py` creates: 1 admin (`admin@example.com` / `Admin@1234`), 2 members (`riya@example.com`, `sam@example.com`, password `Member@1234`), 1 team with all three, 5 tasks across statuses, a few comments, and matching activity entries. Idempotent (safe to run twice).

## 12. README must contain

- What the project is, in two sentences.
- Tech stack and why mongoengine was chosen over djongo.
- Setup with exact commands, including MongoDB (local or Atlas) and env vars.
- Seed credentials, how to run the server, how to run tests.
- Link to `docs/API.md` and a short API table.
- Permission model in one short section.
- Design decisions: JWT refresh rotation, polling vs websockets, invite simulation.
- Known limitations and what would be done next.

## 13. Definition of done

- [ ] All endpoints in section 7 work and return the specified shapes and status codes.
- [ ] Non-members cannot read or modify a team's tasks or activity (tested).
- [ ] Members cannot create teams or invite (tested).
- [ ] Expired or invalid access token returns 401 with the documented body (tested).
- [ ] Refresh rotation works and an access token cannot be used as a refresh token (tested).
- [ ] Status filter works.
- [ ] Comments work and appear in the activity feed.
- [ ] `since` parameter on activity works.
- [ ] Backend tests pass.
- [ ] `docs/API.md` covers every endpoint with examples.
- [ ] Fresh clone to running API works by following the README only.
- [ ] No secrets committed. `.env` is gitignored.

## 14. Out of scope

Frontend (built separately in Figma Make), real email sending, file uploads, websockets, Docker, deployment, task deletion, team deletion, password reset.
