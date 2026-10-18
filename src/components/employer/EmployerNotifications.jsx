import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiBell,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiX,
  FiEye,
  FiMail,
  FiAlertCircle,
  FiTrendingUp,
} from "react-icons/fi";

const EmployerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDropdown]);

  useEffect(() => {
    // Listen for new applications
    const handleApplicationSubmitted = (event) => {
      const applicantName = event?.detail?.applicantName || "A candidate";
      const jobTitle = event?.detail?.jobTitle || "your open position";

      const newNotification = {
        id: Date.now(),
        type: "new_application",
        title: "New Application Received",
        message: `${applicantName} applied for ${jobTitle}`,
        timestamp: new Date(),
        read: false,
        data: event?.detail,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permitted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("New Application Received", {
          body: newNotification.message,
          icon: "/favicon.ico",
        });
      }
    };

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    window.addEventListener("applicationSubmitted", handleApplicationSubmitted);

    return () => {
      window.removeEventListener(
        "applicationSubmitted",
        handleApplicationSubmitted
      );
    };
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    const target = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
    if (target && !target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_application":
        return <FiUser className="w-4 h-4 text-blue-500" />;
      case "interview_scheduled":
        return <FiCalendar className="w-4 h-4 text-purple-500" />;
      case "application_updated":
        return <FiBriefcase className="w-4 h-4 text-green-500" />;
      case "system_alert":
        return <FiAlertCircle className="w-4 h-4 text-red-500" />;
      case "deadline_reminder":
        return <FiEye className="w-4 h-4 text-amber-500" />;
      default:
        return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setShowDropdown((prev) => !prev)}
        aria-label="View notifications"
        aria-expanded={showDropdown}
        className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Live Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md"
                aria-label="Close notifications"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2 text-gray-400">
                  <FiBell className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No new alerts</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Real-time application submissions will appear here
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 transition-colors ${
                    !notification.read
                      ? "bg-blue-50/60 dark:bg-blue-950/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                          aria-label="Dismiss notification"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 text-center">
            <Link
              to="/employer/applicants"
              onClick={() => setShowDropdown(false)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open Applicant Tracking →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerNotifications;
