import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./context/AuthContext";
import { JobProvider } from "./context/JobContext";
import { ApplicationProvider } from "./context/ApplicationContext";
import { UserProvider } from "./context/UserContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SavedJobsProvider } from "./context/SavedJobsContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import EmployerRoute from "./components/auth/EmployerRoute";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import NotFoundPage from "./pages/NotFoundPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import JobsManagement from "./pages/admin/JobsManagement";
import AddJob from "./pages/admin/AddJob";
import UsersManagement from "./pages/admin/UsersManagementEnhanced";
import EmployerManagement from "./pages/admin/EmployerManagement";
import ApplicationsManagement from "./pages/admin/ApplicationsManagement";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import SystemSettings from "./pages/admin/SystemSettings";
import Notifications from "./components/admin/Notifications";
import EmployerLayout from "./pages/employer/EmployerLayout";
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import PostJob from "./pages/employer/PostJob";
import ManageJobs from "./pages/employer/ManageJobs";
import EditJob from "./pages/employer/EditJob";
import JobApplicants from "./pages/employer/JobApplicants";
import ApplicantTracking from "./pages/employer/ApplicantTracking";
import InterviewManagement from "./pages/employer/InterviewManagement";
import EmployerAnalytics from "./pages/employer/EmployerAnalytics";
import EmployerSettings from "./pages/employer/EmployerSettings";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <UserProvider>
            <JobProvider>
              <ApplicationProvider>
                <NotificationProvider>
                  <SavedJobsProvider>
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/jobs" element={<JobsPage />} />
                          <Route path="/jobs/:id" element={<JobDetailPage />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route
                            path="/dashboard"
                            element={
                              <ProtectedRoute>
                                <UserDashboard />
                              </ProtectedRoute>
                            }
                          />

                          {/* Admin Routes - Protected and Admin Only */}
                          <Route
                            path="/admin"
                            element={
                              <AdminRoute>
                                <AdminLayout />
                              </AdminRoute>
                            }
                          >
                            <Route index element={<AdminDashboard />} />
                            <Route path="jobs" element={<JobsManagement />} />
                            <Route path="jobs/add" element={<AddJob />} />
                            <Route path="users" element={<UsersManagement />} />
                            <Route
                              path="employers"
                              element={<EmployerManagement />}
                            />
                            <Route
                              path="applications"
                              element={<ApplicationsManagement />}
                            />
                            <Route
                              path="reports"
                              element={<ReportsAnalytics />}
                            />
                            <Route
                              path="notifications"
                              element={<Notifications />}
                            />
                            <Route
                              path="settings"
                              element={<SystemSettings />}
                            />
                          </Route>

                          {/* Employer Routes - Protected and Employer/Admin Only */}
                          <Route
                            path="/employer"
                            element={
                              <EmployerRoute>
                                <EmployerLayout />
                              </EmployerRoute>
                            }
                          >
                            <Route index element={<EmployerDashboard />} />
                            <Route path="post-job" element={<PostJob />} />
                            <Route path="jobs" element={<ManageJobs />} />
                            <Route path="jobs/:id/edit" element={<EditJob />} />
                            <Route
                              path="jobs/:jobId/applicants"
                              element={<JobApplicants />}
                            />
                            <Route
                              path="applicants"
                              element={<ApplicantTracking />}
                            />
                            <Route
                              path="interviews"
                              element={<InterviewManagement />}
                            />
                            <Route
                              path="analytics"
                              element={<EmployerAnalytics />}
                            />
                            <Route
                              path="settings"
                              element={<EmployerSettings />}
                            />
                            {/* Fallback for unknown /employer/* subroutes */}
                            <Route
                              path="*"
                              element={<Navigate to="/employer" replace />}
                            />
                          </Route>

                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </main>
                      <Footer />
                    </div>
                  </SavedJobsProvider>
                </NotificationProvider>
              </ApplicationProvider>
            </JobProvider>
          </UserProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
