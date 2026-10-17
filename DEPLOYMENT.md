# Production Deployment Guide: Job Portal

This guide provides step-by-step instructions for deploying the Job Portal application:
- **Frontend:** React + Vite on **Vercel**
- **Backend:** Express API on **Render**
- **Database:** Managed MySQL-compatible provider (e.g., Aiven, Render MySQL, AWS RDS, PlanetScale, Railway)

---

## Architecture Overview

```mermaid
flowchart LR
    Client["User Browser"] -->|"HTTPS"| Vercel["Vercel (React Frontend)"]
    Vercel -->|"REST API (VITE_API_URL)"| Render["Render (Express API)"]
    Render -->|"MySQL + SSL (Port 3306/Custom)"| ManagedDB[("Managed MySQL Database")]
```

---

## 1. Managed MySQL Database Setup

1. **Provision your database**: Create a MySQL instance using your preferred provider (e.g., [Aiven for MySQL](https://aiven.io/), [Railway](https://railway.app/), [Render PostgreSQL/MySQL](https://render.com), or AWS RDS).
2. **Retrieve connection details**:
   - `DB_HOST`: Hostname (e.g. `mysql-example.aivencloud.com`)
   - `DB_PORT`: Port (e.g. `25060` or `3306`)
   - `DB_USER`: Username (e.g. `avnadmin` or your app user)
   - `DB_PASSWORD`: Password
   - `DB_NAME`: Database name (e.g. `job_portal` or `defaultdb`)
   - Or `DATABASE_URL`: Connection URI (`mysql://user:pass@host:port/dbname`)
3. **SSL Requirement**: Managed databases generally mandate SSL connections. The backend automatically enables SSL when connecting to remote hosts.

---

## 2. Backend Deployment on Render

### Service Configuration
1. Log in to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your Git repository (`Job-portal`).
3. Set the following build and runtime configurations:
   - **Name**: `job-portal-api` (or preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run migrate && npm start`
   - **Health Check Path**: `/api/health`

### Backend Environment Variables
In your Render Web Service dashboard, go to **Environment** and add the following:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Port automatically assigned by Render | `10000` (set by Render) |
| `JWT_SECRET` | Secure key for JWT signing (>= 32 chars) | Generated using `openssl rand -hex 32` |
| `JWT_EXPIRE` | Token validity duration | `30d` |
| `DB_HOST` | Managed database host | `mysql-example.aivencloud.com` |
| `DB_PORT` | Managed database port | `3306` (or provider port) |
| `DB_USER` | Database username | `app_user` |
| `DB_PASSWORD` | Database password | `your_secure_db_password` |
| `DB_NAME` | Pre-created database name | `job_portal` |
| `DB_SSL` | Enable SSL for remote DB | `true` |
| `DB_SSL_REJECT_UNAUTHORIZED` | Bypass self-signed CA errors if necessary | `false` |
| `DB_AUTO_CREATE` | Disable auto-creation attempts | `false` |
| `FRONTEND_URL` | Your production Vercel URL | `https://your-job-portal.vercel.app` |
| `ALLOWED_ORIGINS` | Comma-separated additional origins | `https://your-job-portal.vercel.app` |

*(Note: Alternatively, you can supply `DATABASE_URL` instead of `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`)*

---

## 3. Frontend Deployment on Vercel

### Service Configuration
1. Log in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
2. Import the Git repository (`Job-portal`).
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (root directory where `package.json` and `vite.config.js` reside)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Frontend Environment Variables
In Vercel **Settings** -> **Environment Variables**, set:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Render backend URL (no trailing slash) | `https://job-portal-api.onrender.com` |
| `VITE_APP_NAME` | Application display name | `Job Portal` |
| `VITE_APP_VERSION` | Application release version | `1.0.0` |

### SPA Client Routing (`vercel.json`)
Client-side routing rules are pre-configured in `vercel.json` at the root of the project:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures refreshing pages like `/jobs`, `/login`, `/dashboard`, or `/applicant-tracking` serves `/index.html` without 404 errors.

---

## 4. Database Migrations

Database migrations are non-destructive and idempotent:
- **Command**: `npm run migrate` (in `backend/`)
- When deploying on Render, prefixing the start command with `npm run migrate && npm start` ensures all tables, indexes, and columns (`employerId`, verification fields, resumes table) are up-to-date before accepting traffic.
- Existing records are safely preserved without data loss or table truncation.

---

## 5. Verification Checklist

1. **Backend Health Check**:
   - Access `https://your-render-api.onrender.com/api/health`
   - Expect HTTP 200:
     ```json
     {
       "status": "healthy",
       "environment": "production",
       "database": "connected"
     }
     ```
2. **CORS Verification**:
   - Inspect browser DevTools on Vercel frontend: API requests to Render should succeed with `access-control-allow-origin: https://your-job-portal.vercel.app`.
3. **Route Refresh Test**:
   - On Vercel, navigate to `/jobs` and hard refresh (F5). The page should render normally without a 404 error.
4. **Credential Isolation**:
   - Confirm that `JWT_SECRET` and database passwords exist only in the Render environment settings and are never bundled into the Vercel frontend assets.
