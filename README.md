# CodingoForge Backend

A production-ready REST API for the CodingoForge platform — built with Node.js and Express, authenticated via Clerk JWT, and secured with role-based access control (RBAC).

---

## Base URL

```
https://cforg-server.onrender.com
```

---

## Tech Stack

- **Runtime:** Node.js + Express.js
- **Authentication:** Clerk (JWT Bearer Token)
- **Authorization:** Role-Based Access Control (RBAC)
- **Deployment:** Render

---

## Authentication

All protected routes require a valid Clerk JWT token passed as a Bearer token in the request header.

```
Authorization: Bearer <your_clerk_jwt_token>
```

The token is fetched from the frontend Clerk session.

---

## Roles

| Role | Description |
|---|---|
| `user` | Standard client — access limited to own projects |
| `employee` | Internal team — read access to all projects |
| `admin` | Full access — manage users, roles, and projects |

---

## API Endpoints

### Health Check

```
GET /health
```

Returns server status.

**Response:**
```json
{ "status": "ok" }
```

---

### User Module

#### Get Logged-in User
```
GET /api/users/me
```
**Auth:** Required  
**Returns:** Logged-in user details — id, email, role

---

### Project Module

#### Get Projects
```
GET /api/projects
```
**Auth:** Required  
**Behaviour:**
- `user` → returns own projects only
- `employee` / `admin` → returns all projects

#### Update Project Status
```
PATCH /api/projects/:id/status
```
**Auth:** Admin only  
**Body:**
```json
{
  "status": "active",
  "trackingPhase": "in_development"
}
```
**Returns:** Updated project on success, `403 Forbidden` for non-admin roles

---

### Admin Module

#### Get All Users
```
GET /api/admin/users
```
**Auth:** Admin only  
**Returns:** All registered users, `403 Forbidden` for others

#### Promote User
```
PATCH /api/admin/users/:id/promote
```

#### Demote User
```
PATCH /api/admin/users/:id/demote
```

#### Make Admin
```
PATCH /api/admin/users/:id/make-admin
```

---

## RBAC Matrix

| Endpoint | User | Employee | Admin |
|---|---|---|---|
| `GET /api/projects` | Own only | All | All |
| `PATCH /api/projects/:id/status` | ❌ 403 | ❌ 403 | ✅ |
| `GET /api/admin/users` | ❌ 403 | ❌ 403 | ✅ |
| `PATCH /api/admin/users/:id/promote` | ❌ 403 | ❌ 403 | ✅ |
| `PATCH /api/admin/users/:id/demote` | ❌ 403 | ❌ 403 | ✅ |
| `PATCH /api/admin/users/:id/make-admin` | ❌ 403 | ❌ 403 | ✅ |
| `GET /health` | ✅ | ✅ | ✅ |

---

## Testing

Tested via **Thunder Client** (VS Code extension).

All endpoints verified for:
- Correct authentication via Clerk JWT
- Proper role-based restrictions
- Expected status codes — `200`, `304`, `403`

> `304 Not Modified` responses are expected behaviour due to HTTP caching — not an error.

---

## Status

| Check | Status |
|---|---|
| JWT Authentication | ✅ Working |
| RBAC Enforcement | ✅ Working |
| 403 on Unauthorised Access | ✅ Working |
| Health Check | ✅ Working |
| Production Readiness | ✅ Ready |