# Team Task Tracker API

A production-grade RESTful backend that powers collaborative team task management with role-based access control and chronological activity tracking. Built with Django, Django REST Framework, and MongoDB via MongoEngine, it provides stable API contracts, token lifecycle management, and real-time polling feeds for frontend applications.

---

## Tech Stack & Architecture Decisions

* **Language & Web Framework**: Python 3.11+, Django 5.x / 6.x, Django REST Framework (DRF)
* **Database**: MongoDB via **MongoEngine** (Document ODM)
  * *Why MongoEngine over Djongo?* Djongo attempts to translate relational SQL concepts to MongoDB document models via an intermediate SQL-to-MQL parsing layer, leading to query translation bugs, poor performance with nested documents/arrays, and frequent compatibility breakages across modern Django versions. MongoEngine directly interfaces with PyMongo, provides native support for document schemas, references, embedded lists, flexible BSON indexing, and explicit query control.
* **Authentication**: Custom stateless JWT authentication using **PyJWT** (15-minute access token, 7-day rotated refresh token).
* **Password Hashing**: Django's cryptographic PBKDF2 hashers (`make_password`, `check_password`).
* **CORS**: `django-cors-headers` configured for frontend development servers and cloud origins.

---

## Quickstart & Setup Guide

### 1. Prerequisites
* Python 3.11+
* MongoDB running locally on `mongodb://localhost:27017/` (or a MongoDB Atlas connection URI).

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `.env` matches your MongoDB instance and secret keys:
```ini
SECRET_KEY=local-dev-secret-key-32-chars-long-tracker
DEBUG=True
MONGO_URI=mongodb://localhost:27017/
MONGO_DB=team_task_tracker
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Seed the Database
Populate the database with seed users, team, tasks, comments, and activities:
```bash
python seed.py
```

### 5. Run the Server
```bash
python manage.py runserver 127.0.0.1:8000
```
API endpoints are available under `http://127.0.0.1:8000/api/`.

---

## Seed Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | Admin User | `admin@example.com` | `Admin@1234` |
| **Member** | Riya Sharma | `riya@example.com` | `Member@1234` |
| **Member** | Sam Miller | `sam@example.com` | `Member@1234` |

*Note: On registration (`POST /api/auth/register`), passing `"role": "admin"` is permitted so that evaluators and reviewers can immediately provision administrative accounts.*

---

## Running the Automated Test Suite

Run all unit and integration tests across auth, teams, tasks, comments, and activity feeds:
```bash
python manage.py test core.tests
```

---

## Permission Model

* **Authentication**: Handled via `JWTAuthentication` on all protected endpoints. Missing, expired, or invalid tokens strictly return HTTP `401 Unauthorized` (never 403).
* **Role-Based Control (`IsAdmin`)**: Only users with `role: "admin"` can create teams and invite new members.
* **Team-Level Scoping (`IsTeamMember`)**:
  * An admin can only invite members to teams they personally belong to.
  * Only members of a team can list, view, create, or update tasks and comments within that team.
  * Non-members attempting to access a team's tasks or activity feed strictly receive HTTP `403 Forbidden`.
  * Task assignees (`assigned_to`) must be active members of that task's team.

---

## API Summary Table

