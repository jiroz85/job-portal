# Job Portal Workflow Test Guide

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and configure your database
cp .env.example .env
# Start the backend server
npm run dev
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```

## Testing the Complete Workflow

### Step 1: Employer Posts a Job
1. Navigate to `http://localhost:5173/employer/post-job`
2. Fill in the job details:
   - Job Title: "Senior React Developer"
   - Company: "Tech Corp"
   - Location: "San Francisco, CA"
   - Job Type: "Full-time"
   - Experience Level: "Mid Level"
   - Salary: "$100,000 - $150,000"
   - Description: "We are looking for a senior React developer..."
   - Requirements: "5+ years of React experience..."
   - Contact Email: "hr@techcorp.com"
3. Add some skills (React, JavaScript, Node.js)
4. Click "Post Job"

### Step 2: Job Seeker Applies
1. Navigate to `http://localhost:5173/jobs`
2. Find the posted job and click on it
3. Click "Apply Now"
4. Fill in the application form:
   - Full Name: "John Doe"
   - Email: "john.doe@email.com"
   - Phone: "+1 (555) 123-4567"
   - Experience: "5 years of web development..."
   - Education: "Bachelor's in Computer Science"
   - Skills: "React, JavaScript, Node.js"
   - Cover Letter: "I am excited about this opportunity..."
5. Upload a resume file (any file)
6. Click "Submit Application"

### Step 3: Admin Views Applications
1. Navigate to `http://localhost:5173/admin/applications`
2. You should see the submitted application
3. Click on the application to view details
4. You can update the application status (pending → reviewing → interview → accepted/rejected)

## API Endpoints

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Applications
- `GET /api/applications` - Get all applications (admin/employer only)
- `GET /api/applications/:id` - Get single application (admin/employer only)
- `POST /api/applications` - Submit application (public)
- `PUT /api/applications/:id/status` - Update application status (admin/employer only)
- `GET /api/applications/email/:email` - Get applications by email (public)

## Database Setup

Make sure you have MySQL installed and create a database:

```sql
CREATE DATABASE job_portal;
```

The application will automatically create the necessary tables when you start the backend server.

## Notes

- The backend runs on port 3001
- The frontend runs on port 5173 (Vite default)
- Authentication is simplified for testing - in production, implement proper JWT authentication
- File uploads are simulated - in production, implement proper file storage
