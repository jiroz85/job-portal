import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiBell,
  FiMenu,
  FiSearch,
  FiCheck,
  FiX,
  FiActivity,
} from "react-icons/fi";
import notificationService from "../../services/notificationService";
import ThemeToggle from "../common/ThemeToggle";

const AdminHeader = ({ toggleSidebar }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchNotifs = async () => {
      try {
        const response = await notificationService.getNotifications({ limit: 5 });
        if (isMounted) {
          const items = response.data?.notifications || [];
          setNotifications(items);
          setUnreadCount(response.data?.unreadCount || 0);
        }
      } catch {
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    fetchNotifs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close notifications dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const computedUnreadCount = useMemo(
    () => (unreadCount > 0 ? unreadCount : notifications.filter((n) => !n.isRead).length),
    [unreadCount, notifications]
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "error":
        return <FiX className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <FiBell className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-xs transition-colors duration-200">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 lg:hidden"
            aria-label="Toggle navigation sidebar"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <div className="relative mx-3 lg:mx-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </span>
            <input
              disabled
              className="w-36 pl-9 pr-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md cursor-not-allowed opacity-75 sm:w-64 focus:outline-none"
              placeholder="Search disabled (use page search)"
              title="Global search across all resources is currently disabled. Please use search filters within Job Management or User Management."
              type="text"
              aria-label="Global search is disabled; use page-level search"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <ThemeToggle size="sm" />
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
              }}
              aria-expanded={isNotificationOpen}
              aria-label="Audit activity notifications"
              className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
            >
              <FiBell className="w-5 h-5" />
              {computedUnreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 w-80 sm:w-96 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Notifications
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {computedUnreadCount > 0
                        ? `${computedUnreadCount} unread notification${computedUnreadCount === 1 ? "" : "s"}`
                        : "All notifications are read"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsNotificationOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Close notifications panel"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700/60 overflow-y-auto max-h-64">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 dark:text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const isUnread = !notification.isRead;
                      return (
                        <div
                          key={notification.id}
                          onClick={async () => {
                            if (isUnread) {
                              try {
                                await notificationService.markAsRead(notification.id);
                                setNotifications((prev) =>
                                  prev.map((n) =>
                                    n.id === notification.id ? { ...n, isRead: true } : n
                                  )
                                );
                                setUnreadCount((prev) => Math.max(0, prev - 1));
                              } catch (err) {
                                console.error("Failed to mark as read:", err);
                              }
                            }
                          }}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/40 ${
                            isUnread
                              ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-indigo-600"
                              : "border-l-4 border-transparent"
                          } transition-colors`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-medium ${
                                  isUnread
                                    ? "text-gray-900 dark:text-gray-100 font-semibold"
                                    : "text-gray-700 dark:text-gray-300"
                                } line-clamp-1`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <FiBell className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                    Notifications
                  </span>
                  <Link
                    to="/admin/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
