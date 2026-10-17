import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX,
  FiHome,
  FiPlus,
  FiCalendar,
  FiLogOut,
  FiExternalLink,
  FiChevronDown,
  FiUser,
} from "react-icons/fi";
import useAuth from "../../hooks/useAuth";

const EmployerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName =
    user?.name ||
    user?.company ||
    (user?.email ? user.email.split("@")[0] : "Employer");
  const displayCompany = user?.company || "Employer Portal";
  const displayEmail = user?.email || "";

  const getInitials = () => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user?.company) {
      const parts = user.company.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.company.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "EM";
  };

  const navigation = [
    { name: "Dashboard", href: "/employer", icon: FiHome, exact: true },
    { name: "Post Job", href: "/employer/post-job", icon: FiPlus, exact: true },
    { name: "My Jobs", href: "/employer/jobs", icon: FiBriefcase, exact: false },
    { name: "Applicants", href: "/employer/applicants", icon: FiUsers, exact: false },
    { name: "Interviews", href: "/employer/interviews", icon: FiCalendar, exact: false },
    { name: "Analytics", href: "/employer/analytics", icon: FiBarChart2, exact: false },
    { name: "Settings", href: "/employer/settings", icon: FiSettings, exact: false },
  ];

  const isActive = (item) => {
    if (item.exact || item.href === "/employer") {
      return location.pathname === "/employer" || location.pathname === "/employer/";
    }
    return location.pathname.startsWith(item.href);
  };

  // Determine current section title for breadcrumb
  const getCurrentSectionName = () => {
    const path = location.pathname;
    if (path === "/employer" || path === "/employer/") return "Overview";
    if (path.startsWith("/employer/post-job")) return "Post New Job";
    if (path.includes("/applicants") && path.includes("/jobs/"))
      return "Job Applicants";
    if (path.startsWith("/employer/jobs")) return "My Jobs";
    if (path.startsWith("/employer/applicants")) return "Applicants";
    if (path.startsWith("/employer/interviews")) return "Interviews";
    if (path.startsWith("/employer/analytics")) return "Analytics";
    if (path.startsWith("/employer/settings")) return "Settings";
    return "Employer Hub";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row transition-colors">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:flex lg:flex-col lg:shrink-0
        `}
      >
        {/* Sidebar Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
          <Link
            to="/employer"
            className="flex items-center space-x-3 group"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <FiBriefcase className="text-xl" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-tight block">
                Employer Hub
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Talent & Recruitment
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Link to Public Portal */}
        <div className="p-3">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200/60 dark:border-gray-700/60"
            onClick={() => setSidebarOpen(false)}
          >
            <span>Job Seeker Public View</span>
            <FiExternalLink className="text-xs" />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150
                  ${
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-semibold shadow-xs border-l-4 border-blue-600 dark:border-blue-500"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 shrink-0 transition-colors
                    ${
                      active
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    }
                  `}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Authenticated Employer Card at Bottom of Sidebar */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3 mb-3 p-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-xs shrink-0">
              {getInitials()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {displayCompany}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors border border-red-200 dark:border-red-900/60"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu toggle & Breadcrumbs */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Open sidebar navigation"
              >
                <FiMenu className="w-6 h-6" />
              </button>

              <div className="flex items-center space-x-2 text-sm">
                <Link
                  to="/employer"
                  className="font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Employer
                </Link>
                <span className="text-gray-400 dark:text-gray-600">/</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {getCurrentSectionName()}
                </span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Quick Post Job Button */}
              {location.pathname !== "/employer/post-job" && (
                <Link
                  to="/employer/post-job"
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Post Job</span>
                </Link>
              )}

              {/* Browse Public Jobs Link */}
              <Link
                to="/jobs"
                className="hidden md:inline-flex items-center space-x-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span>Find Jobs</span>
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-xs">
                    {getInitials()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight max-w-[120px] truncate">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {user?.role === "admin" ? "Admin" : "Employer"}
                    </p>
                  </div>
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Signed in as
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      {displayEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {displayEmail}
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/employer/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <FiSettings className="w-4 h-4 text-gray-400" />
                        <span>Employer Settings</span>
                      </Link>
                      <Link
                        to="/"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <FiUser className="w-4 h-4 text-gray-400" />
                        <span>Public Portal</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-950 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployerLayout;
