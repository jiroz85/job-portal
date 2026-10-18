import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Support Escape key to close mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  // Map current path to active section
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/") return "dashboard";
    if (path.startsWith("/admin/jobs"))
      return path.includes("add") ? "add-job" : "jobs";
    if (path.startsWith("/admin/users")) return "users";
    if (path.startsWith("/admin/employers")) return "employers";
    if (path.startsWith("/admin/applications")) return "applications";
    if (path.startsWith("/admin/reports")) return "reports";
    if (path.startsWith("/admin/notifications")) return "notifications";
    if (path.startsWith("/admin/settings")) return "settings";
    return "dashboard";
  };

  const handleSectionChange = (section) => {
    const routes = {
      dashboard: "/admin",
      jobs: "/admin/jobs",
      "add-job": "/admin/jobs/add",
      users: "/admin/users",
      employers: "/admin/employers",
      applications: "/admin/applications",
      reports: "/admin/reports",
      settings: "/admin/settings",
      notifications: "/admin/notifications",
    };

    if (routes[section]) {
      navigate(routes[section]);
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Mobile sidebar backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600/50 dark:bg-gray-900/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <AdminSidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        activeSection={getActiveSection()}
        onSectionChange={handleSectionChange}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader toggleSidebar={toggleSidebar} />
        <main className="p-4 sm:p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
