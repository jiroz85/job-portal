<div align="center">

# 💼 JobPortal — Enterprise Recruitment Platform

**A modern, production-grade recruitment ecosystem connecting job seekers, verified employers, and administrators.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-Sequelize-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://job-portal-sigma-wine.vercel.app/)

[🌐 Live Production Demo](https://job-portal-sigma-wine.vercel.app/) • [📖 Deployment Guide](docs/DEPLOYMENT.md) • [🗄️ Database Setup](docs/DATABASE_SETUP.md) • [🏢 Employer Workflow](docs/EMPLOYER_WORKFLOW_GUIDE.md)

</div>

---

## 🌟 Overview

JobPortal is an end-to-end full-stack web application designed for seamless recruitment and hiring workflows. Built on **React 19**, **Vite**, **Express**, and **MySQL with Sequelize**, it delivers dedicated role-based portals with multi-tenant access isolation, high-performance route code-splitting, live resume uploads, real-time audit feeds, and complete Light/Dark theme personalization.

### 🚀 Production Deployments

- **Frontend Application:** [https://job-portal-sigma-wine.vercel.app](https://job-portal-sigma-wine.vercel.app/) *(Hosted on Vercel)*
- **RESTful API Backend:** `https://job-portal-38ed.onrender.com` *(Hosted on Render)*

---

## ✨ Key Features & Capabilities

### 👥 Multi-Role Workspace Portals

| Role | Capabilities | Primary Route |
| :--- | :--- | :--- |
| **Job Seeker** | Browse verified openings, live keyword/salary filters, one-click application submission, bookmarking, resume management (PDF/DOCX), and real-time application tracking. | `/dashboard` |
| **Employer** | Post jobs with rich metadata (salary ranges, experience, requirements), manage active postings, review applicants, download submitted resumes, track hiring pipeline, and view recruitment analytics. | `/employer` |
| **Administrator** | System-wide oversight, manage user accounts & roles, approve/reject job postings, review audit activity feeds, configure platform settings, and monitor recruitment metrics. | `/admin` |

### 🛡️ Enterprise Security & Access Control
- **Role-Based Access Control (RBAC):** Strict JWT-authenticated middleware isolates employer jobs and applicants, preventing tenant spoofing or cross-tenant modification.
- **Fail-Safe Startup:** Server aborts startup if `JWT_SECRET` is insecure, missing, or shorter than 16 characters.
- **Brute-Force & Denial-of-Service Defense:** Integrated `express-rate-limit` throttles repeated login attempts with HTTP 429 backoff.
- **Enumeration Prevention:** Authentication responses return constant-time generic rejection messages.
- **Protected File Storage:** Resume uploads are validated by MIME type (PDF, DOC, DOCX) and file size (5MB maximum), stored securely with access-restricted download endpoints.

### ⚡ Performance & Engineering Highlights
- **64% Smaller Initial Bundle:** Full dynamic code-splitting via `React.lazy()` and Rollup `manualChunks` (`vendor-react`, `vendor-query`, `vendor-icons`).
- **Brotli & Gzip API Compression:** Native response compression reduces JSON transmission payloads by 70–80%.
- **Indexed Database Queries:** MySQL composite indexes on `(status, approvalStatus)`, `employerId`, `createdAt`, and `type` ensure sub-15ms search queries.
- **Dual Theme Engine:** Refined Light and Dark themes with zero-flicker system preference detection and localStorage persistence.

---

## 🛠️ Tech Stack

```text
Frontend:        React 19 • Vite • Tailwind CSS • React Router 6 • React Query • React Icons
Backend:         Node.js • Express.js • Sequelize ORM • MySQL / MariaDB • Multer • BcryptJS • JWT
Optimization:    Brotli/Gzip Compression • Rollup Code-Splitting • Database Indexing
Deployment:      Vercel (Frontend CI/CD) • Render (Backend API Service)
```

---

## 📁 Repository Architecture

```text
job-portal/
├── src/                          # React 19 Frontend application
│   ├── components/               # UI components categorized by role
│   │   ├── admin/                # Admin metrics, audit tables, and navigation
│   │   ├── auth/                 # ProtectedRoute, AdminRoute, EmployerRoute
│   │   ├── common/               # ThemeToggle, modal components, inputs
│   │   ├── dashboard/            # Candidate cards, resume manager, KPI summaries
│   │   ├── employer/             # Employer job cards, applicant trackers
│   │   ├── jobs/                 # Public job cards, skeleton loaders, filters
│   │   └── layout/               # Responsive Navbar, Footers, and Drawers
│   ├── context/                  # React Contexts (Auth, Job, Theme, Application, SavedJobs)
│   ├── hooks/                    # Reusable React hooks (useAuth, useLocalStorage)
│   ├── pages/                    # Core routes (Home, JobDetails, Login, Register, Dashboards)
│   ├── services/                 # Centralized HTTP API services (Axios client)
│   └── utils/                    # Base API URL resolvers & date formatting
├── backend/                      # Express.js REST API
│   ├── src/
│   │   ├── config/               # Database connection & Sequelize instance
│   │   ├── controllers/          # Controllers (auth, jobs, applications, users, audit, resumes)
│   │   ├── middleware/           # JWT verification, RBAC authorization, upload security
│   │   ├── migrations/           # Automated database migrations
│   │   ├── models/               # Sequelize schema definitions & associations
│   │   ├── routes/               # Express API route modules
│   │   └── seeders/              # Development seed scripts for jobs and users
│   └── scripts/                  # Automated integration & security test suites
├── docs/                         # Architecture guides, database setup, and deployment notes
└── public/                       # Static web assets, branding logos, and favicons
```

---

## 🚀 Local Development Quickstart

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [MySQL](https://www.mysql.com/) or MariaDB (via XAMPP, WAMP, Docker, or native service)

### 2. Clone Repository
```bash
git clone https://github.com/jiroz85/job-portal.git
cd job-portal
```

### 3. Database Setup
Create a new MySQL database:
```sql
CREATE DATABASE job_portal;
```

### 4. Backend Configuration & Startup
```bash
cd backend
npm install
```

Configure your `backend/.env` file (copy from `backend/.env.example`):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=job_portal
PORT=3001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_at_least_16_chars
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
```

Run database migrations and start the backend:
```bash
npm run migrate
npm run dev
```
*Backend API will be running on `http://localhost:3001`.*

### 5. Frontend Configuration & Startup
Open a new terminal window:
```bash
cd job-portal
npm install
npm run dev
```
*Frontend application will be running on `http://localhost:5173`.*

---

## 🧪 Automated Testing Suite

The backend includes a comprehensive, dependency-free automated test suite validating security, tenant isolation, and upload contracts:

```bash
cd backend
npm test
```

### Test Coverage Highlights (80 Passing Assertions):
- **Job Ownership Suite (`testJobOwnership.js`):** 29 passed
  - Automatic association of new jobs with authenticated employers.
  - Ownership spoofing rejection when payload specifies mismatched employer IDs.
  - Strict HTTP 403 Forbidden on cross-tenant modification or deletion.
  - Unauthenticated public access for active job listings.
- **Resume Uploads & Security Suite (`testResumeUploads.js`):** 24 passed
  - Valid PDF and DOCX uploads with database metadata tracking.
  - HTTP 400 Bad Request rejection on executable files or files exceeding 5MB.
  - Cross-candidate download isolation (HTTP 403 Forbidden).
  - Employer authorization checks on submitted applicant resumes.
- **Authentication Security Suite (`testAuthSecurity.js`):** 27 passed
  - Startup safety abort when `JWT_SECRET` is missing, short, or placeholder.
  - Bcrypt password verification and zero password-hash leakage in responses.
  - User enumeration prevention (identical responses on invalid credentials).
  - Automatic HTTP 429 rate-limiting threshold enforcement.

---

## 📡 Core API Endpoints

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new candidate or employer |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `GET` | `/api/jobs` | Public | Search & filter active published jobs |
| `GET` | `/api/jobs/:id` | Public | Retrieve single job posting details |
| `POST` | `/api/jobs` | Employer / Admin | Post a new job opening |
| `PUT` | `/api/jobs/:id` | Job Owner / Admin | Update existing job details |
| `DELETE`| `/api/jobs/:id` | Job Owner / Admin | Delete job posting |
| `POST` | `/api/applications` | Public / Seeker | Submit job application with resume |
| `GET` | `/api/applications` | Employer / Admin | View applications for owned jobs |
| `PUT` | `/api/applications/:id/status`| Employer / Admin | Update application stage (Review, Shortlist, etc.) |
| `POST` | `/api/resumes/upload` | Seeker | Upload PDF/DOCX resume file |
| `GET` | `/api/resumes/:id/download` | Owner / Employer / Admin | Download submitted candidate resume |
| `GET` | `/api/audit` | Admin Only | View system-wide security & activity audit feed |
| `GET` | `/api/health` | Public | Service health & database connectivity check |

---

## 📚 Documentation & Technical References

Detailed guides are located in the [`docs/`](docs/) directory:
- 🚀 [Deployment Guide](docs/DEPLOYMENT.md) — Production setup for Vercel, Render, and custom domains.
- 🗄️ [Database Setup](docs/DATABASE_SETUP.md) — Detailed MySQL schema, connection flags, and migrations.
- 🏢 [Employer Workflow Guide](docs/EMPLOYER_WORKFLOW_GUIDE.md) — Step-by-step employer job posting & applicant tracking.
- 👤 [User Management Setup](docs/USER_MANAGEMENT_SETUP.md) — Role-based access control and administrator operations.

---

## 👨‍💻 Author

**Jiregna Meseret Sirna**
- **GitHub:** [@jiroz85](https://github.com/jiroz85)
- **LinkedIn:** [jiregna-meseret](https://www.linkedin.com/in/jiregna-meseret)
- **Portfolio:** [jiregna-portfolio.vercel.app](https://jiregna-portfolio.vercel.app/)

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
