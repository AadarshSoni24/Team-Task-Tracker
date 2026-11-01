# Team Task Tracker - API Specification

This documentation defines the complete contract for the Team Task Tracker REST API. All examples contain verified, real responses copied directly from running server responses.

---

## 1. Overview & Conventions

* **Base URL**: `/api`
* **Format**: JSON in, JSON out (`Content-Type: application/json`, `Accept: application/json`)
* **Authentication Header**: `Authorization: Bearer <access_token>`
* **Timestamps**: All timestamps are UTC serialized in ISO 8601 format ending with `Z` (e.g. `2026-10-31T17:24:22.231Z`).
* **Identifiers**: All MongoDB ObjectIDs are exposed to clients as 24-character hexadecimal strings.

---

## 2. Authentication & Token Lifecycle

* **Access Token**: Valid for **15 minutes**. Used in `Authorization: Bearer <token>` on protected endpoints.
* **Refresh Token**: Valid for **7 days**. Rotated on every refresh call.
* **Token Expiration Handling**:
  When an access token expires, the server returns HTTP `401 Unauthorized` with:
  ```json
  {
    "detail": "Token expired",
    "code": "token_expired"
  }
  ```
  The frontend client should intercept this specific 401 response (`code: token_expired`), call `POST /api/auth/refresh` with `{ "refresh": "<refresh_token>" }`, store the new access/refresh pair, and retry the original request once.
* **Token Rotation Enforcement**: An old refresh token is immediately revoked upon use. Passing an access token to `/auth/refresh` or reusing a revoked refresh token returns HTTP `401 Unauthorized`.

---

## 3. Real-Time Timeline Polling Guidance

The team activity timeline is updated whenever tasks are created, modified, commented on, or members are added.
To build a live activity feed without websockets:
1. Fetch the initial list of activities using `GET /api/teams/:id/activity/?limit=50`.
2. Extract the `created_at` timestamp of the topmost (newest) item.
3. Every 5 seconds, poll:
   ```
   GET /api/teams/:id/activity/?since=<created_at of newest item>
   ```
4. Prepend any returned items to the timeline and update the newest `created_at` cursor.

---

## 4. Standardized Error Responses

Every error returned by the API strictly follows the uniform schema:

### Generic Error (401, 403, 404, 409)
```json
{
  "detail": "Human-readable description of the error."
}
```

### Validation Error (400)
```json
{
  "detail": "Validation error",
  "errors": {
    "email": [
      "Email already registered."
    ]
  }
}
```

### Token Expired (401)
```json
{
  "detail": "Token expired",
  "code": "token_expired"
}
```

---

## 5. Endpoints Reference

### 5.1 Authentication

#### POST `/api/auth/register`
Create a new user account. Any pending invitations matching the user's email are automatically applied to join teams upon registration.

