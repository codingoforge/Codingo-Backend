# CodingoForge Backend — Product Requirements Document (PRD)

---

## Overview

This document outlines the current state, existing modules, and planned features of the CodingoForge backend API. Features marked as **pending** are built or partially built but not yet active — they will come into full use once the frontend is properly designed and integrated.

---

## Base URL

```
https://cforg-server.onrender.com
```

---

## Tech Stack

- **Runtime:** Node.js + Express.js
- **Authentication:** Clerk (JWT Bearer Token + Clerk SDK)
- **Authorization:** Role-Based Access Control (RBAC)
- **Database:** MongoDB via Mongoose
- **Validation:** Zod (schema-based request validation)
- **File Storage:** Cloudinary (config present)
- **Deployment:** Render
- **Allowed Origins:** `http://localhost:5173`, `https://codingoforge.vercel.app`

---

## Module Overview

| Module | Route Prefix | Status |
|---|---|---|
| User | `/api/users` | ✅ Active |
| Project | `/api/projects` | ✅ Active |
| Admin | `/api/admin` | ✅ Active |
| Payment | `/api/payments` | 🔄 Built — pending frontend |
| Currency | `/api/currency` | 🔄 Built — pending frontend |
| Health Check | `/health` | ✅ Active |

---

## Middleware

| File | Purpose |
|---|---|
| `auth.middleware.js` | Verifies Clerk JWT, finds or auto-creates user in MongoDB, sets `req.user` on every protected request |
| `rbac.middleware.js` | Checks `req.user.role` against allowed roles, returns `403` if unauthorized |
| `validate.middleware.js` | Zod schema validation on `req.body`, `req.query`, `req.params` — returns `400` with field-level error messages on failure |
| `error.middleware.js` | Global error handler — catches all unhandled errors, returns `{ success: false, message }` |

### Auto User Creation
When a user hits any protected route for the first time, the auth middleware automatically pulls their name and email from Clerk and creates a MongoDB record. No separate registration endpoint needed. Falls back gracefully if the Clerk API call fails — user is still created with just the `clerkId`.

---

## Active Modules

### User Module — `/api/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Required | Get logged-in user details |

#### User Model Schema

| Field | Type | Notes |
|---|---|---|
| `clerkId` | String | Unique, indexed — primary Clerk identifier |
| `name` | String | Auto-populated from Clerk on first login |
| `email` | String | Auto-populated from Clerk on first login, indexed |
| `role` | Enum | `admin`, `employee`, `user` — defaults to `user` |
| `isActive` | Boolean | Defaults to `true` — reserved for soft deactivation |
| `createdAt` / `updatedAt` | Timestamp | Auto-managed by Mongoose |

---

### Project Module — `/api/projects`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | Required | User gets own projects, admin/employee gets all |
| PATCH | `/api/projects/:id/status` | Admin only | Update project status and tracking phase |

#### Tracking Fields
The project model includes tracking fields that are already defined and will sync with the full pipeline once the frontend is complete:

- `status` — current project status (e.g. `active`, `completed`, `on_hold`)
- `trackingPhase` — current development phase (e.g. `in_development`, `qa`, `launched`)

> These fields exist in the model and are updatable via the PATCH endpoint. Full pipeline sync — sprint boards, phase progress bars, client dashboard updates — will activate once the frontend is properly wired.

---

### Admin Module — `/api/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Admin only | Get all users sorted newest first |
| PATCH | `/api/admin/users/:id/promote` | Admin only | Set role to `employee` |
| PATCH | `/api/admin/users/:id/demote` | Admin only | Set role back to `user` |
| PATCH | `/api/admin/users/:id/make-admin` | Admin only | Set role to `admin` |

#### Admin Protection Rules
- `promote` and `demote` will return `400` if the target user is already an admin — admin role cannot be changed via these endpoints
- `make-admin` is unrestricted by role check — use carefully, intended for internal use only
- All users returned via `GET /api/admin/users` exclude the `__v` field

---

## Pending Modules

> These modules are built and registered in the application but are not actively in use. They will be enabled once the frontend reaches the required stage.

---

### Payment Module — `/api/payments`

**Current State:** Route registered, module built, not in active use.

**Blocked by:** Incomplete frontend checkout and order flow.

**Planned functionality once active:**
- Create payment orders via Razorpay
- Verify and confirm payment on success callback
- Store payment records against projects or invoices
- Handle failed and pending payment states
- Webhook support for real-time payment status updates
- Invoice generation on successful payment

---

### Currency Module — `/api/currency`

**Current State:** Route registered, module built, not in active use.

**Blocked by:** Incomplete frontend — no currency selection or display layer yet.

**Planned functionality once active:**
- Fetch live exchange rates for supported currencies
- Convert project pricing and invoices between INR, USD, GBP, EUR
- Cache exchange rates to avoid excessive third-party API calls
- Allow admin to set base currency per project or client

---

## RBAC Matrix

| Endpoint | User | Employee | Admin |
|---|---|---|---|
| `GET /api/users/me` | ✅ | ✅ | ✅ |
| `GET /api/projects` | Own only | All | All |
| `PATCH /api/projects/:id/status` | ❌ 403 | ❌ 403 | ✅ |
| `GET /api/admin/users` | ❌ 403 | ❌ 403 | ✅ |
| `PATCH /api/admin/users/:id/*` | ❌ 403 | ❌ 403 | ✅ |
| `GET /health` | ✅ | ✅ | ✅ |

---

## What Gets Activated With Frontend Completion

Once the frontend is properly designed and integrated, the following will come into full operation:

- **Payment gateway** — Razorpay order creation, verification, and invoice flow
- **Currency conversion** — live rate fetching and multi-currency display across client dashboards
- **Project tracking pipeline** — `status` and `trackingPhase` fields syncing with sprint boards, phase progress bars, and client-facing dashboards
- **Admin dashboard live updates** — Socket.io events reflecting form submissions, project updates, and status changes in real time

---

## Error Handling

All errors are handled via a global error handler:

```json
{
  "success": false,
  "message": "Error description"
}
```

Standard HTTP status codes used throughout — `200`, `304`, `400`, `403`, `404`, `500`.

> `304 Not Modified` is expected behaviour due to HTTP caching — not an error.

---

## Current System Status

| Check | Status |
|---|---|
| JWT Authentication | ✅ Active |
| Auto User Creation on First Login | ✅ Active |
| RBAC Enforcement | ✅ Active |
| Zod Request Validation | ✅ Active |
| Project Tracking Fields | ✅ In model — pipeline sync pending |
| Cloudinary Config | ✅ Configured — file upload routes pending |
| Payment Module | 🔄 Built — frontend pending |
| Currency Module | 🔄 Built — frontend pending |
| Global Error Handler | ✅ Active |
| CORS Configuration | ✅ Active |