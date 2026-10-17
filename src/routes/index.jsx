import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import RoleBasedRoute from "../components/auth/RoleBasedRoute";
import PermissionGuard from "../components/auth/PermissionGuard";

// Public Routes
import HomePage from "../pages/HomePage";
import JobsPage from "../pages/JobsPage";
import JobDetailPage from "../pages/JobDetailPage";
import Login from "../pages/Login";
import Register from "../pages/Register";
import NotFoundPage from "../pages/NotFoundPage";

// User Routes
import UserDashboard from "../pages/UserDashboard";
import UserProfile from "../components/user/UserProfile";
import UserSettings from "../components/user/UserSettings";

// Admin Routes
import AdminDashboard from "../pages/admin/AdminDashboard";

// Employer Routes
import EmployerLayout from "../pages/employer/EmployerLayout";
import EmployerDashboard from "../pages/employer/EmployerDashboard";
import PostJob from "../pages/employer/PostJob";
import ManageJobs from "../pages/employer/ManageJobs";
import EditJob from "../pages/employer/EditJob";
import JobApplicants from "../pages/employer/JobApplicants";
import ApplicantTracking from "../pages/employer/ApplicantTracking";

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route path="/jobs/:id" element={<JobDetailPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes - Require Authentication */}
      <Route
        path="/dashboard"
        element={
          <RoleBasedRoute>
            <UserDashboard />
          </RoleBasedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <RoleBasedRoute>
            <UserProfile />
          </RoleBasedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <RoleBasedRoute>
            <UserSettings />
          </RoleBasedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <RoleBasedRoute requiredRole="admin">
            <AdminDashboard />
          </RoleBasedRoute>
        }
      />

      {/* Employer Routes */}
      <Route
        path="/employer"
        element={
          <RoleBasedRoute requiredRole="employer">
            <EmployerLayout />
          </RoleBasedRoute>
        }
      >
        <Route index element={<EmployerDashboard />} />
        <Route path="post-job" element={<PostJob />} />
        <Route path="jobs" element={<ManageJobs />} />
        <Route path="jobs/:id/edit" element={<EditJob />} />
        <Route path="jobs/:jobId/applicants" element={<JobApplicants />} />
        <Route path="applicants" element={<ApplicantTracking />} />
        <Route path="*" element={<Navigate to="/employer" replace />} />
      </Route>

      {/* Role-based redirects */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to={
                user.role === "admin"
                  ? "/admin"
                  : user.role === "employer"
                  ? "/employer"
                  : "/dashboard"
              }
              replace
            />
          ) : (
            <Login />
          )
        }
      />

      {/* 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
