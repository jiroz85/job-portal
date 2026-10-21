import React, { useState, useEffect } from "react";
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
} from "react-icons/fi";
import useAuth from "../../hooks/useAuth";

const EmployerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Support Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

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
    { name: "Overview", href: "/employer", icon: FiHome, exact: true },
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

  const getCurrentSectionTitle = () => {
    const path = location.pathname;
    if (path === "/employer" || path === "/employer/") return "Employer Overview";
    if (path.startsWith("/employer/post-job")) return "Post New Job";
    if (path.startsWith("/employer/jobs/edit")) return "Edit Job Posting";
    if (path.includes("/applicants") && path.includes("/jobs/"))
      return "Job Applicants";
    if (path.startsWith("/employer/jobs")) return "My Job Listings";
    if (path.startsWith("/employer/applicants")) return "Applicant Tracking";
    if (path.startsWith("/employer/interviews")) return "Interview Schedule";
    if (path.startsWith("/employer/analytics")) return "Recruitment Analytics";
    if (path.startsWith("/employer/settings")) return "Employer Settings";
    return "Employer Hub";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Mobile Drawer Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600/50 dark:bg-gray-900/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Professional Employer Sidebar */}
      <aside
        aria-label="Employer Navigation"
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <Link
              to="/employer"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-3 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
                <FiBriefcase className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight block truncate">
                  Employer Hub
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium block">
                  Talent & Recruitment
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close sidebar"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-4 overflow-y-auto">
            <p className="px-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Workspace
            </p>
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 ${
                        active
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold shadow-2xs border-l-4 border-blue-600 dark:border-blue-500"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mr-3 shrink-0 ${
                          active
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400 dark:text-gray-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Profile & Logout Section at Bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 shrink-0">
          <div className="flex items-center space-x-3 mb-3 p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-xs">
              {getInitials()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {displayCompany || displayEmail}
              </p>
              <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                Employer
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/60"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Open sidebar"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {getCurrentSectionTitle()}
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
                Welcome back, {displayName}
              </p>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3">
            {location.pathname !== "/employer/post-job" && (
              <Link
                to="/employer/post-job"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
              >
                <FiPlus className="text-sm" />
                <span>Post Job</span>
              </Link>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployerLayout;
