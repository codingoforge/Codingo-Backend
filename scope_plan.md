# CodingoForge — Dockerization & Azure Deployment Scope Plan

---

## Overview

This document defines the full scope of work required to containerize the CodingoForge backend and migrate it from Render to a production-grade Azure deployment. The plan is structured in phases, progressing from local containerization through to a live, scalable cloud environment with CI/CD automation.

---

## Current State Summary

| Aspect | Current |
|---|---|
| Runtime | Node.js + Express.js |
| Hosting | Render (managed PaaS) |
| Database | MongoDB via Mongoose (cloud-hosted) |
| Auth | Clerk (JWT + SDK) |
| File Storage | Cloudinary (configured, upload routes pending) |
| Payment | Razorpay (built, not yet active) |
| Allowed Origins | `localhost:5173`, `codingoforge.vercel.app` |
| Environment Config | `.env` file (manual, Render dashboard) |

---

## Goals

- Package the Express backend into a reproducible Docker container
- Push and version container images via Azure Container Registry (ACR)
- Deploy and run containers on Azure Container Apps (ACA)
- Automate build and deployment via GitHub Actions CI/CD
- Prepare the infrastructure to support pending modules — Payment, Currency, Socket.io, and Cloudinary uploads — without requiring re-architecture

---

## Out of Scope

- Frontend containerization (Vercel handles this separately)
- MongoDB migration (MongoDB Atlas remains the database — no Azure Cosmos DB migration planned)
- Razorpay or Currency module activation (backend code exists; activation is a frontend concern)
- SSL certificate management (handled by Azure Container Apps ingress)

---

## Phase 1 — Local Dockerization

**Goal:** Make the app run identically in a container as it does natively.

### 1.1 — Dockerfile

Create a production `Dockerfile` at the project root.

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

Key decisions:
- `node:20-alpine` — minimal image, significantly smaller than `node:20`
- `npm ci --omit=dev` — installs only production dependencies; dev tools excluded
- Dependencies copied and installed before source code so Docker layer cache is preserved on code-only changes

### 1.2 — .dockerignore

Prevent unnecessary files from being included in the image.

```
node_modules
.env
.env.*
*.log
.git
.gitignore
README.md
```

### 1.3 — Environment Variable Audit

All values currently in `.env` must be catalogued and classified before deployment:

| Variable | Used By | Sensitivity |
|---|---|---|
| `PORT` | Express server | Low |
| `MONGODB_URI` | Mongoose | High — secret |
| `CLERK_SECRET_KEY` | Clerk SDK (auth middleware) | High — secret |
| `CLERK_PUBLISHABLE_KEY` | Clerk SDK | Medium |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary config | Medium |
| `CLOUDINARY_API_KEY` | Cloudinary config | High — secret |
| `CLOUDINARY_API_SECRET` | Cloudinary config | High — secret |
| `RAZORPAY_KEY_ID` | Payment module | High — secret |
| `RAZORPAY_KEY_SECRET` | Payment module | High — secret |
| `ALLOWED_ORIGINS` | CORS middleware | Low |

All high-sensitivity values will be stored in Azure Key Vault or as Container Apps secrets — never baked into the image.

### 1.4 — Docker Compose (local dev)

A `docker-compose.yml` for local development parity. Uses a local MongoDB container alongside the app so developers do not depend on cloud infrastructure during development.

