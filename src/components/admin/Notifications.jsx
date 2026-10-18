import React, { useState, useEffect, useCallback } from "react";
import {
  FiBell,
  FiCheck,
  FiX,
  FiTrash2,
  FiFilter,
  FiSearch,
  FiClock,
  FiUser,
  FiBriefcase,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
} from "react-icons/fi";
import notificationService from "../../services/notificationService";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationService.getNotifications({
        page: currentPage,
        limit: 20,
        filter,
        search: searchTerm,
      });

      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setPagination(
          res.data.pagination || {
            total: (res.data.notifications || []).length,
            page: currentPage,
            limit: 20,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        );
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError(err.response?.data?.error || "Failed to load notifications from database.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, searchTerm]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const markAsRead = async (id) => {
    try {
      setActionLoading(true);
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      showFeedback("Notification marked as read");
    } catch (err) {
      console.error("Failed to mark as read:", err);
      setError(err.response?.data?.error || "Failed to update notification.");
    } finally {
      setActionLoading(false);
    }
  };

  const markAsUnread = async (id) => {
    try {
      setActionLoading(true);
      await notificationService.markAsUnread(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: false } : notif))
      );
      setUnreadCount((prev) => prev + 1);
      showFeedback("Notification marked as unread");
    } catch (err) {
      console.error("Failed to mark as unread:", err);
      setError(err.response?.data?.error || "Failed to update notification.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      setActionLoading(true);
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      loadNotifications();
      showFeedback("Notification deleted");
    } catch (err) {
      console.error("Failed to delete notification:", err);
      setError(err.response?.data?.error || "Failed to delete notification.");
    } finally {
      setActionLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      showFeedback("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      setError(err.response?.data?.error || "Failed to mark all as read.");
    } finally {
      setActionLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear all your notifications? This action cannot be undone.")) {
      return;
    }

    try {
      setActionLoading(true);
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 1 }));
      showFeedback("All notifications cleared");
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      setError(err.response?.data?.error || "Failed to clear notifications.");
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "job_alert":
        return <FiBriefcase className="h-4 w-4 text-indigo-500" />;
      case "application_status":
      case "application_update":
        return <FiUser className="h-4 w-4 text-emerald-500" />;
      case "error":
        return <FiAlertCircle className="h-4 w-4 text-red-500" />;
      case "success":
        return <FiCheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FiBell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-900";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 border-green-200 dark:border-green-900";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900";
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"} persisted in the database`
              : "All caught up! No unread notifications."}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            disabled={actionLoading || unreadCount === 0}
            onClick={markAllAsRead}
            className="inline-flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            <FiCheck className="w-4 h-4 mr-1.5" />
            Mark All as Read
          </button>
          <button
            type="button"
            disabled={actionLoading || notifications.length === 0}
            onClick={clearAllNotifications}
            className="inline-flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors shadow-xs"
          >
            <FiTrash2 className="w-4 h-4 mr-1.5" />
            Clear All
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={loadNotifications}
            className="inline-flex items-center p-2 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs"
            title="Refresh notifications"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-start p-3.5 text-xs rounded-lg border bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900">
        <FiShield className="w-4 h-4 mr-2.5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <span className="font-semibold">Recipient Scoping:</span> Notifications are strictly isolated to your authenticated account. Read status and timestamps persist across sessions in the database.
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className="p-3.5 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-xs sm:text-sm text-green-700 dark:text-green-300 flex items-center">
          <FiCheckCircle className="w-4 h-4 mr-2 text-green-500" />
          {feedback}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-center">
          <FiAlertCircle className="w-4 h-4 mr-2 text-red-500" />
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications by title or message..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400 w-4 h-4" />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <FiBell className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              No notifications found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {searchTerm || filter !== "all"
                ? "No notifications matched your active filter or search criteria. Try resetting them."
                : "You're completely up to date! System notifications and alerts will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {notifications.map((notif) => {
              const isUnread = !notif.isRead;
              return (
                <div
                  key={notif.id}
                  className={`p-4 transition-colors ${
                    isUnread
                      ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-l-4 border-indigo-600"
                      : "hover:bg-gray-50/70 dark:hover:bg-gray-700/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          isUnread
                            ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {getNotificationIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`text-xs sm:text-sm font-semibold ${
                              isUnread
                                ? "text-gray-900 dark:text-gray-100"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {notif.title}
                          </p>
                          {isUnread && (
                            <span className="inline-block w-2 h-2 rounded-full bg-indigo-600"></span>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <FiClock className="w-3 h-3 mr-1" />
                            {formatTimestamp(notif.createdAt)}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-full border capitalize ${getPriorityBadge(
                              notif.priority
                            )}`}
                          >
                            {notif.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {isUnread ? (
                        <button
                          type="button"
                          onClick={() => markAsRead(notif.id)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                          title="Mark as read"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markAsUnread(notif.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Mark as unread"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(notif.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 rounded hover:bg-red-50 dark:hover:bg-red-950/50"
                        title="Delete notification"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={!pagination.hasPrev || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 inline-flex items-center"
              >
                <FiChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext || loading}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 inline-flex items-center"
              >
                Next
                <FiChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