Detailed schema definitions and real request/response examples are in [docs/API.md](docs/API.md).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register user; auto-applies pending team invitations |
| `POST` | `/api/auth/login` | None | Authenticate credentials; returns user, access, and refresh tokens |
| `POST` | `/api/auth/refresh` | Refresh Token | Rotates refresh token; returns fresh access and refresh pair |
| `GET` | `/api/auth/me` | Any User | Profile of current authenticated user |
| `GET` | `/api/teams/` | Any User | List teams the user is a member of |
| `POST` | `/api/teams/` | Admin | Create new team; creator automatically joined as member |
| `GET` | `/api/teams/:id/` | Team Member | Detailed team view with populated member profiles |
| `POST` | `/api/teams/:id/invite` | Admin + Member | Invite user by email (simulated invite) |
| `GET` | `/api/teams/:id/tasks/` | Team Member | List team tasks; supports optional `?status=pending\|in_progress\|done` |
| `POST` | `/api/teams/:id/tasks/` | Team Member | Create new team task (assignee must be team member) |
| `GET` | `/api/tasks/:id/` | Team Member | Retrieve task details |
| `PATCH` | `/api/tasks/:id/` | Team Member | Partial task update (status change / field change) |
| `GET` | `/api/tasks/:id/comments/` | Team Member | List task comments (ordered oldest first) |
| `POST` | `/api/tasks/:id/comments/` | Team Member | Post comment on task (writes `commented` activity) |
| `GET` | `/api/teams/:id/activity/` | Team Member | Chronological timeline (`?limit=50`, `?since=<ISO>`) |

---

## Core Design Decisions

1. **JWT Refresh Token Rotation**:
   * Access tokens are short-lived (15 minutes).
   * Refresh tokens (7 days) are strictly single-use. When `/api/auth/refresh` is called, the old refresh token is added to the `RevokedToken` collection. Reusing a revoked refresh token fails with HTTP 401.
2. **Timeline Polling vs. WebSockets**:
   * Instead of maintaining persistent WebSocket server state, clients can poll `GET /api/teams/:id/activity/?since=<created_at of newest item>` every 5 seconds.
   * This simplifies infrastructure, supports horizontal scaling behind load balancers, and works seamlessly with edge and serverless environments.
3. **Simulated Invitation Flow**:
   * Admins invite collaborators by email address.
   * If the user is already registered, they are added to `team.members` immediately and an activity log is created.
   * If the user has not registered yet, an `Invitation` document is preserved. Upon calling `/api/auth/register`, `apply_pending_invites(user)` automatically joins them to the invited teams.
4. **Service Layer Activity Logging**:
   * All activity records are generated strictly through `services.log_activity()`. Views never write to the `Activity` collection directly, ensuring formatting and validation consistency across endpoints.

---

## Known Limitations & Next Steps

* **Pagination**: Task listing currently returns full arrays. In high-volume production, cursor-based pagination would be added to `/teams/:id/tasks/`.
* **Real Email Dispatch**: Invitations are simulated in database documents. Next step is integrating transactional email dispatch (e.g. AWS SES or Resend) for invite notifications.
* **Soft Deletes**: Task and team deletion was intentionally kept out of scope per PRD. Adding soft deletion (`is_deleted`) and archiving would be the natural next iteration.

---

## Frontend (Cadence Web App — Next.js 15)

The frontend is a modern, responsive web application called **"Cadence"**, built with **Next.js 15 (App Router)**, **TypeScript**, and **Tailwind CSS v4**.

### Architecture & Standards
* **Design & Theme**: Strict dark theme (`#0c0d0f` canvas, `#141518` panels, `#2dd4bf` emerald/teal accent). All colors are centralized into CSS custom properties in `frontend/src/app/globals.css` with zero hardcoded hex colors in components.
* **App Router Layout**: Protected routes (`/dashboard`, `/teams/[teamId]`, `/teams/[teamId]/tasks/[taskId]`) use route groups with client-side authentication guards and an accessible AppShell drawer.
* **Stateless Auth Mutex**: Access token lives strictly in memory; rotated refresh token in `localStorage`. 401 `token_expired` responses trigger a single shared in-flight refresh with automatic retry.
* **Real-time Activity Feed**: 5-second delta polling using `GET /teams/:id/activity/?since=...`, intelligently paused when the browser tab is hidden (`visibilitychange`).

### Frontend Quickstart

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or: npm install
   ```

3. Environment configuration:
   Create `.env.local` (or copy from `.env.example`):
   ```ini
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
   ```

4. Run the development server:
   ```bash
   pnpm dev
   # or: npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. Linting and Production Build:
   ```bash
   pnpm run lint   # Zero ESLint warnings or errors
   pnpm run build  # Compiles static and dynamic App Router pages
   ```


