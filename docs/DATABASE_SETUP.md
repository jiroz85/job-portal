# Database Setup Instructions

## 🗄️ Database Configuration

### 1. Setup MySQL Database

```sql
CREATE DATABASE job_portal;
```

### 2. Configure Environment

Copy `backend/.env.example` to `backend/.env` and update:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=job_portal
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d
```

### 3. Initialize Database

```bash
cd backend
npm run seed  # Run this once to populate with sample data
npm start     # Start the server
```

## 🔄 Data Persistence

✅ **Jobs now persist permanently in database**

- Jobs are stored in MySQL database
- Data survives server restarts
- Only admins can remove posted jobs
- Real-time updates across all pages

## 📍 Where Jobs Appear

- **Homepage**: Recent jobs section
- **Browse Jobs**: Complete job listings
- **Admin Panel**: Job management
- **User Dashboard**: Job recommendations
- **Search Results**: All search functionality

## 🚀 Start Application

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd ..
npm run dev
```

Your posted jobs will now persist constantly until removed by admin!