```yaml
version: "3.9"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    depends_on:
      - mongo
    volumes:
      - .:/app
      - /app/node_modules

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

Note: Production deployment points `MONGODB_URI` to MongoDB Atlas — the local Mongo container is for development only.

### 1.5 — Validation Checklist

- [ ] `docker build -t cforg-server .` completes without errors
- [ ] `docker run --env-file .env cforg-server` starts the server on the correct port
- [ ] `GET /health` returns `200 OK` from inside the container
- [ ] Auth middleware correctly reads Clerk JWT in containerized environment
- [ ] CORS headers are present for `localhost:5173`

---

## Phase 2 — Azure Infrastructure Setup

**Goal:** Provision all required Azure resources before any deployment is attempted.

### 2.1 — Resource Group

Create a dedicated resource group to logically contain all CodingoForge infrastructure.

```
Resource Group: rg-codingoforge-prod
Region: Central India (or East Asia for lower latency to primary users)
```

### 2.2 — Azure Container Registry (ACR)

ACR stores and versions Docker images privately.

```
Registry name: acrcodingoforge
SKU: Basic (can upgrade to Standard for geo-replication later)
Admin access: Enabled (required for Container Apps pull)
```

Images will be tagged using the Git commit SHA for traceability:
```
acrcodingoforge.azurecr.io/cforg-server:abc1234
acrcodingoforge.azurecr.io/cforg-server:latest
```

### 2.3 — Azure Container Apps Environment

Container Apps is the target runtime — serverless containers with built-in ingress, scaling, and secret management. Preferable over AKS for this scale as it removes cluster management overhead.

```
Environment name: cae-codingoforge
Region: Same as resource group
Workload profile: Consumption (scales to zero when idle)
```

### 2.4 — Azure Key Vault (optional but recommended)

For storing secrets referenced by Container Apps at runtime. Prevents secrets from being passed as plain environment variables in CI pipelines.

```
Vault name: kv-codingoforge
Access: Managed Identity (Container App's system-assigned identity is granted Get/List on secrets)
```

Secrets stored:
- `mongodb-uri`
- `clerk-secret-key`
- `cloudinary-api-secret`
- `razorpay-key-secret`

### 2.5 — Managed Identity

Assign a system-assigned managed identity to the Container App. This identity is used to:
- Pull images from ACR without storing credentials
- Read secrets from Key Vault without embedding keys

---

## Phase 3 — CI/CD Pipeline

**Goal:** Every push to `main` automatically builds, tests, and deploys a new container revision.

### 3.1 — GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: acrcodingoforge.azurecr.io
  IMAGE_NAME: cforg-server

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Log in to ACR
        run: az acr login --name acrcodingoforge

      - name: Build and push image
        run: |
          IMAGE_TAG=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          docker build -t $IMAGE_TAG .
          docker push $IMAGE_TAG
          docker tag $IMAGE_TAG ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

      - name: Deploy to Container Apps
        run: |
          az containerapp update \
            --name ca-cforg-server \
            --resource-group rg-codingoforge-prod \
            --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

### 3.2 — GitHub Secrets Required

| Secret | Value |
|---|---|
| `AZURE_CREDENTIALS` | Service principal JSON from `az ad sp create-for-rbac` |

All application secrets (Clerk, Mongo, Razorpay, Cloudinary) are pulled from Azure Key Vault at runtime — they are never stored in GitHub.

### 3.3 — Deployment Strategy

- Container Apps supports **revision-based deployment** — each deploy creates a new revision
- Traffic is shifted 100% to the new revision immediately (can be changed to canary split later)
- Old revisions are retained for 5 days, enabling instant rollback via `az containerapp revision set-mode`

---

## Phase 4 — Container App Configuration

**Goal:** Configure the running container with the correct environment, secrets, ingress, and scaling rules.

### 4.1 — Ingress

```
External ingress: Enabled
Target port: 3000
Transport: HTTP/2
Custom domain: api.codingoforge.com (requires DNS CNAME to Container Apps FQDN)
```

CORS `ALLOWED_ORIGINS` env var must include both `localhost:5173` and `https://codingoforge.vercel.app` — no change from current config.

### 4.2 — Environment Variables in Container App

Non-secret variables set directly on the container:

| Name | Value |
|---|---|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://codingoforge.vercel.app` |

Secret variables referenced from Key Vault via managed identity — not stored in the Container App definition in plain text.

### 4.3 — Scaling Rules

```
Min replicas: 1 (avoid cold start on first request)
Max replicas: 5
Scale trigger: HTTP request concurrency > 20 concurrent requests per replica
```

With the payment module and Socket.io events coming online, scaling on concurrent connections rather than CPU is more appropriate.

### 4.4 — Health Probe

Container Apps can probe the existing `/health` endpoint:

```
Liveness probe: GET /health — expects 200
Initial delay: 10s
Period: 30s
Failure threshold: 3
```

This ensures unhealthy replicas are automatically replaced without manual intervention.

---

## Phase 5 — Socket.io Readiness (pre-work)

The PRD notes that Socket.io events for real-time admin dashboard updates will activate once the frontend is ready. The container infrastructure must be prepared for this before Socket.io is switched on.

### Requirements

- **Sticky sessions:** Container Apps supports session affinity — must be enabled for Socket.io to work correctly, otherwise WebSocket connections may bounce between replicas mid-session
- **Minimum 1 replica:** Scaling to zero breaks persistent WebSocket connections — the `min replicas: 1` rule above covers this
- **WebSocket transport:** Azure Container Apps HTTP/2 ingress supports WebSocket upgrades natively — no additional config needed

No code changes are required in advance. This is purely an infrastructure note to ensure the platform is not misconfigured when Socket.io is activated.

---

## Phase 6 — Verification & Smoke Tests

After deployment, the following must be verified against the live Container App URL before Render is decommissioned.

### 6.1 — Endpoint Smoke Tests

| Test | Expected Result |
|---|---|
| `GET /health` | `200 OK` |
| `GET /api/users/me` (no token) | `401 Unauthorized` |
| `GET /api/users/me` (valid Clerk JWT) | `200` with user object |
| `GET /api/projects` (user token) | `200` with user's own projects |
| `GET /api/projects` (admin token) | `200` with all projects |
| `PATCH /api/projects/:id/status` (user token) | `403 Forbidden` |
| `PATCH /api/projects/:id/status` (admin token) | `200` with updated project |
| `GET /api/admin/users` (admin token) | `200` with all users |
| `PATCH /api/admin/users/:id/promote` (valid) | `200` with updated role |
| `PATCH /api/admin/users/:id/promote` (target is admin) | `400 Bad Request` |

### 6.2 — CORS Verification

Confirm response headers include:
```
Access-Control-Allow-Origin: https://codingoforge.vercel.app
```

Test from the live frontend to confirm no CORS errors on authenticated requests.

### 6.3 — Auto User Creation

Log in via Clerk on the frontend for a new test account. Confirm a MongoDB document is created automatically without hitting any registration endpoint.

---

## Rollout Order

```
Phase 1 → Local Docker build and validation
Phase 2 → Azure resource provisioning
Phase 3 → CI/CD pipeline wired and tested on a staging push
Phase 4 → Container App configured with secrets, ingress, and scaling
Phase 5 → Socket.io infra notes reviewed, sticky sessions enabled
Phase 6 → Smoke tests passed → Render decommissioned
```

---

## Cost Estimate (Azure — Consumption Plan)

| Resource | Estimated Monthly Cost |
|---|---|
| Azure Container Apps (Consumption) | ~$0–$10 at low traffic (scales to zero billing) |
| Azure Container Registry (Basic) | ~$5 |
| Azure Key Vault | ~$1–$3 |
| Bandwidth egress | ~$1–$5 depending on volume |
| **Total estimate** | **~$7–$23/month** |

Costs scale proportionally with traffic. The Consumption workload profile means idle periods cost nothing beyond the registry.

---

## Open Questions

- Will a custom domain (`api.codingoforge.com`) be configured, or will the Azure-assigned FQDN be used initially?
- Should a staging Container App revision be maintained separately from production, or will a feature-branch workflow serve that purpose?
- Once Cloudinary upload routes are activated, should file size limits be enforced at the container ingress layer or within the Express middleware?
- Is there a preference for Azure region based on the primary user base location?