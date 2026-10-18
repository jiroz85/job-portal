import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaBriefcase,
  FaBars,
  FaTimes,
  FaUserCircle,
  FaPlus,
  FaTachometerAlt,
} from "react-icons/fa";
import useAuth from "../../hooks/useAuth";
import NotificationDropdown from "../Notifications/NotificationDropdown";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const getDashboardPath = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "employer") return "/employer";
    return "/dashboard";
  };

  const getDashboardLabel = () => {
    if (user?.role === "admin") return "Admin Dashboard";
    if (user?.role === "employer") return "Employer Dashboard";
    return "My Dashboard";
  };

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const handleBrowseJobsClick = (e) => {
    closeMenu();
    if (location.pathname === "/") {
      e.preventDefault();
      const target = document.getElementById("featured-jobs");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/#featured-jobs");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center space-x-2.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <FaBriefcase className="text-lg" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                JobPortal
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Careers & Talent
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/")
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              }`}
            >
              Home
            </Link>

            <Link
              to="/#featured-jobs"
              onClick={handleBrowseJobsClick}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.hash === "#featured-jobs"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              }`}
            >
              Browse Jobs
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                {/* Role-based dashboard link */}
                <Link
                  to={getDashboardPath()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(getDashboardPath())
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <FaTachometerAlt className="text-xs" />
                  <span>{getDashboardLabel()}</span>
                </Link>

                {/* Quick Post Job action for Employer/Admin */}
                {(user?.role === "employer" || user?.role === "admin") && (
                  <Link
                    to={user?.role === "admin" ? "/admin/jobs/add" : "/employer/post-job"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                  >
                    <FaPlus className="text-xs" />
                    <span>Post Job</span>
                  </Link>
                )}

                <NotificationDropdown />

                {/* User info & role badge */}
                <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
                  <FaUserCircle className="text-base text-gray-500 dark:text-gray-400" />
                  <span className="font-semibold text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
                    {user?.name || user?.email?.split("@")[0] || "User"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {user?.role || "seeker"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/60"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex items-center md:hidden space-x-2">
            {isAuthenticated && <NotificationDropdown />}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <FaTimes className="w-6 h-6" />
              ) : (
                <FaBars className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <Link
              to="/"
              onClick={closeMenu}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive("/")
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              Home
            </Link>

            <Link
              to="/#featured-jobs"
              onClick={handleBrowseJobsClick}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                location.hash === "#featured-jobs"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              Browse Jobs
            </Link>

            {isAuthenticated ? (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/80 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {user?.name || user?.email}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {user?.role || "seeker"}
                  </span>
                </div>

                <Link
                  to={getDashboardPath()}
                  onClick={closeMenu}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                >
                  <FaTachometerAlt />
                  <span>{getDashboardLabel()}</span>
                </Link>

                {(user?.role === "employer" || user?.role === "admin") && (
                  <Link
                    to={user?.role === "admin" ? "/admin/jobs/add" : "/employer/post-job"}
                    onClick={closeMenu}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  >
                    <FaPlus />
                    <span>Post a Job</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg text-base font-medium bg-blue-600 text-white text-center hover:bg-blue-700 shadow-sm"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
