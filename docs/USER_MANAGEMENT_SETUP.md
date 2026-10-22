# Real User Management System Setup

This document explains how to set up and run the real user management system with backend integration.

## Overview

The user management system now includes:
- Real backend API with MySQL database
- User authentication with JWT tokens
- Role-based access control (admin, employer, jobseeker)
- Audit logging for all admin actions
- Complete CRUD operations for user management
- Sample data seeding

## Backend Setup

### 1. Database Configuration

1. Install MySQL and create a database:
```sql
CREATE DATABASE job_portal;
```

2. Copy the environment file:
```bash
cp backend/.env.example backend/.env
```

3. Update the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=job_portal
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Seed Sample Users

Run the user seeder to create sample users:

```bash
npm run seed-users
```

This will create the following users:

| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@example.com | admin123 | admin | active |
| john.doe@example.com | password123 | admin | active |
| hr@techcorp.com | password123 | employer | active |
| sarah.w@example.com | password123 | employer | active |
| jane.smith@example.com | password123 | jobseeker | active |
| mike.j@example.com | password123 | jobseeker | active |
| test@example.com | password123 | jobseeker | inactive |
| blocked@example.com | password123 | jobseeker | blocked |

### 4. Start Backend Server

```bash
npm run dev
```

The backend will run on `http://localhost:3001`

## Frontend Setup

### 1. Install Dependencies

```bash
cd ../
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001
```

### 3. Start Frontend

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Features

### User Management (Admin Only)

1. **View Users**: List all users with pagination, search, and filtering
2. **Role Management**: Change user roles (admin, employer, jobseeker)
3. **Status Management**: Activate/deactivate users
4. **Delete Users**: Permanently remove users
5. **Audit Trail**: All actions are logged with details

### Authentication

1. **Login**: Real authentication with JWT tokens
2. **Registration**: User registration with role assignment
3. **Token Validation**: Automatic token verification
4. **Protected Routes**: Role-based access control

### Audit System

1. **Action Logging**: All admin actions are logged
2. **User Activity**: Track user-specific activities
3. **System Statistics**: Overview of system usage
4. **Export**: Export audit logs as CSV

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### User Management (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/role` - Update user role
- `PUT /api/users/:id/status` - Update user status
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/statistics` - Get user statistics
- `GET /api/users/:id/activity` - Get user activity

### Audit (Admin Only)
- `POST /api/audit/log` - Log action
- `GET /api/audit/logs` - Get audit logs
- `GET /api/audit/user/:userId/activity` - Get user activity
- `GET /api/audit/stats` - Get system statistics
- `GET /api/audit/export` - Export audit logs

## Testing the System

1. **Admin Login**: Use `admin@example.com` with password `admin123`
2. **Navigate to Admin Panel**: You'll be redirected to `/admin`
3. **User Management**: Click on "User Management" to see all users
4. **Test Actions**: Try changing roles, statuses, and deleting users
5. **Check Audit**: All actions are logged and can be viewed

## Database Schema

### Users Table
- Basic user information (name, email, password)
- Role and status fields
- Profile information (skills, experience, education)
- Metadata (last login, created at, etc.)

### Audit Logs Table
- Action type and details
- Target user and performer
- IP address and user agent
- Timestamps

## Security Features

1. **Password Hashing**: All passwords are hashed with bcrypt
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access**: Proper authorization checks
4. **Input Validation**: Server-side validation for all inputs
5. **Audit Trail**: Complete logging of admin actions

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure MySQL is running and credentials are correct
2. **CORS Issues**: The backend is configured to allow frontend requests
3. **Token Issues**: Clear localStorage if you have authentication problems
4. **Port Conflicts**: Make sure ports 3001 and 5173 are available

### Resetting Data

To reset all data and reseed:

```bash
cd backend
npm run seed-users
```

## Development Notes

- The backend uses Sequelize ORM with MySQL
- Frontend uses React with Tailwind CSS
- Real-time updates after user management actions
- Proper error handling and loading states
- Responsive design for mobile compatibility
