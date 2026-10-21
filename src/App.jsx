import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import useAuth from "./hooks/useAuth";
import { JobProvider } from "./context/JobContext";
import { ApplicationProvider } from "./context/ApplicationContext";
import { UserProvider } from "./context/UserContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SavedJobsProvider } from "./context/SavedJobsContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import EmployerRoute from "./components/auth/EmployerRoute";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Keep core landing page eager for instantaneous first contentful paint
import HomePage from "./pages/HomePage";

// Lazy-loaded public & auth routes
const JobDetailPage = lazy(() => import("./pages/JobDetailPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));

// Lazy-loaded Admin routes
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const JobsManagement = lazy(() => import("./pages/admin/JobsManagement"));
const AddJob = lazy(() => import("./pages/admin/AddJob"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagementEnhanced"));
const EmployerManagement = lazy(() => import("./pages/admin/EmployerManagement"));
const ApplicationsManagement = lazy(() => import("./pages/admin/ApplicationsManagement"));
const ReportsAnalytics = lazy(() => import("./pages/admin/ReportsAnalytics"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const Notifications = lazy(() => import("./components/admin/Notifications"));

// Lazy-loaded Employer routes
const EmployerLayout = lazy(() => import("./pages/employer/EmployerLayout"));
const EmployerDashboard = lazy(() => import("./pages/employer/EmployerDashboard"));
const PostJob = lazy(() => import("./pages/employer/PostJob"));
const ManageJobs = lazy(() => import("./pages/employer/ManageJobs"));
const EditJob = lazy(() => import("./pages/employer/EditJob"));
const JobApplicants = lazy(() => import("./pages/employer/JobApplicants"));
const ApplicantTracking = lazy(() => import("./pages/employer/ApplicantTracking"));
const InterviewManagement = lazy(() => import("./pages/employer/InterviewManagement"));
const EmployerAnalytics = lazy(() => import("./pages/employer/EmployerAnalytics"));
const EmployerSettings = lazy(() => import("./pages/employer/EmployerSettings"));

// Lazy load Devtools only in development to prevent bloating production bundle
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    )
  : null;

// Accessible, lightweight page loading fallback
const PageLoadingFallback = () => (
  <div
    className="flex items-center justify-center min-h-[50vh] w-full"
    role="status"
    aria-label="Loading page content"
  >
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Create a client with optimal caching defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevent redundant background fetches on tab focus
    },
  },
});

// When logged in, users stay focused within their dashboard.
// The only way to exit back to the public web is by logging out.
const AuthenticatedHomeRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    if (user?.role === "employer") return <Navigate to="/employer" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <HomePage />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <UserProvider>
              <JobProvider>
                <ApplicationProvider>
                  <NotificationProvider>
                    <SavedJobsProvider>
                      <div className="flex flex-col min-h-screen">
                        <Navbar />
                        <main className="flex-1">
                          <Suspense fallback={<PageLoadingFallback />}>
                            <Routes>
                              <Route path="/" element={<AuthenticatedHomeRedirect />} />
                              <Route
                                path="/jobs"
                                element={<Navigate to="/#browse-jobs" replace />}
                              />
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
                                <Route path="employers" element={<EmployerManagement />} />
                                <Route
                                  path="applications"
                                  element={<ApplicationsManagement />}
                                />
                                <Route path="reports" element={<ReportsAnalytics />} />
                                <Route path="notifications" element={<Notifications />} />
                                <Route path="settings" element={<SystemSettings />} />
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
                          </Suspense>
                        </main>
                        <Footer />
                      </div>
                    </SavedJobsProvider>
                  </NotificationProvider>
                </ApplicationProvider>
              </JobProvider>
            </UserProvider>
          </AuthProvider>
          {ReactQueryDevtools && (
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          )}
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
