# 💼 Job Portal

A full-stack job portal platform that connects job seekers, employers, and administrators through a centralized system for job posting, applications, user management, and recruitment workflows.

## ✨ Features

- 🔐 User authentication and authorization
- 👤 Job seeker accounts and profiles
- 🏢 Employer accounts and job management
- 💼 Job posting and management
- 📄 Job application workflow
- 🔔 Notifications
- 🛡️ Admin dashboard and user management
- 📊 Application and recruitment management
- 🔄 Role-based navigation and access control
- 📝 Audit functionality
- 🗄️ Database migrations, models, and seed data

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router

### Backend

- Node.js
- Express.js
- REST API
- Authentication & authorization

### Database

- Database models and migrations
- Seeders for development data

## 👥 User Roles

### Job Seekers

- Browse available jobs
- View job details
- Apply for positions
- Manage applications and profile information

### Employers

- Create and manage job postings
- Review applications
- Manage recruitment workflows

### Administrators

- Manage users
- Monitor platform activity
- Manage application and recruitment data
- Review audit information

## 📁 Project Structure

```text
job-portal/
├── src/                  # React & Vite frontend source code
│   ├── components/       # Reusable UI & role-based components
│   ├── context/          # State management contexts (Auth, Theme, Job, Application)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Public pages & role-specific dashboards
│   ├── services/         # API service integration layer
│   └── utils/            # Helper utilities and API configuration
├── backend/              # Node.js & Express REST API
│   ├── src/              # Controllers, models, migrations, and routes
│   └── scripts/          # Database seeding & automated security test suites
├── docs/                 # Platform setup, deployment, & workflow documentation
├── tests/                # Automated & integration test suites
└── public/               # Static web assets, brand logos, and icons
```

## 📚 Documentation & Guides

Comprehensive guides are available in the [`docs/`](docs/) directory:
- 🚀 [Deployment Guide](docs/DEPLOYMENT.md) — Complete setup for Vercel, Render, and production environments.
- 🗄️ [Database Setup](docs/DATABASE_SETUP.md) — MySQL database creation, schema sync, and table setup.
- 🏢 [Employer Workflow Guide](docs/EMPLOYER_WORKFLOW_GUIDE.md) — Step-by-step employer job posting & applicant tracking.
- 👤 [User Management Setup](docs/USER_MANAGEMENT_SETUP.md) — Role-based access control and administrator operations.

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm
- A configured database

### Clone the repository

```bash
git clone https://github.com/jiroz85/job-portal.git
cd job-portal
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

Open a new terminal:

```bash
cd job-portal
npm install
npm run dev
```

## 👨‍💻 Author

**Jiregna Meseret Sirna**

- GitHub: https://github.com/jiroz85
- LinkedIn: https://www.linkedin.com/in/jiregna-meseret
- Portfolio: https://jiregna-portfolio.vercel.app/