* **Auth**: None
* **Request Body**:
```json
{
  "name": "Kavita Patel",
  "email": "kavita_patel@example.com",
  "password": "SecurePassword@123",
  "role": "member"
}
```
* **Success Response (201 Created)**:
```json
{
  "user": {
    "id": "6ae62446a401761ca7d84874",
    "name": "Kavita Patel",
    "email": "kavita_patel@example.com",
    "role": "member",
    "created_at": "2026-10-31T17:24:22.231Z"
  },
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
* **Error Response (400 Bad Request)**:
```json
{
  "detail": "Validation error",
  "errors": {
    "email": [
      "Email already registered."
    ]
  }
}
```

---

#### POST `/api/auth/login`
Authenticate with email and password.

* **Auth**: None
* **Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "Admin@1234"
}
```
* **Success Response (200 OK)**:
```json
{
  "user": {
    "id": "6ae62412db9ed789bccd38cb",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2026-10-26T17:23:28Z"
  },
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
* **Error Response (401 Unauthorized)**:
```json
{
  "detail": "Invalid email or password."
}
```

---

#### POST `/api/auth/refresh`
Rotate refresh token and retrieve a fresh access token.

* **Auth**: None
* **Request Body**:
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
* **Success Response (200 OK)**:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
* **Error Response (401 Unauthorized)**:
```json
{
  "detail": "Refresh token has already been revoked."
}
```

---

#### GET `/api/auth/me`
Retrieve the current authenticated user's profile.

* **Auth**: Bearer token (any user)
* **Success Response (200 OK)**:
```json
{
  "id": "6ae62412db9ed789bccd38cb",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin",
  "created_at": "2026-10-26T17:23:28Z"
}
```
* **Error Response (401 Unauthorized)**:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### 5.2 Teams

#### GET `/api/teams/`
List all teams that the requesting user belongs to.

* **Auth**: Bearer token (any user)
* **Success Response (200 OK)**:
```json
[
  {
    "id": "6ae62414db9ed789bccd38ce",
    "name": "Core Product Team",
    "description": "Cross-functional product and engineering squad building the Task Tracker.",
    "created_by": {
      "id": "6ae62412db9ed789bccd38cb",
      "name": "Admin User"
    },
    "member_count": 3,
    "created_at": "2026-10-28T17:23:28Z"
  }
]
```

---

#### POST `/api/teams/`
Create a new team. Creator is automatically added to team members.

* **Auth**: Bearer token (role: `admin` only)
* **Request Body**:
```json
{
  "name": "DevOps Squad",
  "description": "Infrastructure automation squad"
}
```
* **Success Response (201 Created)**:
```json
{
  "id": "6ae62446a401761ca7d84876",
  "name": "DevOps Squad",
  "description": "Infrastructure automation squad",
  "created_by": {
    "id": "6ae62412db9ed789bccd38cb",
    "name": "Admin User"
  },
  "member_count": 1,
  "created_at": "2026-10-31T17:24:22.274Z",
  "members": [
    {
      "id": "6ae62412db9ed789bccd38cb",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  ]
}
```
* **Error Response (403 Forbidden)**:
```json
{
  "detail": "Only admins are permitted to perform this action."
}
```

---

#### GET `/api/teams/:id/`
Retrieve detailed team information with full populated members list.

* **Auth**: Bearer token (team member only)
* **Success Response (200 OK)**:
```json
{
  "id": "6ae62414db9ed789bccd38ce",
  "name": "Core Product Team",
  "description": "Cross-functional product and engineering squad building the Task Tracker.",
  "created_by": {
    "id": "6ae62412db9ed789bccd38cb",
    "name": "Admin User"
  },
  "member_count": 3,
  "created_at": "2026-10-28T17:23:28Z",
  "members": [
    {
      "id": "6ae62412db9ed789bccd38cb",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    },
    {
      "id": "6ae62413db9ed789bccd38cc",
      "name": "Riya Sharma",
      "email": "riya@example.com",
      "role": "member"
    },
    {
      "id": "6ae62414db9ed789bccd38cd",
      "name": "Sam Miller",
      "email": "sam@example.com",
      "role": "member"
    }
  ]
}
```
* **Error Response (403 Forbidden)**:
```json
{
  "detail": "You must be a member of this team to access this resource."
}
```

---

#### POST `/api/teams/:id/invite`
Invite a user by email. If the user already exists, they are added immediately and an activity entry is logged. If they have not registered yet, an `Invitation` is stored and resolved automatically when they register.

* **Auth**: Bearer token (admin + member of the team)
* **Request Body**:
```json
{
  "email": "newconsultant@example.com"
}
```
* **Success Response (Pending Invite - 200 OK)**:
```json
{
  "detail": "Invitation recorded for newconsultant@example.com. They will be added to the team upon registration."
}
```
* **Success Response (Immediate Add - 200 OK)**:
```json
{
  "detail": "Added Riya Sharma to the team.",
  "user": {
    "id": "6ae62413db9ed789bccd38cc",
    "name": "Riya Sharma",
    "email": "riya@example.com",
    "role": "member",
    "created_at": "2026-10-27T17:23:28Z"
  }
}
```
* **Error Response (409 Conflict)**:
```json
{
  "detail": "User with email 'riya@example.com' is already a member of this team."
}
```

---

### 5.3 Tasks

#### GET `/api/teams/:id/tasks/`
List tasks in the team. Supports optional `?status=pending|in_progress|done`.

* **Auth**: Bearer token (team member only)
* **Query Parameters**:
  * `status`: Optional filter (`pending`, `in_progress`, or `done`).
* **Success Response (200 OK)**:
```json
[
  {
    "id": "6ae62414db9ed789bccd38d4",
    "title": "Implement JWT Authentication",
    "description": "PyJWT access (15 min) and refresh (7 days, rotated) token lifecycle.",
    "status": "done",
    "team_id": "6ae62414db9ed789bccd38ce",
    "assigned_to": {
      "id": "6ae62414db9ed789bccd38cd",
      "name": "Sam Miller"
    },
    "created_by": {
      "id": "6ae62413db9ed789bccd38cc",
      "name": "Riya Sharma"
    },
    "created_at": "2026-10-31T17:23:32.571Z",
    "updated_at": "2026-10-31T17:23:32.571Z"
  },
  {
    "id": "6ae62414db9ed789bccd38d1",
    "title": "Design API endpoints",
    "description": "Finalize REST contract, status codes, and error envelopes.",
    "status": "done",
    "team_id": "6ae62414db9ed789bccd38ce",
    "assigned_to": {
      "id": "6ae62413db9ed789bccd38cc",
      "name": "Riya Sharma"
    },
    "created_by": {
      "id": "6ae62412db9ed789bccd38cb",
      "name": "Admin User"
    },
    "created_at": "2026-10-31T17:23:32.564Z",
    "updated_at": "2026-10-31T17:23:32.564Z"
  }
]
```

---

#### POST `/api/teams/:id/tasks/`
Create a new task within the team. `assigned_to` must belong to the team. Automatically writes a `task_created` activity entry.

* **Auth**: Bearer token (team member only)
* **Request Body**:
```json
{
  "title": "Build Real-Time Notification Poller",
  "description": "Poll team activity feed with since parameter every 5s.",
  "assigned_to": "6ae62413db9ed789bccd38cc",
  "status": "pending"
}
```
* **Success Response (201 Created)**:
```json
{
  "id": "6ae62446a401761ca7d84878",
  "title": "Build Real-Time Notification Poller",
  "description": "Poll team activity feed with since parameter every 5s.",
  "status": "pending",
  "team_id": "6ae62414db9ed789bccd38ce",
  "assigned_to": {
    "id": "6ae62413db9ed789bccd38cc",
    "name": "Riya Sharma"
  },
  "created_by": {
    "id": "6ae62413db9ed789bccd38cc",
    "name": "Riya Sharma"
  },
  "created_at": "2026-10-31T17:24:22.326Z",
  "updated_at": "2026-10-31T17:24:22.326Z"
}
```
* **Error Response (400 Bad Request - Non-member Assignee)**:
```json
{
  "detail": "Validation error",
  "errors": {
    "assigned_to": [
      "Assigned user must be a member of the team."
    ]
  }
}
```

---

#### GET `/api/tasks/:id/`
Retrieve task detail.

* **Auth**: Bearer token (member of task's team only)
* **Success Response (200 OK)**:
```json
{
  "id": "6ae62446a401761ca7d84878",
  "title": "Build Real-Time Notification Poller",
  "description": "Poll team activity feed with since parameter every 5s.",
  "status": "pending",
  "team_id": "6ae62414db9ed789bccd38ce",
  "assigned_to": {
    "id": "6ae62413db9ed789bccd38cc",
    "name": "Riya Sharma"
  },
  "created_by": {
    "id": "6ae62413db9ed789bccd38cc",
    "name": "Riya Sharma"
  },
  "created_at": "2026-10-31T17:24:22.326Z",
  "updated_at": "2026-10-31T17:24:22.326Z"
}
```
* **Error Response (404 Not Found)**:
```json
{
  "detail": "Task not found."
}
```

---

#### PATCH `/api/tasks/:id/`
Partially update task fields. If `status` changes, writes a `status_changed` activity. If title/description/assignee changes, writes a `task_updated` activity.

* **Auth**: Bearer token (member of task's team only)
* **Request Body**:
```json
{
  "status": "in_progress",
  "title": "Build Real-Time Notification Poller (Client)"
}
```
* **Success Response (200 OK)**:
```json
{
  "id": "6ae62446a401761ca7d84878",
  "title": "Build Real-Time Notification Poller (Client)",
  "description": "Poll team activity feed with since parameter every 5s.",
  "status": "in_progress",
  "team_id": "6ae62414db9ed789bccd38ce",
  "assigned_to": {
    "id": "6ae62413db9ed789bccd38cc",
    "name": "Riya Sharma"
  },
  "created_by": {
    "id": "6ae62413db9ed789bccd38cc",
    "name": "Riya Sharma"
  },
  "created_at": "2026-10-31T17:24:22.326Z",
  "updated_at": "2026-10-31T17:24:22.345Z"
}
```

---

### 5.4 Comments

#### POST `/api/tasks/:id/comments/`
Create a comment on a task. Automatically writes a `commented` activity entry.

* **Auth**: Bearer token (member of task's team only)
* **Request Body**:
```json
{
  "text": "Initial prototype for client poller is ready."
}
```
* **Success Response (201 Created)**:
```json
{
  "id": "6ae62446a401761ca7d8487c",
  "text": "Initial prototype for client poller is ready.",
  "user": {
    "id": "6ae62413db9ed789bccd38cc",
    "name": "Riya Sharma"
  },
  "created_at": "2026-10-31T17:24:22.357Z"
}
```

---

#### GET `/api/tasks/:id/comments/`
List all comments on a task, ordered oldest first.

* **Auth**: Bearer token (member of task's team only)
* **Success Response (200 OK)**:
```json
[
  {
    "id": "6ae62446a401761ca7d8487c",
    "text": "Initial prototype for client poller is ready.",
    "user": {
      "id": "6ae62413db9ed789bccd38cc",
      "name": "Riya Sharma"
    },
    "created_at": "2026-10-31T17:24:22.357Z"
  }
]
```

---

### 5.5 Activity Timeline

#### GET `/api/teams/:id/activity/`
Retrieve chronological activity timeline for a team, ordered newest first.

* **Auth**: Bearer token (team member only)
* **Query Parameters**:
  * `limit`: Integer (default `50`, maximum `200`).
  * `since`: ISO 8601 UTC timestamp string (e.g. `?since=2026-10-31T17:23:32.621Z`). Returns only activity entries strictly newer than this timestamp.
* **Success Response (200 OK)**:
```json
[
  {
    "id": "6ae62446a401761ca7d8487d",
    "action": "commented",
    "message": "Riya Sharma commented on \"Build Real-Time Notification Poller (Client)\"",
    "actor": {
      "id": "6ae62413db9ed789bccd38cc",
      "name": "Riya Sharma"
    },
    "task_id": "6ae62446a401761ca7d84878",
    "created_at": "2026-10-31T17:24:22.359Z"
  },
  {
    "id": "6ae62446a401761ca7d8487b",
    "action": "task_updated",
    "message": "Riya Sharma updated task \"Build Real-Time Notification Poller (Client)\"",
    "actor": {
      "id": "6ae62413db9ed789bccd38cc",
      "name": "Riya Sharma"
    },
    "task_id": "6ae62446a401761ca7d84878",
    "created_at": "2026-10-31T17:24:22.347Z"
  },
  {
    "id": "6ae62446a401761ca7d8487a",
    "action": "status_changed",
    "message": "Riya Sharma changed status of \"Build Real-Time Notification Poller (Client)\" to In Progress",
    "actor": {
      "id": "6ae62413db9ed789bccd38cc",
      "name": "Riya Sharma"
    },
    "task_id": "6ae62446a401761ca7d84878",
    "created_at": "2026-10-31T17:24:22.346Z"
  },
  {
    "id": "6ae62446a401761ca7d84879",
    "action": "task_created",
    "message": "Riya Sharma created task \"Build Real-Time Notification Poller\"",
    "actor": {
      "id": "6ae62413db9ed789bccd38cc",
      "name": "Riya Sharma"
    },
    "task_id": "6ae62446a401761ca7d84878",
    "created_at": "2026-10-31T17:24:22.327Z"
  },
  {
    "id": "6ae62414db9ed789bccd38e4",
    "action": "commented",
    "message": "Admin User commented on \"Build Team and Role-Based Permissions\"",
    "actor": {
      "id": "6ae62412db9ed789bccd38cb",
      "name": "Admin User"
    },
    "task_id": "6ae62414db9ed789bccd38d7",
    "created_at": "2026-10-31T17:23:32.621Z"
  }
]
```

